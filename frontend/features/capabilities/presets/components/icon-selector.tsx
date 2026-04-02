"use client";

"use client";

import * as React from "react";

import type { PresetIcon } from "@/features/capabilities/presets/lib/preset-types";
import {
  PRESET_ICON_MAP,
  PRESET_ICON_ORDER,
} from "@/features/capabilities/presets/lib/preset-visuals";
import { cn } from "@/lib/utils";

interface IconSelectorProps {
  value: PresetIcon;
  onChange: (value: PresetIcon) => void;
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  return (
    <div className="h-32 overflow-y-auto rounded-2xl border border-border/60 bg-muted/10 p-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_ICON_ORDER.map((icon) => {
          const isActive = icon === value;
          return (
            <button
              key={icon}
              type="button"
              onClick={() => onChange(icon)}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
                isActive
                  ? "border-foreground/20 bg-accent text-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:bg-accent/60",
              )}
            >
              {React.createElement(PRESET_ICON_MAP[icon], {
                className: "size-4",
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
