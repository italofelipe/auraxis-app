import type { ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { XStack, YStack } from "tamagui";

import type { OnboardingTransactionType } from "@/features/onboarding/contracts";
import {
  onboardingStep2Schema,
  type OnboardingStep2FormValues,
} from "@/features/onboarding/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const TYPE_OPTIONS: readonly {
  value: OnboardingTransactionType;
  label: string;
}[] = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
];

const DEFAULTS: OnboardingStep2FormValues = {
  title: "",
  amount: 0,
  transactionType: "expense",
  dueDate: new Date().toISOString().slice(0, 10),
};

const parseNumeric = (value: string): number => {
  if (value.trim().length === 0) {
    return 0;
  }
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumeric = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return value.toString();
};

export interface OnboardingStep2FormProps {
  readonly initialValues?: OnboardingStep2FormValues;
  readonly onSubmit: (values: OnboardingStep2FormValues) => Promise<void>;
  readonly onBack: () => void;
}

export function OnboardingStep2Form({
  initialValues,
  onSubmit,
  onBack,
}: OnboardingStep2FormProps): ReactElement {
  const form = useForm<OnboardingStep2FormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(
      onboardingStep2Schema,
    ) as Resolver<OnboardingStep2FormValues>,
    defaultValues: initialValues ?? DEFAULTS,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Primeira transacao"
      description="Registre uma transacao para preencher o app."
    >
      <YStack gap="$4">
        <Step2Fields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
        >
          Continuar
        </AppButton>
        <AppButton tone="secondary" onPress={onBack}>
          Voltar
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface Step2FieldsProps {
  readonly control: Control<OnboardingStep2FormValues>;
  readonly errors: FieldErrors<OnboardingStep2FormValues>;
}

function Step2Fields({ control, errors }: Step2FieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="transactionType"
        render={({ field: { value, onChange } }) => (
          <XStack gap="$2" flexWrap="wrap">
            {TYPE_OPTIONS.map((option) => (
              <AppButton
                key={option.value}
                tone={value === option.value ? "primary" : "secondary"}
                onPress={() => onChange(option.value)}
              >
                {option.label}
              </AppButton>
            ))}
          </XStack>
        )}
      />
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="onb-tx-title"
            label="Descricao"
            placeholder="Almoco no restaurante"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.title?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="onb-tx-amount"
            label="Valor"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={formatNumeric(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseNumeric(text))}
            errorText={errors.amount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="onb-tx-date"
            label="Data"
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.dueDate?.message}
          />
        )}
      />
    </YStack>
  );
}
