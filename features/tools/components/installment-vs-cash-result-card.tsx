import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from "@/shared/utils/formatters";
import type {
  InstallmentVsCashCalculation,
  SelectedPaymentOption,
} from "@/features/tools/contracts";
import { getRecommendationLabel } from "@/shared/validators/installment-vs-cash";

export interface InstallmentVsCashResultCardProps {
  readonly calculation: InstallmentVsCashCalculation;
  readonly selectedOption: SelectedPaymentOption;
  readonly isSaving: boolean;
  readonly isCreatingGoal: boolean;
  readonly isCreatingPlannedExpense: boolean;
  readonly hasPremiumAccess: boolean;
  readonly onSelectedOptionChange: (value: SelectedPaymentOption) => void;
  readonly onSave: () => void;
  readonly onCreateGoal: () => void;
  readonly onCreatePlannedExpense: () => void;
}

function RecommendationSummary({
  calculation,
}: {
  readonly calculation: InstallmentVsCashCalculation;
}): ReactElement {
  const comparison = calculation.result.comparison;
  const snapshot = calculation.result.indicatorSnapshot;

  return (
    <AppSurfaceCard
      title={getRecommendationLabel(calculation.result.recommendedOption)}
      description={calculation.result.recommendationReason}>
      <YStack gap="$2">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Premissas rapidas: taxa {formatPercent(
            calculation.result.assumptions.opportunityRateAnnualPercent,
          )}, inflacao {formatPercent(
            calculation.result.assumptions.inflationRateAnnualPercent,
          )} e primeira parcela em{" "}
          {calculation.result.assumptions.firstPaymentDelayDays} dias.
        </Paragraph>
        <XStack gap="$3" flexWrap="wrap">
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              A vista
            </Paragraph>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {formatCurrency(comparison.cashOptionTotal)}
            </Paragraph>
          </YStack>
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Parcelado nominal
            </Paragraph>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {formatCurrency(comparison.installmentOptionTotal)}
            </Paragraph>
          </YStack>
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Valor presente do parcelado
            </Paragraph>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {formatCurrency(comparison.installmentPresentValue)}
            </Paragraph>
          </YStack>
        </XStack>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Break-even: desconto minimo de {formatPercent(
            comparison.breakEvenDiscountPercent,
          )} ou taxa de oportunidade anual de{" "}
          {formatPercent(comparison.breakEvenOpportunityRateAnnual)}.
        </Paragraph>
        {snapshot ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            Indicador Auraxis: {snapshot.source} em {formatShortDate(snapshot.asOf)}.
          </Paragraph>
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}

function PlanningActionsCard({
  selectedOption,
  isSaving,
  isCreatingGoal,
  isCreatingPlannedExpense,
  hasPremiumAccess,
  onSelectedOptionChange,
  onSave,
  onCreateGoal,
  onCreatePlannedExpense,
}: Omit<InstallmentVsCashResultCardProps, "calculation">): ReactElement {
  return (
    <AppSurfaceCard
      title="Salvar no planejamento"
      description="Escolha qual forma de pagamento deve orientar a meta ou a despesa planejada.">
      <YStack gap="$3">
        <XStack gap="$2">
          <AppButton
            flex={1}
            tone={selectedOption === "cash" ? "primary" : "secondary"}
            onPress={() => onSelectedOptionChange("cash")}>
            A vista
          </AppButton>
          <AppButton
            flex={1}
            tone={selectedOption === "installment" ? "primary" : "secondary"}
            onPress={() => onSelectedOptionChange("installment")}>
            Parcelado
          </AppButton>
        </XStack>
        <AppButton tone="secondary" onPress={onSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar simulacao"}
        </AppButton>
        <AppButton tone="secondary" onPress={onCreateGoal} disabled={isCreatingGoal}>
          {isCreatingGoal
            ? "Criando meta..."
            : hasPremiumAccess
              ? "Transformar em meta"
              : "Meta (Premium)"}
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={onCreatePlannedExpense}
          disabled={isCreatingPlannedExpense}>
          {isCreatingPlannedExpense
            ? "Planejando despesa..."
            : hasPremiumAccess
              ? "Planejar despesa"
              : "Despesa planejada (Premium)"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

export function InstallmentVsCashResultCard({
  calculation,
  selectedOption,
  isSaving,
  isCreatingGoal,
  isCreatingPlannedExpense,
  hasPremiumAccess,
  onSelectedOptionChange,
  onSave,
  onCreateGoal,
  onCreatePlannedExpense,
}: InstallmentVsCashResultCardProps): ReactElement {
  return (
    <YStack gap="$3">
      <RecommendationSummary calculation={calculation} />
      <PlanningActionsCard
        selectedOption={selectedOption}
        isSaving={isSaving}
        isCreatingGoal={isCreatingGoal}
        isCreatingPlannedExpense={isCreatingPlannedExpense}
        hasPremiumAccess={hasPremiumAccess}
        onSelectedOptionChange={onSelectedOptionChange}
        onSave={onSave}
        onCreateGoal={onCreateGoal}
        onCreatePlannedExpense={onCreatePlannedExpense}
      />
    </YStack>
  );
}
