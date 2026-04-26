import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { useGoalPlanQuery } from "@/features/goals/hooks/use-goals-query";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export interface GoalPlanCardProps {
  readonly goalId: string;
}

const formatMonths = (months: number | null | undefined): string => {
  if (months === null || months === undefined) {
    return "-";
  }
  if (months <= 0) {
    return "Concluida";
  }
  if (months < 12) {
    return `${months} meses`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) {
    return `${years} anos`;
  }
  return `${years}a ${rest}m`;
};

const formatRate = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined) {
    return "-";
  }
  return `${(rate * 100).toFixed(1)}%`;
};

/**
 * Visual card for the goal plan endpoint.
 *
 * Pure view that pulls `useGoalPlanQuery` for the given goalId.
 */
export function GoalPlanCard({ goalId }: GoalPlanCardProps): ReactElement {
  const planQuery = useGoalPlanQuery(goalId);

  return (
    <AppSurfaceCard
      title="Plano da meta"
      description="Aporte mensal e taxa de poupanca recomendados."
    >
      <AppQueryState
        query={planQuery}
        options={{
          loading: {
            title: "Calculando plano",
            description: "Buscando o plano canonico da meta.",
          },
          empty: {
            title: "Sem plano disponivel",
            description: "Ainda nao ha calculo para essa meta.",
          },
          error: {
            fallbackTitle: "Nao foi possivel calcular o plano",
            fallbackDescription: "Tente novamente em instantes.",
          },
        }}
      >
        {(plan) => (
          <YStack gap="$3">
            <AppKeyValueRow
              label="Aporte mensal"
              value={formatCurrency(plan.monthlyContribution)}
            />
            <AppKeyValueRow
              label="Tempo estimado"
              value={formatMonths(plan.monthsToTarget)}
            />
            <AppKeyValueRow
              label="Taxa de poupanca"
              value={formatRate(plan.recommendedSavingsRate)}
            />
            {plan.disclaimer ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                {plan.disclaimer}
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}
