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
  simulateSalaryIncreaseSchema,
  type SimulateSalaryIncreaseFormValues,
} from "@/features/user-profile/validators-salary-sim";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const DEFAULTS: SimulateSalaryIncreaseFormValues = {
  baseSalary: 0,
  baseDate: new Date().toISOString().slice(0, 10),
  discounts: 0,
  targetRealIncrease: 0,
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

export interface SalarySimulatorFormProps {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: SimulateSalaryIncreaseFormValues) => Promise<void>;
  readonly onDismissError: () => void;
}

export function SalarySimulatorForm({
  isSubmitting,
  submitError,
  onSubmit,
  onDismissError,
}: SalarySimulatorFormProps): ReactElement {
  const form = useForm<SimulateSalaryIncreaseFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(
      simulateSalaryIncreaseSchema,
    ) as Resolver<SimulateSalaryIncreaseFormValues>,
    defaultValues: DEFAULTS,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Simular aumento salarial"
      description="Calcule recomposicao de inflacao e meta de aumento real."
    >
      <YStack gap="$4">
        <SalaryFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Calculando..." : "Simular"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel simular"
            fallbackDescription="Confira os dados e tente novamente."
            secondaryActionLabel="Fechar"
            onSecondaryAction={onDismissError}
          />
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}

interface SalaryFieldsProps {
  readonly control: Control<SimulateSalaryIncreaseFormValues>;
  readonly errors: FieldErrors<SimulateSalaryIncreaseFormValues>;
}

function SalaryFields({ control, errors }: SalaryFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <NumericField
        control={control}
        errors={errors}
        name="baseSalary"
        id="sal-base"
        label="Salario base"
      />
      <Controller
        control={control}
        name="baseDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="sal-base-date"
            label="Data base"
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.baseDate?.message}
          />
        )}
      />
      <NumericField
        control={control}
        errors={errors}
        name="discounts"
        id="sal-discounts"
        label="Descontos"
      />
      <NumericField
        control={control}
        errors={errors}
        name="targetRealIncrease"
        id="sal-target"
        label="Aumento real desejado (%)"
      />
    </YStack>
  );
}

interface NumericFieldProps extends SalaryFieldsProps {
  readonly name: "baseSalary" | "discounts" | "targetRealIncrease";
  readonly id: string;
  readonly label: string;
}

function NumericField({
  control,
  errors,
  name,
  id,
  label,
}: NumericFieldProps): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id={id}
          label={label}
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors[name]?.message}
        />
      )}
    />
  );
}
