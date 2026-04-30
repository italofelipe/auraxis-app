import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import type { CompoundInterestResult } from "@/features/tools/services/compound-interest-calculator";

export interface CompoundInterestResultCardProps {
  readonly result: CompoundInterestResult;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly onSave: () => void;
}

const formatBrl = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Renders the result summary plus the Save button for compound interest.
 * @param props Computed result and save action state.
 * @returns The result panel view.
 */
export function CompoundInterestResultCard({
  result,
  isSaving,
  isSaved,
  onSave,
}: CompoundInterestResultCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Resultado"
      description="Quanto seu dinheiro rende com aporte mensal recorrente."
    >
      <YStack gap="$2">
        <AppKeyValueRow label="Montante final" value={formatBrl(result.finalAmount)} />
        <AppKeyValueRow
          label="Total aportado"
          value={formatBrl(result.totalContributed)}
        />
        <AppKeyValueRow
          label="Juros acumulados"
          value={formatBrl(result.totalInterest)}
        />
        {isSaved ? (
          <Paragraph color="$success" fontFamily="$body" fontSize="$3">
            Simulação salva.
          </Paragraph>
        ) : null}
        <AppButton tone="primary" disabled={isSaving || isSaved} onPress={onSave}>
          {isSaving ? "Salvando…" : isSaved ? "Salva" : "Salvar simulação"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
