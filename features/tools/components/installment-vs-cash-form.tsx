import { memo, useCallback, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppToggleRow } from "@/shared/components/app-toggle-row";
import type { OpportunityRateType } from "@/features/tools/contracts";
import type {
  InstallmentDelayPreset,
  InstallmentInputMode,
  InstallmentVsCashFormDraft,
  InstallmentVsCashFormErrors,
} from "@/shared/validators/installment-vs-cash";

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

interface InstallmentModeSelectorProps {
  readonly value: InstallmentInputMode;
  readonly onChange: (value: InstallmentInputMode) => void;
}

const InstallmentModeSelector = memo(function InstallmentModeSelector({
  value,
  onChange,
}: InstallmentModeSelectorProps): ReactElement {
  const handleTotal = useCallback(() => onChange("total"), [onChange]);
  const handleAmount = useCallback(() => onChange("amount"), [onChange]);
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Como voce quer informar o parcelamento?
      </Paragraph>
      <XStack gap="$2">
        <AppButton
          flex={1}
          tone={value === "total" ? "primary" : "secondary"}
          onPress={handleTotal}
        >
          Total parcelado
        </AppButton>
        <AppButton
          flex={1}
          tone={value === "amount" ? "primary" : "secondary"}
          onPress={handleAmount}
        >
          Valor da parcela
        </AppButton>
      </XStack>
    </YStack>
  );
});

interface DelayPresetSelectorProps {
  readonly value: InstallmentDelayPreset;
  readonly onChange: (value: InstallmentDelayPreset) => void;
}

const DelayPresetSelector = memo(function DelayPresetSelector({
  value,
  onChange,
}: DelayPresetSelectorProps): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Quando a primeira parcela vence?
      </Paragraph>
      <XStack flexWrap="wrap" gap="$2">
        {DELAY_PRESETS.map((preset) => (
          <DelayPresetButton
            key={preset.value}
            preset={preset.value}
            label={preset.label}
            isActive={value === preset.value}
            onSelect={onChange}
          />
        ))}
      </XStack>
    </YStack>
  );
});

interface DelayPresetButtonProps {
  readonly preset: InstallmentDelayPreset;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (value: InstallmentDelayPreset) => void;
}

const DelayPresetButton = memo(function DelayPresetButton({
  preset,
  label,
  isActive,
  onSelect,
}: DelayPresetButtonProps): ReactElement {
  const handlePress = useCallback(() => onSelect(preset), [onSelect, preset]);
  return (
    <AppButton tone={isActive ? "primary" : "secondary"} onPress={handlePress}>
      {label}
    </AppButton>
  );
});

interface OpportunityRateSelectorProps {
  readonly value: OpportunityRateType;
  readonly onChange: (value: OpportunityRateType) => void;
}

const OpportunityRateSelector = memo(function OpportunityRateSelector({
  value,
  onChange,
}: OpportunityRateSelectorProps): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Taxa de oportunidade
      </Paragraph>
      <XStack flexWrap="wrap" gap="$2">
        {OPPORTUNITY_RATE_TYPES.map((option) => (
          <OpportunityRateButton
            key={option.value}
            optionValue={option.value}
            label={option.label}
            isActive={value === option.value}
            onSelect={onChange}
          />
        ))}
      </XStack>
    </YStack>
  );
});

interface OpportunityRateButtonProps {
  readonly optionValue: OpportunityRateType;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (value: OpportunityRateType) => void;
}

const OpportunityRateButton = memo(function OpportunityRateButton({
  optionValue,
  label,
  isActive,
  onSelect,
}: OpportunityRateButtonProps): ReactElement {
  const handlePress = useCallback(
    () => onSelect(optionValue),
    [onSelect, optionValue],
  );
  return (
    <AppButton tone={isActive ? "primary" : "secondary"} onPress={handlePress}>
      {label}
    </AppButton>
  );
});

const FeesToggleField = memo(function FeesToggleField({
  enabled,
  onChange,
}: {
  readonly enabled: boolean;
  readonly onChange: (value: boolean) => void;
}): ReactElement {
  return (
    <AppToggleRow
      label="Incluir custos extras?"
      description="Ative se houver tarifas, entrada ou custos iniciais que mudem a conta."
      checked={enabled}
      onCheckedChange={onChange}
    />
  );
});

interface ScenarioPricingFieldsProps {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly onTextChange: (field: TextFieldName, value: string) => void;
  readonly onInstallmentModeChange: (value: InstallmentInputMode) => void;
}

const ScenarioPricingFields = memo(function ScenarioPricingFields({
  draft,
  errors,
  onTextChange,
  onInstallmentModeChange,
}: ScenarioPricingFieldsProps): ReactElement {
  const onScenarioLabel = useCallback(
    (v: string) => onTextChange("scenarioLabel", v),
    [onTextChange],
  );
  const onCashPrice = useCallback(
    (v: string) => onTextChange("cashPrice", v),
    [onTextChange],
  );
  const onInstallmentCount = useCallback(
    (v: string) => onTextChange("installmentCount", v),
    [onTextChange],
  );
  const onInstallmentTotal = useCallback(
    (v: string) => onTextChange("installmentTotal", v),
    [onTextChange],
  );
  const onInstallmentAmount = useCallback(
    (v: string) => onTextChange("installmentAmount", v),
    [onTextChange],
  );

  return (
    <>
      <AppInputField
        id="scenarioLabel"
        label="Nome do cenario"
        helperText="Opcional, ajuda a reconhecer a simulacao no historico."
        value={draft.scenarioLabel}
        onChangeText={onScenarioLabel}
      />

      <AppInputField
        id="cashPrice"
        label="Preco a vista"
        keyboardType="decimal-pad"
        placeholder="Ex.: 3599,90"
        value={draft.cashPrice}
        errorText={errors.cashPrice}
        onChangeText={onCashPrice}
      />

      <AppInputField
        id="installmentCount"
        label="Quantidade de parcelas"
        keyboardType="number-pad"
        value={draft.installmentCount}
        errorText={errors.installmentCount}
        onChangeText={onInstallmentCount}
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
          onChangeText={onInstallmentTotal}
        />
      ) : (
        <AppInputField
          id="installmentAmount"
          label="Valor de cada parcela"
          keyboardType="decimal-pad"
          placeholder="Ex.: 333,25"
          value={draft.installmentAmount}
          errorText={errors.installmentAmount}
          onChangeText={onInstallmentAmount}
        />
      )}
    </>
  );
});

interface AssumptionsFieldsProps {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly onTextChange: (field: TextFieldName, value: string) => void;
  readonly onDelayPresetChange: (value: InstallmentDelayPreset) => void;
  readonly onOpportunityRateTypeChange: (value: OpportunityRateType) => void;
  readonly onFeesEnabledChange: (value: boolean) => void;
}

const AssumptionsFields = memo(function AssumptionsFields({
  draft,
  errors,
  onTextChange,
  onDelayPresetChange,
  onOpportunityRateTypeChange,
  onFeesEnabledChange,
}: AssumptionsFieldsProps): ReactElement {
  const onCustomDelay = useCallback(
    (v: string) => onTextChange("customFirstPaymentDelayDays", v),
    [onTextChange],
  );
  const onOpportunityRate = useCallback(
    (v: string) => onTextChange("opportunityRateAnnual", v),
    [onTextChange],
  );
  const onInflationRate = useCallback(
    (v: string) => onTextChange("inflationRateAnnual", v),
    [onTextChange],
  );
  const onFees = useCallback(
    (v: string) => onTextChange("feesUpfront", v),
    [onTextChange],
  );

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
          onChangeText={onCustomDelay}
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
          onChangeText={onOpportunityRate}
        />
      ) : null}

      <AppInputField
        id="inflationRateAnnual"
        label="Inflacao anual (%)"
        keyboardType="decimal-pad"
        value={draft.inflationRateAnnual}
        errorText={errors.inflationRateAnnual}
        onChangeText={onInflationRate}
      />

      <FeesToggleField enabled={draft.feesEnabled} onChange={onFeesEnabledChange} />

      {draft.feesEnabled ? (
        <AppInputField
          id="feesUpfront"
          label="Custos extras iniciais"
          keyboardType="decimal-pad"
          value={draft.feesUpfront}
          errorText={errors.feesUpfront}
          onChangeText={onFees}
        />
      ) : null}
    </>
  );
});

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
