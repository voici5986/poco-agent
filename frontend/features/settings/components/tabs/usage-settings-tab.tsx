"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { UsageDayChart } from "@/features/settings/components/usage/usage-day-chart";
import { UsageMonthChart } from "@/features/settings/components/usage/usage-month-chart";
import { UsageSummaryCards } from "@/features/settings/components/usage/usage-summary-cards";
import type { UsageAnalyticsState } from "@/features/settings/hooks/use-usage-analytics";
import {
  formatDayLabel,
  formatMonthLabel,
} from "@/features/settings/lib/usage-analytics";

function UsageLoadingSkeleton() {
  return (
    <div className="space-y-4 p-5 pt-3">
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-xl border border-border bg-muted/50"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/50" />
        <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
    </div>
  );
}

interface UsageToolbarProps {
  monthLabel: string;
  isLoading: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onRefresh: () => void;
  showMonthLabel?: boolean;
  className?: string;
}

export function UsageToolbar({
  monthLabel,
  isLoading,
  onPreviousMonth,
  onNextMonth,
  onRefresh,
  showMonthLabel = true,
  className,
}: UsageToolbarProps) {
  const { t } = useT("translation");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      {showMonthLabel ? (
        <div className="text-lg font-semibold tracking-tight text-foreground/90">
          {monthLabel}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPreviousMonth}
          aria-label={t("settings.usageTab.previousMonth")}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          aria-label={t("settings.usageTab.nextMonth")}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label={t("settings.usageTab.refresh")}
          title={t("settings.usageTab.refresh")}
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}

interface UsageSettingsTabProps {
  usageAnalytics: UsageAnalyticsState;
  showInlineToolbar?: boolean;
}

export function UsageSettingsTab({
  usageAnalytics,
  showInlineToolbar = false,
}: UsageSettingsTabProps) {
  const { t, i18n } = useT("translation");
  const {
    data,
    error,
    isLoading,
    activeMonth,
    activeDay,
    goToNextMonth,
    goToPreviousMonth,
    refresh,
    selectDay,
  } = usageAnalytics;

  if (isLoading && !data) {
    return <UsageLoadingSkeleton />;
  }

  if (!data) {
    return (
      <div className="p-6 pt-3">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="text-sm text-muted-foreground">
              {error || t("settings.usageTab.loadFailed")}
            </div>
            <Button onClick={refresh} variant="outline">
              {t("settings.usageTab.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthLabel = formatMonthLabel(activeMonth, i18n.language);
  const dayLabel = formatDayLabel(data.day, i18n.language);
  const hasAnyUsage = data.summary.all_time.total_tokens > 0;

  return (
    <div className="flex-1 overflow-y-auto p-5 pt-3">
      <div className="space-y-5">
        {showInlineToolbar ? (
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4 md:hidden">
            <UsageToolbar
              monthLabel={monthLabel}
              isLoading={isLoading}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onRefresh={refresh}
            />
          </div>
        ) : null}

        {error ? (
          <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="text-sm text-muted-foreground">
                {error || t("settings.usageTab.loadFailed")}
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                {t("settings.usageTab.retry")}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <UsageSummaryCards
          summary={data.summary}
          locale={i18n.language}
          monthLabel={monthLabel}
          dayLabel={dayLabel}
        />

        {hasAnyUsage ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <UsageMonthChart
              buckets={data.month_view.buckets}
              activeDay={activeDay}
              locale={i18n.language}
              onSelectDay={selectDay}
            />
            <UsageDayChart
              day={data.day_view.day}
              buckets={data.day_view.buckets}
              locale={i18n.language}
            />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("settings.usageTab.empty")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
