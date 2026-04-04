import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRESET_VISUAL_KEY,
  getPresetFormInitialVisualKey,
  isPresetFormValid,
} from "./preset-form.ts";

test("getPresetFormInitialVisualKey falls back to the default built-in visual", () => {
  assert.equal(
    getPresetFormInitialVisualKey(undefined),
    DEFAULT_PRESET_VISUAL_KEY,
  );
  assert.equal(getPresetFormInitialVisualKey("   "), DEFAULT_PRESET_VISUAL_KEY);
});

test("getPresetFormInitialVisualKey preserves an existing visual key", () => {
  assert.equal(
    getPresetFormInitialVisualKey("  preset-visual-08  "),
    "preset-visual-08",
  );
});

test("isPresetFormValid requires both a preset name and visual key", () => {
  assert.equal(
    isPresetFormValid({
      name: "Frontend delivery",
      visualKey: "preset-visual-01",
    }),
    true,
  );
  assert.equal(
    isPresetFormValid({ name: "  ", visualKey: "preset-visual-01" }),
    false,
  );
  assert.equal(
    isPresetFormValid({ name: "Frontend delivery", visualKey: "   " }),
    false,
  );
});
