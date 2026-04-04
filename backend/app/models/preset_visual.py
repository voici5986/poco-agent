from sqlalchemy import Boolean, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class PresetVisual(Base, TimestampMixin):
    __tablename__ = "preset_visuals"
    __table_args__ = (UniqueConstraint("key", name="uq_preset_visual_key"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    hash: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str] = mapped_column(String(128), nullable=False)
    source: Mapped[str] = mapped_column(String(512), nullable=False)
    managed_by: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )
