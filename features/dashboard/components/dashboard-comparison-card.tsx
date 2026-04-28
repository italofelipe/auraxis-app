import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import {
  resolveComparisonDirection,
  type ComparisonDirection,
} from "@/features/dashboard/services/period-comparison";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";
import { formatCurrency } from "@/shared/utils/formatters";

export interface DashboardComparisonCardProps {
  readonly title: string;
  readonly value: number;
  readonly delta: number | null;
  readonly percent: number | null;
  /**
   * When `true`, an up direction is positive (green). For expenses pass
   * `false` so an increase reads as red.
   */
  readonly positiveIsGood?: boolean;
  readonly testID?: string;
}

const formatPercent = (percent: number): string => {
  if (!Number.isFinite(percent)) {
    return percent > 0 ? "↑ ∞" : "↓ ∞";
  }
  const pct = (percent * 100).toFixed(1);
  return `${pct}%`;
};

const resolveTone = (
  direction: ComparisonDirection,
  positiveIsGood: boolean,
): "good" | "bad" | "neutral" => {
  if (direction === "flat") {
    return "neutral";
  }
  if (direction === "up") {
    return positiveIsGood ? "good" : "bad";
  }
  return positiveIsGood ? "bad" : "good";
};

const iconByDirection: Record<
  ComparisonDirection,
  React.ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  up: "trending-up",
  down: "trending-down",
  flat: "minus",
};

/**
 * Metric card that pairs the current value with a delta vs the
 * previous period. Designed to drop into the dashboard grid without
 * extra layout glue.
 */
export function DashboardComparisonCard({
  title,
  value,
  delta,
  percent,
  positiveIsGood = true,
  testID,
}: DashboardComparisonCardProps): ReactElement {
  const { t } = useT();
  const theme = useTheme();
  const hasBaseline = delta !== null && percent !== null;
  const direction = hasBaseline ? resolveComparisonDirection(delta) : "flat";
  const tone = resolveTone(direction, positiveIsGood);
  const colorByTone: Record<typeof tone, string> = {
    good: theme.success?.val ?? "#1f9d55",
    bad: theme.danger?.val ?? "#c53030",
    neutral: theme.muted?.val ?? "#8a8a8a",
  };

  return (
    <AppSurfaceCard testID={testID}>
      <YStack gap="$2">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          {title}
        </Paragraph>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          {formatCurrency(value)}
        </Paragraph>
        {hasBaseline ? (
          <XStack gap="$1" alignItems="center">
            <MaterialCommunityIcons
              name={iconByDirection[direction]}
              size={14}
              color={colorByTone[tone]}
            />
            <Paragraph color={colorByTone[tone]} fontFamily="$body" fontSize="$3">
              {formatPercent(percent)}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              {t("dashboard.comparison.vsPrevious")}
            </Paragraph>
          </XStack>
        ) : (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {t("dashboard.comparison.noBaseline")}
          </Paragraph>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}
