import type { ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { YStack } from "tamagui";

import {
  onboardingStep3Schema,
  type OnboardingStep3FormValues,
} from "@/features/onboarding/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const DEFAULTS: OnboardingStep3FormValues = {
  name: "",
  targetAmount: 0,
  targetDate: new Date(Date.now() + 31 * 86_400_000).toISOString().slice(0, 10),
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

export interface OnboardingStep3FormProps {
  readonly initialValues?: OnboardingStep3FormValues;
  readonly onSubmit: (values: OnboardingStep3FormValues) => Promise<void>;
  readonly onBack: () => void;
}

export function OnboardingStep3Form({
  initialValues,
  onSubmit,
  onBack,
}: OnboardingStep3FormProps): ReactElement {
  const form = useForm<OnboardingStep3FormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(
      onboardingStep3Schema,
    ) as Resolver<OnboardingStep3FormValues>,
    defaultValues: initialValues ?? DEFAULTS,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Primeira meta"
      description="Defina uma meta para acompanhar seu progresso."
    >
      <YStack gap="$4">
        <Step3Fields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
        >
          Concluir
        </AppButton>
        <AppButton tone="secondary" onPress={onBack}>
          Voltar
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface Step3FieldsProps {
  readonly control: Control<OnboardingStep3FormValues>;
  readonly errors: FieldErrors<OnboardingStep3FormValues>;
}

function Step3Fields({ control, errors }: Step3FieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="onb-goal-name"
            label="Nome"
            placeholder="Reserva de emergencia"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="targetAmount"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="onb-goal-amount"
            label="Valor alvo"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={formatNumeric(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseNumeric(text))}
            errorText={errors.targetAmount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="targetDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="onb-goal-date"
            label="Data alvo"
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.targetDate?.message}
          />
        )}
      />
    </YStack>
  );
}
