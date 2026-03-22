import type { ReactElement } from "react";

import { Paragraph, Switch, XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import type {
  InstallmentDelayPreset,
  InstallmentInputMode,
  InstallmentVsCashFormDraft,
  InstallmentVsCashFormErrors,
} from "@/shared/validators/installment-vs-cash";
import type { OpportunityRateType } from "@/types/contracts";

type TextFieldName =
  | "scenarioLabel"
  | "cashPrice"
  | "installmentCount"
  | "installmentAmount"
  | "installmentTotal"
  | "customFirstPaymentDelayDays"
  | "opportunityRateAnnual"
  | "inflationRateAnnual"
  | "feesUpfront";

export interface InstallmentVsCashFormProps {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly isSubmitting: boolean;
  readonly onTextChange: (field: TextFieldName, value: string) => void;
  readonly onInstallmentModeChange: (value: InstallmentInputMode) => void;
  readonly onDelayPresetChange: (value: InstallmentDelayPreset) => void;
  readonly onOpportunityRateTypeChange: (value: OpportunityRateType) => void;
  readonly onFeesEnabledChange: (value: boolean) => void;
  readonly onSubmit: () => void;
}

const DELAY_PRESETS: readonly {
  readonly value: InstallmentDelayPreset;
  readonly label: string;
}[] = [
  { value: "today", label: "Hoje" },
  { value: "30_days", label: "30 dias" },
  { value: "45_days", label: "45 dias" },
  { value: "custom", label: "Outro" },
] as const;

const OPPORTUNITY_RATE_TYPES: readonly {
  readonly value: OpportunityRateType;
  readonly label: string;
}[] = [
  { value: "manual", label: "Manual" },
  { value: "product_default", label: "Preset Auraxis" },
  { value: "inflation_only", label: "Apenas inflacao" },
] as const;

function InstallmentModeSelector({
  value,
  onChange,
}: {
  readonly value: InstallmentInputMode;
  readonly onChange: (value: InstallmentInputMode) => void;
}): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Como voce quer informar o parcelamento?
      </Paragraph>
      <XStack gap="$2">
        <AppButton
          flex={1}
          tone={value === "total" ? "primary" : "secondary"}
          onPress={() => onChange("total")}>
          Total parcelado
        </AppButton>
        <AppButton
          flex={1}
          tone={value === "amount" ? "primary" : "secondary"}
          onPress={() => onChange("amount")}>
          Valor da parcela
        </AppButton>
      </XStack>
    </YStack>
  );
}

function DelayPresetSelector({
  value,
  onChange,
}: {
  readonly value: InstallmentDelayPreset;
  readonly onChange: (value: InstallmentDelayPreset) => void;
}): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Quando a primeira parcela vence?
      </Paragraph>
      <XStack flexWrap="wrap" gap="$2">
        {DELAY_PRESETS.map((preset) => (
          <AppButton
            key={preset.value}
            tone={value === preset.value ? "primary" : "secondary"}
            onPress={() => onChange(preset.value)}>
            {preset.label}
          </AppButton>
        ))}
      </XStack>
    </YStack>
  );
}

function OpportunityRateSelector({
  value,
  onChange,
}: {
  readonly value: OpportunityRateType;
  readonly onChange: (value: OpportunityRateType) => void;
}): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Taxa de oportunidade
      </Paragraph>
      <XStack flexWrap="wrap" gap="$2">
        {OPPORTUNITY_RATE_TYPES.map((option) => (
          <AppButton
            key={option.value}
            tone={value === option.value ? "primary" : "secondary"}
            onPress={() => onChange(option.value)}>
            {option.label}
          </AppButton>
        ))}
      </XStack>
    </YStack>
  );
}

function FeesToggleField({
  enabled,
  onChange,
}: {
  readonly enabled: boolean;
  readonly onChange: (value: boolean) => void;
}): ReactElement {
  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <Paragraph color="$color" fontFamily="$body" fontSize="$3">
          Incluir custos extras?
        </Paragraph>
        <Switch checked={enabled} onCheckedChange={(value) => onChange(Boolean(value))}>
          <Switch.Thumb />
        </Switch>
      </XStack>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Ative se houver tarifas, entrada ou custos iniciais que mudem a conta.
      </Paragraph>
    </YStack>
  );
}

function ScenarioPricingFields({
  draft,
  errors,
  onTextChange,
  onInstallmentModeChange,
}: {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly onTextChange: (field: TextFieldName, value: string) => void;
  readonly onInstallmentModeChange: (value: InstallmentInputMode) => void;
}): ReactElement {
  return (
    <>
      <AppInputField
        id="scenarioLabel"
        label="Nome do cenario"
        helperText="Opcional, ajuda a reconhecer a simulacao no historico."
        value={draft.scenarioLabel}
        onChangeText={(value) => onTextChange("scenarioLabel", value)}
      />

      <AppInputField
        id="cashPrice"
        label="Preco a vista"
        keyboardType="decimal-pad"
        placeholder="Ex.: 3599,90"
        value={draft.cashPrice}
        errorText={errors.cashPrice}
        onChangeText={(value) => onTextChange("cashPrice", value)}
      />

      <AppInputField
        id="installmentCount"
        label="Quantidade de parcelas"
        keyboardType="number-pad"
        value={draft.installmentCount}
        errorText={errors.installmentCount}
        onChangeText={(value) => onTextChange("installmentCount", value)}
      />

      <InstallmentModeSelector
        value={draft.installmentInputMode}
        onChange={onInstallmentModeChange}
      />

      {draft.installmentInputMode === "total" ? (
        <AppInputField
          id="installmentTotal"
          label="Total parcelado"
          keyboardType="decimal-pad"
          placeholder="Ex.: 3999,90"
          value={draft.installmentTotal}
          errorText={errors.installmentTotal}
          onChangeText={(value) => onTextChange("installmentTotal", value)}
        />
      ) : (
        <AppInputField
          id="installmentAmount"
          label="Valor de cada parcela"
          keyboardType="decimal-pad"
          placeholder="Ex.: 333,25"
          value={draft.installmentAmount}
          errorText={errors.installmentAmount}
          onChangeText={(value) => onTextChange("installmentAmount", value)}
        />
      )}
    </>
  );
}

function AssumptionsFields({
  draft,
  errors,
  onTextChange,
  onDelayPresetChange,
  onOpportunityRateTypeChange,
  onFeesEnabledChange,
}: {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly onTextChange: (field: TextFieldName, value: string) => void;
  readonly onDelayPresetChange: (value: InstallmentDelayPreset) => void;
  readonly onOpportunityRateTypeChange: (value: OpportunityRateType) => void;
  readonly onFeesEnabledChange: (value: boolean) => void;
}): ReactElement {
  return (
    <>
      <DelayPresetSelector
        value={draft.firstPaymentDelayPreset}
        onChange={onDelayPresetChange}
      />

      {draft.firstPaymentDelayPreset === "custom" ? (
        <AppInputField
          id="customFirstPaymentDelayDays"
          label="Primeira parcela em quantos dias?"
          keyboardType="number-pad"
          value={draft.customFirstPaymentDelayDays}
          errorText={errors.customFirstPaymentDelayDays}
          onChangeText={(value) => onTextChange("customFirstPaymentDelayDays", value)}
        />
      ) : null}

      <OpportunityRateSelector
        value={draft.opportunityRateType}
        onChange={onOpportunityRateTypeChange}
      />

      {draft.opportunityRateType === "manual" ? (
        <AppInputField
          id="opportunityRateAnnual"
          label="Taxa de oportunidade anual (%)"
          keyboardType="decimal-pad"
          value={draft.opportunityRateAnnual}
          errorText={errors.opportunityRateAnnual}
          onChangeText={(value) => onTextChange("opportunityRateAnnual", value)}
        />
      ) : null}

      <AppInputField
        id="inflationRateAnnual"
        label="Inflacao anual (%)"
        keyboardType="decimal-pad"
        value={draft.inflationRateAnnual}
        errorText={errors.inflationRateAnnual}
        onChangeText={(value) => onTextChange("inflationRateAnnual", value)}
      />

      <FeesToggleField
        enabled={draft.feesEnabled}
        onChange={onFeesEnabledChange}
      />

      {draft.feesEnabled ? (
        <AppInputField
          id="feesUpfront"
          label="Custos extras iniciais"
          keyboardType="decimal-pad"
          value={draft.feesUpfront}
          errorText={errors.feesUpfront}
          onChangeText={(value) => onTextChange("feesUpfront", value)}
        />
      ) : null}
    </>
  );
}

export function InstallmentVsCashForm({
  draft,
  errors,
  isSubmitting,
  onTextChange,
  onInstallmentModeChange,
  onDelayPresetChange,
  onOpportunityRateTypeChange,
  onFeesEnabledChange,
  onSubmit,
}: InstallmentVsCashFormProps): ReactElement {
  return (
    <YStack gap="$4">
      <ScenarioPricingFields
        draft={draft}
        errors={errors}
        onTextChange={onTextChange}
        onInstallmentModeChange={onInstallmentModeChange}
      />

      <AssumptionsFields
        draft={draft}
        errors={errors}
        onTextChange={onTextChange}
        onDelayPresetChange={onDelayPresetChange}
        onOpportunityRateTypeChange={onOpportunityRateTypeChange}
        onFeesEnabledChange={onFeesEnabledChange}
      />

      <AppButton onPress={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Calculando..." : "Calcular agora"}
      </AppButton>
    </YStack>
  );
}
