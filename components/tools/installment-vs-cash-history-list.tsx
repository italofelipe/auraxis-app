import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency, formatShortDate } from "@/shared/utils/formatters";
import { getRecommendationLabel } from "@/shared/validators/installment-vs-cash";
import type { InstallmentVsCashSavedSimulation } from "@/types/contracts";

export interface InstallmentVsCashHistoryListProps {
  readonly items: readonly InstallmentVsCashSavedSimulation[];
}

export function InstallmentVsCashHistoryList({
  items,
}: InstallmentVsCashHistoryListProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Ultimas simulacoes salvas"
      description="Historico recente da sua analise parcelado vs a vista.">
      <YStack gap="$3">
        {items.map((item) => (
          <AppSurfaceCard
            key={item.id}
            backgroundColor="$surfaceRaised"
            title={item.inputs.scenarioLabel ?? "Simulacao sem nome"}
            description={getRecommendationLabel(item.result.recommendedOption)}>
            <YStack gap="$1">
              <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                Salva em {formatShortDate(item.createdAt)}
              </Paragraph>
              <Paragraph color="$color" fontFamily="$body" fontSize="$3">
                A vista: {formatCurrency(item.result.comparison.cashOptionTotal)}
              </Paragraph>
              <Paragraph color="$color" fontFamily="$body" fontSize="$3">
                Valor presente do parcelado:{" "}
                {formatCurrency(item.result.comparison.installmentPresentValue)}
              </Paragraph>
            </YStack>
          </AppSurfaceCard>
        ))}
      </YStack>
    </AppSurfaceCard>
  );
}
