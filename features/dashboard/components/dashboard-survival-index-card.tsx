import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import {
  survivalIndexCalculator,
  type SurvivalLevel,
} from "@/features/dashboard/services/survival-index-calculator";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const LEVEL_COLOR: Record<SurvivalLevel, "$danger" | "$muted" | "$success"> = {
  danger: "$danger",
  tight: "$danger",
  comfortable: "$muted",
  robust: "$success",
};

export interface DashboardSurvivalIndexCardProps {
  readonly netWorth: number | null | undefined;
  readonly monthlyExpenses: number | null | undefined;
}

const formatMonths = (months: number | null): string => {
  if (months === null) {
    return "-";
  }
  if (months === 0) {
    return "<1 mes";
  }
  if (months === 1) {
    return "1 mes";
  }
  return `${months} meses`;
};

/**
 * Visual card for the survival-index calculation. Pure view — uses the
 * `SurvivalIndexCalculator` projection and the user's current `netWorth`
 * + `monthlyExpenses` (typically pulled from the user-profile bootstrap).
 */
export function DashboardSurvivalIndexCard({
  netWorth,
  monthlyExpenses,
}: DashboardSurvivalIndexCardProps): ReactElement {
  const assessment = survivalIndexCalculator.assess({
    netWorth: netWorth ?? 0,
    monthlyExpenses: monthlyExpenses ?? 0,
  });

  const tone = LEVEL_COLOR[assessment.level];

  return (
    <AppSurfaceCard
      title="Indice de sobrevivencia"
      description="Quanto tempo seu patrimonio cobre as despesas atuais."
    >
      <YStack gap="$2">
        <Paragraph color={tone} fontFamily="$heading" fontSize="$8">
          {formatMonths(assessment.months)}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {assessment.summary}
        </Paragraph>
      </YStack>
    </AppSurfaceCard>
  );
}
