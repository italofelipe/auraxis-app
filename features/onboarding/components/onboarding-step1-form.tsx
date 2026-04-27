import type { ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Resolver,
} from "react-hook-form";
import { XStack, YStack } from "tamagui";

import type { OnboardingInvestorProfile } from "@/features/onboarding/contracts";
import {
  onboardingStep1Schema,
  type OnboardingStep1FormValues,
} from "@/features/onboarding/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const PROFILE_OPTIONS: readonly {
  value: OnboardingInvestorProfile;
  label: string;
}[] = [
  { value: "conservador", label: "Conservador" },
  { value: "explorador", label: "Explorador" },
  { value: "entusiasta", label: "Entusiasta" },
];

const DEFAULTS: OnboardingStep1FormValues = {
  monthlyIncome: 0,
  investorProfile: "conservador",
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

export interface OnboardingStep1FormProps {
  readonly initialValues?: OnboardingStep1FormValues;
  readonly onSubmit: (values: OnboardingStep1FormValues) => Promise<void>;
  readonly onSkip: () => void;
}

export function OnboardingStep1Form({
  initialValues,
  onSubmit,
  onSkip,
}: OnboardingStep1FormProps): ReactElement {
  const form = useForm<OnboardingStep1FormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(
      onboardingStep1Schema,
    ) as Resolver<OnboardingStep1FormValues>,
    defaultValues: initialValues ?? DEFAULTS,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Perfil basico"
      description="Conte sobre sua renda e perfil para personalizar o app."
    >
      <YStack gap="$4">
        <Controller
          control={form.control}
          name="investorProfile"
          render={({ field: { value, onChange } }) => (
            <XStack gap="$2" flexWrap="wrap">
              {PROFILE_OPTIONS.map((option) => (
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
          control={form.control}
          name="monthlyIncome"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInputField
              id="onb-income"
              label="Renda mensal"
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={formatNumeric(value)}
              onBlur={onBlur}
              onChangeText={(text) => onChange(parseNumeric(text))}
              errorText={form.formState.errors.monthlyIncome?.message}
            />
          )}
        />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
        >
          Continuar
        </AppButton>
        <AppButton tone="secondary" onPress={onSkip}>
          Pular onboarding
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
