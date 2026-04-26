import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { useGoalProjectionQuery } from "@/features/goals/hooks/use-goals-query";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export interface GoalProjectionCardProps {
  readonly goalId: string;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

const formatRate = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined) {
    return "-";
  }
  return `${(rate * 100).toFixed(2)}%`;
};

/**
 * Visual card for the goal projection endpoint.
 */
export function GoalProjectionCard({
  goalId,
}: GoalProjectionCardProps): ReactElement {
  const projectionQuery = useGoalProjectionQuery(goalId);

  return (
    <AppSurfaceCard
      title="Projecao"
      description="Estimativa baseada nas premissas atuais."
    >
      <AppQueryState
        query={projectionQuery}
        options={{
          loading: {
            title: "Calculando projecao",
            description: "Buscando a projecao canonica.",
          },
          empty: {
            title: "Sem projecao disponivel",
            description: "Defina premissas para ver a projecao.",
          },
          error: {
            fallbackTitle: "Nao foi possivel calcular a projecao",
            fallbackDescription: "Tente novamente em instantes.",
          },
        }}
      >
        {(projection) => (
          <YStack gap="$3">
            <AppKeyValueRow
              label="Conclusao prevista"
              value={formatDate(projection.projectedFinishDate)}
            />
            <AppKeyValueRow
              label="Saldo projetado"
              value={
                projection.projectedAmountAtTarget !== null
                  ? formatCurrency(projection.projectedAmountAtTarget)
                  : "-"
              }
            />
            <AppKeyValueRow
              label="Premissa: aporte mensal"
              value={
                projection.assumptions.monthlyContribution !== null
                  ? formatCurrency(projection.assumptions.monthlyContribution)
                  : "-"
              }
            />
            <AppKeyValueRow
              label="Premissa: rentabilidade anual"
              value={formatRate(projection.assumptions.annualReturnRate)}
            />
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}
