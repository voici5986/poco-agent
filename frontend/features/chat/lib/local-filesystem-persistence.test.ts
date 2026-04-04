import test from "node:test";
import assert from "node:assert/strict";

import type { LocalFilesystemDraft } from "@/features/task-composer/types";

import { persistSessionLocalFilesystem } from "./local-filesystem-persistence.ts";

test("persistSessionLocalFilesystem syncs session before project defaults", async () => {
  const events: string[] = [];
  const draft: LocalFilesystemDraft = {
    filesystem_mode: "local_mount",
    local_mounts: [
      {
        id: "notes",
        name: "Notes",
        host_path: "/tmp/notes",
        access_mode: "ro",
      },
    ],
  };

  const projectResult = await persistSessionLocalFilesystem({
    sessionId: "session-1",
    projectId: "project-1",
    draft,
    persistSession: async (sessionId, payload) => {
      events.push("session");
      assert.equal(sessionId, "session-1");
      assert.deepEqual(payload.config, draft);
    },
    persistProject: async (projectId, payload) => {
      events.push("project");
      assert.equal(projectId, "project-1");
      assert.deepEqual(payload.local_mounts, draft.local_mounts);
      return { ok: true };
    },
  });

  assert.deepEqual(events, ["session", "project"]);
  assert.deepEqual(projectResult, { ok: true });
});

test("persistSessionLocalFilesystem skips project sync when session has no project", async () => {
  const draft: LocalFilesystemDraft = {
    filesystem_mode: "sandbox",
    local_mounts: [],
  };
  let projectCalls = 0;

  const projectResult = await persistSessionLocalFilesystem({
    sessionId: "session-2",
    draft,
    persistSession: async (sessionId, payload) => {
      assert.equal(sessionId, "session-2");
      assert.deepEqual(payload.config, draft);
    },
    persistProject: async () => {
      projectCalls += 1;
      return { ok: false };
    },
  });

  assert.equal(projectCalls, 0);
  assert.equal(projectResult, null);
});
