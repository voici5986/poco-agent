import json
import re
from typing import Any

from app.core.settings import get_settings
from app.im.schemas.im_message import InboundMessage

_LEADING_MENTION_RE = re.compile(r"^(?:<at\s+[^>]*>.*?</at>\s*)+", re.IGNORECASE)
_AT_TAG_RE = re.compile(r"<at\s+([^>]*?)>(.*?)</at>", re.IGNORECASE | re.DOTALL)
_AT_ID_ATTR_RE = re.compile(
    r"(?:user_id|open_id|union_id|id)\s*=\s*[\"']?([^\"'\s>]+)",
    re.IGNORECASE,
)


def parse_feishu_webhook_event(payload: dict[str, Any]) -> InboundMessage | None:
    header = payload.get("header")
    event = payload.get("event")
    return _build_inbound_message(header=header, event=event, raw=payload)


def parse_feishu_stream_event(data: Any) -> InboundMessage | None:
    header = _read_field(data, "header")
    event = _read_field(data, "event")
    raw = _try_dump_dict(data)
    return _build_inbound_message(header=header, event=event, raw=raw)


def extract_text(content: Any) -> str:
    if isinstance(content, str):
        stripped = content.strip()
        if not stripped:
            return ""
        try:
            parsed = json.loads(stripped)
        except json.JSONDecodeError:
            return stripped
        text = _read_field(parsed, "text")
        if isinstance(text, str):
            return text.strip()
        return stripped

    text = _read_field(content, "text")
    if isinstance(text, str):
        return text.strip()

    return ""


def extract_sender_id(sender: Any) -> str | None:
    sender_id = _read_field(sender, "sender_id")
    for key in ("open_id", "user_id", "union_id"):
        value = _read_field(sender_id, key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    for key in ("open_id", "user_id", "union_id"):
        value = _read_field(sender, key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def clean_text(text: str) -> str:
    cleaned = _normalize_text(text)
    while True:
        matched = _LEADING_MENTION_RE.match(cleaned)
        if not matched:
            break
        cleaned = cleaned[matched.end() :].strip()
    return cleaned


def _build_inbound_message(
    *,
    header: Any,
    event: Any,
    raw: dict[str, Any] | None,
) -> InboundMessage | None:
    if event is None:
        return None

    event_type = str(_read_field(header, "event_type") or "").strip()
    if event_type and event_type not in {
        "im.message.receive_v1",
        "p2.im.message.receive_v1",
    }:
        return None

    message = _read_field(event, "message")
    if message is None:
        return None

    message_type = str(_read_field(message, "message_type") or "").strip().lower()
    if message_type and message_type != "text":
        return None

    chat_id = str(_read_field(message, "chat_id") or "").strip()
    if not chat_id:
        return None

    sender = _read_field(event, "sender")
    sender_type = str(_read_field(sender, "sender_type") or "").strip().lower()
    if sender_type and sender_type != "user":
        return None

    raw_text = extract_text(_read_field(message, "content"))
    chat_type = str(_read_field(message, "chat_type") or "").strip().lower()
    mentions = _read_field(message, "mentions")
    if _requires_explicit_mention(chat_type) and not _has_explicit_mention(
        raw_text=raw_text,
        mentions=mentions,
    ):
        return None

    text = clean_text(raw_text)
    if not text:
        text = "/help"

    message_id = str(
        _read_field(message, "message_id") or _read_field(header, "event_id") or ""
    ).strip()

    return InboundMessage(
        provider="feishu",
        destination=chat_id,
        message_id=message_id,
        sender_id=extract_sender_id(sender),
        text=text,
        raw=raw,
    )


def _read_field(value: Any, key: str) -> Any:
    if value is None:
        return None
    if isinstance(value, dict):
        return value.get(key)
    return getattr(value, key, None)


def _try_dump_dict(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value

    model_dump = getattr(value, "model_dump", None)
    if callable(model_dump):
        try:
            dumped = model_dump()
        except Exception:
            dumped = None
        if isinstance(dumped, dict):
            return dumped

    to_dict = getattr(value, "to_dict", None)
    if callable(to_dict):
        try:
            dumped = to_dict()
        except Exception:
            dumped = None
        if isinstance(dumped, dict):
            return dumped

    return None


def _normalize_text(text: str) -> str:
    return (text or "").replace("\u2005", " ").replace("\u2006", " ").strip()


def _requires_explicit_mention(chat_type: str) -> bool:
    return chat_type != "p2p"


def _has_explicit_mention(*, raw_text: str, mentions: Any) -> bool:
    normalized = _normalize_text(raw_text)
    if not normalized:
        return False

    bot_ids, bot_names = _bot_identity_candidates()

    tag_mentions = _extract_leading_at_mentions(normalized)
    if tag_mentions:
        return _leading_mentions_include_bot(
            tag_mentions,
            mentions=mentions,
            bot_ids=bot_ids,
            bot_names=bot_names,
        )

    plain_mentions = _extract_leading_plain_mentions(normalized)
    if plain_mentions:
        return _leading_mentions_include_bot(
            plain_mentions,
            mentions=mentions,
            bot_ids=bot_ids,
            bot_names=bot_names,
        )

    return False


def _bot_identity_candidates() -> tuple[set[str], set[str]]:
    settings = get_settings()

    ids = {
        value.strip()
        for value in (
            settings.feishu_app_id,
            settings.feishu_bot_user_id,
            settings.feishu_bot_open_id,
            settings.feishu_bot_union_id,
        )
        if isinstance(value, str) and value.strip()
    }
    names = {
        _normalize_name(value)
        for value in (settings.feishu_bot_name,)
        if isinstance(value, str) and value.strip()
    }
    return ids, names


def _extract_leading_at_mentions(text: str) -> list[dict[str, str]]:
    matched = _LEADING_MENTION_RE.match(text)
    if not matched:
        return []

    items: list[dict[str, str]] = []
    for tag_match in _AT_TAG_RE.finditer(matched.group(0)):
        attrs = tag_match.group(1) or ""
        display_name = _normalize_name(_strip_xml(tag_match.group(2) or ""))
        candidate_ids = {
            attr_match.group(1).strip()
            for attr_match in _AT_ID_ATTR_RE.finditer(attrs)
            if attr_match.group(1).strip()
        }
        items.append(
            {
                "name": display_name,
                "ids": "\n".join(sorted(candidate_ids)),
            }
        )
    return items


def _extract_leading_plain_mentions(text: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    remaining = text
    while True:
        if not remaining.startswith(("@", "\uff20")):
            break
        parts = remaining.split(maxsplit=1)
        token = parts[0]
        mention_name = _normalize_name(token[1:])
        items.append({"name": mention_name, "ids": ""})
        if len(parts) == 1:
            break
        remaining = parts[1].strip()
    return items


def _leading_mentions_include_bot(
    leading_mentions: list[dict[str, str]],
    *,
    mentions: Any,
    bot_ids: set[str],
    bot_names: set[str],
) -> bool:
    for mention in leading_mentions:
        if _mention_matches_bot(
            mention_name=mention.get("name") or "",
            mention_ids=_split_ids(mention.get("ids") or ""),
            bot_ids=bot_ids,
            bot_names=bot_names,
        ):
            return True

    if not isinstance(mentions, list):
        return False

    for mention in mentions[: len(leading_mentions)]:
        if _mention_matches_bot(
            mention_name=_normalize_name(str(_read_field(mention, "name") or "")),
            mention_ids=_read_mention_ids(mention),
            bot_ids=bot_ids,
            bot_names=bot_names,
        ):
            return True

    return False


def _mention_matches_bot(
    *,
    mention_name: str,
    mention_ids: set[str],
    bot_ids: set[str],
    bot_names: set[str],
) -> bool:
    if mention_ids and bot_ids and mention_ids.intersection(bot_ids):
        return True
    if mention_name and bot_names and mention_name in bot_names:
        return True
    return False


def _read_mention_ids(mention: Any) -> set[str]:
    values: set[str] = set()

    mention_id = _read_field(mention, "id")
    for source in (mention, mention_id):
        for key in ("user_id", "open_id", "union_id"):
            value = _read_field(source, key)
            if isinstance(value, str) and value.strip():
                values.add(value.strip())

    return values


def _normalize_name(value: str) -> str:
    return (value or "").strip().casefold()


def _split_ids(raw: str) -> set[str]:
    return {part for part in raw.split("\n") if part}


def _strip_xml(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()
