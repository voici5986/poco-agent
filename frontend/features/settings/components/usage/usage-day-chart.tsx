"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useT } from "@/lib/i18n/client";
import {
  formatDayLabel,
  formatNumberWithScale,
  getCompactNumberScale,
} from "@/features/settings/lib/usage-analytics";
import type { UsageAnalyticsBucket } from "@/features/settings/types";

interface UsageDayChartProps {
  day: string;
  buckets: UsageAnalyticsBucket[];
  locale: string;
}

export function UsageDayChart({ day, buckets, locale }: UsageDayChartProps) {
  const { t } = useT("translation");
  const chartConfig = React.useMemo(
    () =>
      ({
        input_tokens: {
          label: t("settings.usageTab.inputTokens"),
          color: "var(--chart-1)",
        },
        output_tokens: {
          label: t("settings.usageTab.outputTokens"),
          color: "var(--chart-2)",
        },
        cache_creation_input_tokens: {
          label: t("settings.usageTab.cacheWriteTokens"),
          color: "var(--chart-4)",
        },
        cache_read_input_tokens: {
          label: t("settings.usageTab.cacheReadTokens"),
          color: "var(--chart-5)",
        },
      }) satisfies ChartConfig,
    [t],
  );
  const yAxisScale = React.useMemo(
    () =>
      getCompactNumberScale(
        buckets.reduce(
          (maxValue, bucket) => Math.max(maxValue, bucket.total_tokens),
          0,
        ),
      ),
    [buckets],
  );

  return (
    <Card className="h-72 border-border/60 bg-card/80">
      <CardHeader className="pt-5 pb-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <CardTitle>{t("settings.usageTab.hourlyDistribution")}</CardTitle>
          <CardDescription className="text-xs leading-none">
            {t("settings.usageTab.selectedDayLabel", {
              day: formatDayLabel(day, locale),
            })}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <ChartContainer
          config={chartConfig}
          className="min-h-0 flex-1 w-full min-w-0 !aspect-auto"
        >
          <BarChart
            data={buckets}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(value: number) =>
                formatNumberWithScale(value, locale, yAxisScale, 1)
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="input_tokens"
              stackId="tokens"
              fill="var(--color-input_tokens)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="output_tokens"
              stackId="tokens"
              fill="var(--color-output_tokens)"
            />
            <Bar
              dataKey="cache_creation_input_tokens"
              stackId="tokens"
              fill="var(--color-cache_creation_input_tokens)"
            />
            <Bar
              dataKey="cache_read_input_tokens"
              stackId="tokens"
              fill="var(--color-cache_read_input_tokens)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
