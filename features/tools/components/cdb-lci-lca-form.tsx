import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import type {
  CdbLciLcaDraft,
  CdbLciLcaErrors,
} from "@/features/tools/hooks/use-cdb-lci-lca-controller";

export interface CdbLciLcaFormProps {
  readonly draft: CdbLciLcaDraft;
  readonly errors: CdbLciLcaErrors;
  readonly onChange: <K extends keyof CdbLciLcaDraft>(
    key: K,
    value: CdbLciLcaDraft[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

/**
 * Renders the input form for the CDB · LCI · LCA comparator screen.
 * @param props Draft state, errors and action handlers.
 * @returns The form view.
 */
export function CdbLciLcaForm({
  draft,
  errors,
  onChange,
  onSubmit,
  onReset,
}: CdbLciLcaFormProps): ReactElement {
  const isCdiPercent = draft.rateKind === "cdi_percent";
  return (
    <YStack gap="$3">
      <AppInputField
        id="cdb-amount"
        label="Valor investido (R$)"
        keyboardType="decimal-pad"
        value={draft.amount}
        onChangeText={(value) => onChange("amount", value)}
        errorText={errors.amount}
      />
      <AppInputField
        id="cdb-months"
        label="Prazo (meses)"
        keyboardType="number-pad"
        value={draft.months}
        onChangeText={(value) => onChange("months", value)}
        errorText={errors.months}
      />
      <YStack gap="$2">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Tipo de taxa
        </Paragraph>
        <XStack gap="$2">
          <AppButton
            tone={isCdiPercent ? "primary" : "secondary"}
            onPress={() => onChange("rateKind", "cdi_percent")}
          >
            % do CDI
          </AppButton>
          <AppButton
            tone={isCdiPercent ? "secondary" : "primary"}
            onPress={() => onChange("rateKind", "prefixed")}
          >
            Prefixada
          </AppButton>
        </XStack>
      </YStack>
      <AppInputField
        id="cdb-rate"
        label={isCdiPercent ? "% do CDI" : "Taxa anual (% a.a.)"}
        keyboardType="decimal-pad"
        value={draft.rateValue}
        onChangeText={(value) => onChange("rateValue", value)}
        errorText={errors.rateValue}
      />
      {isCdiPercent ? (
        <AppInputField
          id="cdb-cdi"
          label="CDI anual atual (% a.a.)"
          keyboardType="decimal-pad"
          value={draft.cdiAnnualPercent}
          onChangeText={(value) => onChange("cdiAnnualPercent", value)}
          errorText={errors.cdiAnnualPercent}
        />
      ) : null}
      <XStack gap="$2">
        <AppButton tone="primary" onPress={onSubmit}>
          Comparar
        </AppButton>
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </XStack>
    </YStack>
  );
}
