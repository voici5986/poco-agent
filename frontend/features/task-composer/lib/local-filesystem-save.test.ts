import test from "node:test";
import assert from "node:assert/strict";

import type { LocalFilesystemDraft } from "@/features/task-composer/types";

import { saveLocalFilesystemDraft } from "./local-filesystem-save.ts";

test("saveLocalFilesystemDraft persists external state before applying local draft", async () => {
  const events: string[] = [];
  const draft: LocalFilesystemDraft = {
    filesystem_mode: "local_mount",
    local_mounts: [
      {
        id: "workspace",
        name: "Workspace",
        host_path: "/workspace",
        access_mode: "rw",
      },
    ],
  };

  await saveLocalFilesystemDraft({
    draft,
    persistDraft: async (nextDraft) => {
      events.push("persist");
      assert.deepEqual(nextDraft, draft);
    },
    applyDraft: (nextDraft) => {
      events.push("apply");
      assert.deepEqual(nextDraft, draft);
    },
  });

  assert.deepEqual(events, ["persist", "apply"]);
});

test("saveLocalFilesystemDraft preserves empty mount lists when syncing sandbox mode", async () => {
  let appliedDraft: LocalFilesystemDraft | null = null;
  const draft: LocalFilesystemDraft = {
    filesystem_mode: "sandbox",
    local_mounts: [],
  };

  await saveLocalFilesystemDraft({
    draft,
    persistDraft: async (nextDraft) => {
      assert.deepEqual(nextDraft.local_mounts, []);
    },
    applyDraft: (nextDraft) => {
      appliedDraft = nextDraft;
    },
  });

  assert.deepEqual(appliedDraft, draft);
});
