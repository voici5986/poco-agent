export const DEFAULT_PRESET_VISUAL_KEY = "preset-visual-01";

interface PresetFormValidityInput {
  name: string;
  visualKey: string;
}

export function getPresetFormInitialVisualKey(
  visualKey?: string | null,
): string {
  const normalizedVisualKey = visualKey?.trim();
  return normalizedVisualKey || DEFAULT_PRESET_VISUAL_KEY;
}

export function isPresetFormValid({
  name,
  visualKey,
}: PresetFormValidityInput): boolean {
  return Boolean(name.trim()) && Boolean(visualKey.trim());
}
