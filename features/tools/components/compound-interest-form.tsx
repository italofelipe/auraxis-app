import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import type {
  CompoundInterestDraft,
  CompoundInterestErrors,
} from "@/features/tools/hooks/use-compound-interest-controller";

export interface CompoundInterestFormProps {
  readonly draft: CompoundInterestDraft;
  readonly errors: CompoundInterestErrors;
  readonly onChange: <K extends keyof CompoundInterestDraft>(
    key: K,
    value: CompoundInterestDraft[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

/**
 * Renders the input form for the Juros Compostos screen. Pure
 * presentation — calculation and validation live in the controller.
 * @param props Draft state, errors and action handlers.
 * @returns The form view.
 */
export function CompoundInterestForm({
  draft,
  errors,
  onChange,
  onSubmit,
  onReset,
}: CompoundInterestFormProps): ReactElement {
  return (
    <YStack gap="$3">
      <AppInputField
        id="ci-initial"
        label="Aporte inicial (R$)"
        keyboardType="decimal-pad"
        value={draft.initialAmount}
        onChangeText={(value) => onChange("initialAmount", value)}
        errorText={errors.initialAmount}
      />
      <AppInputField
        id="ci-monthly"
        label="Aporte mensal (R$)"
        keyboardType="decimal-pad"
        value={draft.monthlyContribution}
        onChangeText={(value) => onChange("monthlyContribution", value)}
        errorText={errors.monthlyContribution}
        helperText="Use 0 quando não houver aporte recorrente."
      />
      <AppInputField
        id="ci-rate"
        label="Taxa anual (% a.a.)"
        keyboardType="decimal-pad"
        value={draft.annualRatePercent}
        onChangeText={(value) => onChange("annualRatePercent", value)}
        errorText={errors.annualRatePercent}
      />
      <AppInputField
        id="ci-months"
        label="Prazo (meses)"
        keyboardType="number-pad"
        value={draft.months}
        onChangeText={(value) => onChange("months", value)}
        errorText={errors.months}
      />
      <XStack gap="$2">
        <AppButton tone="primary" onPress={onSubmit}>
          Calcular
        </AppButton>
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </XStack>
    </YStack>
  );
}
