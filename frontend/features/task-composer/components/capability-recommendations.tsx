"use client";

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CapabilitySourceAvatar } from "@/features/capabilities/components/capability-source-avatar";
import type { CapabilityRecommendation } from "@/features/task-composer/types/capability-recommendation";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface CapabilityRecommendationsProps {
  recommendations: CapabilityRecommendation[];
  trackedItems: CapabilityRecommendation[];
  isLoading: boolean;
  showEmptyState: boolean;
  isEnabled: (item: CapabilityRecommendation) => boolean;
  onToggle: (item: CapabilityRecommendation, enabled: boolean) => void;
}

function getCapabilityTypeLabel(
  item: CapabilityRecommendation,
  t: (key: string) => string,
) {
  return item.type === "mcp"
    ? t("hero.capabilityRecommendations.mcpLabel")
    : t("hero.capabilityRecommendations.skillLabel");
}

interface RecommendationCardProps {
  item: CapabilityRecommendation;
  enabled: boolean;
  onToggle: (item: CapabilityRecommendation, enabled: boolean) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function RecommendationCard({
  item,
  enabled,
  onToggle,
  t,
}: RecommendationCardProps) {
  const toggleLabel = enabled
    ? t("hero.capabilityRecommendations.remove", { name: item.name })
    : `${t("hero.capabilityRecommendations.useForTask")}: ${item.name}`;

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={toggleLabel}
      onClick={() => onToggle(item, !enabled)}
      title={toggleLabel}
      className="group h-full min-h-[72px] w-full rounded-xl border border-border/40 bg-background/70 px-3 py-3 text-left transition-[border-color,background-color] hover:border-border/70 hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex min-w-0 items-start gap-3">
        <CapabilitySourceAvatar
          name={item.name}
          status={enabled ? "active" : "inactive"}
          className="size-9"
          statusDotClassName={enabled ? "bg-primary" : undefined}
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {item.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-xs",
                enabled
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "text-muted-foreground",
              )}
            >
              {getCapabilityTypeLabel(item, t)}
            </Badge>
          </div>

          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {item.description ||
              t("hero.capabilityRecommendations.noDescription")}
          </p>
        </div>
      </div>
    </button>
  );
}

export function CapabilityRecommendations({
  recommendations,
  trackedItems,
  isLoading,
  showEmptyState,
  isEnabled,
  onToggle,
}: CapabilityRecommendationsProps) {
  const { t } = useT("translation");
  const itemsToRender: CapabilityRecommendation[] = [];
  const seenKeys = new Set<string>();

  for (const item of recommendations) {
    const key = `${item.type}:${item.id}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    itemsToRender.push(item);
  }

  for (const item of trackedItems) {
    const key = `${item.type}:${item.id}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    itemsToRender.push(item);
  }

  if (!isLoading && itemsToRender.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <div className="border-t border-border/60 px-4 py-2.5">
      <div className="space-y-2.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-3.5" />
              <span>{t("hero.capabilityRecommendations.title")}</span>
            </div>
            {isLoading ? (
              <span className="text-xs text-muted-foreground">
                {t("hero.capabilityRecommendations.loading")}
              </span>
            ) : null}
          </div>

          {itemsToRender.length > 0 ? (
            <div className="grid auto-rows-fr grid-cols-3 gap-2">
              {itemsToRender.map((item) => (
                <RecommendationCard
                  key={`${item.type}:${item.id}`}
                  item={item}
                  enabled={isEnabled(item)}
                  onToggle={onToggle}
                  t={t}
                />
              ))}
            </div>
          ) : showEmptyState && !isLoading ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
              {t("hero.capabilityRecommendations.empty")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
