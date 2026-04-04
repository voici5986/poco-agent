import type { LocalFilesystemDraft } from "@/features/task-composer/types";

interface SaveLocalFilesystemDraftArgs {
  draft: LocalFilesystemDraft;
  persistDraft?: (draft: LocalFilesystemDraft) => Promise<void> | void;
  applyDraft: (draft: LocalFilesystemDraft) => void;
}

export async function saveLocalFilesystemDraft({
  draft,
  persistDraft,
  applyDraft,
}: SaveLocalFilesystemDraftArgs): Promise<void> {
  if (persistDraft) {
    await persistDraft(draft);
  }

  applyDraft(draft);
}
