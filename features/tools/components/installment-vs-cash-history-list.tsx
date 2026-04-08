import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency, formatShortDate } from "@/shared/utils/formatters";
import type { InstallmentVsCashSavedSimulation } from "@/features/tools/contracts";
import { getRecommendationLabel } from "@/shared/validators/installment-vs-cash";

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
              <AppKeyValueRow
                label="A vista"
                value={formatCurrency(item.result.comparison.cashOptionTotal)}
              />
              <AppKeyValueRow
                label="Valor presente do parcelado"
                value={formatCurrency(item.result.comparison.installmentPresentValue)}
              />
            </YStack>
          </AppSurfaceCard>
        ))}
      </YStack>
    </AppSurfaceCard>
  );
}
