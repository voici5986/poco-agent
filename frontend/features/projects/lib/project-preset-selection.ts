import type { Preset } from "../../capabilities/presets/lib/preset-types.ts";

export interface ProjectPresetCardState {
  selected: boolean;
  iconTone: "accent" | "muted";
  cardBackgroundColor?: string;
}

function buildTintedSurface(color: string): string {
  if (!color.startsWith("#")) {
    return "color-mix(in srgb, var(--primary) 10%, transparent)";
  }
  return `${color}10`;
}

export function filterProjectPresets(
  presets: Preset[],
  query: string,
): Preset[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return presets;
  }

  return presets.filter((preset) => {
    return (
      preset.name.toLowerCase().includes(normalizedQuery) ||
      (preset.description ?? "").toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getProjectPresetCardState(
  preset: Preset,
  activeDefaultPresetId: number | null,
): ProjectPresetCardState {
  const selected = activeDefaultPresetId === preset.preset_id;
  const accentColor = preset.color || "var(--primary)";

  if (!selected) {
    return {
      selected: false,
      iconTone: "muted",
    };
  }

  return {
    selected: true,
    iconTone: "accent",
    cardBackgroundColor: buildTintedSurface(accentColor),
  };
}
