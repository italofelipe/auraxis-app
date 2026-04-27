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
  simulateGoalSchema,
  type SimulateGoalFormValues,
} from "@/features/goals/validators-simulator";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const DEFAULTS: SimulateGoalFormValues = {
  targetAmount: 0,
  currentAmount: 0,
  targetDate: null,
  monthlyIncome: null,
  monthlyExpenses: null,
  monthlyContribution: null,
};

const parseNumeric = (value: string): number => {
  if (value.trim().length === 0) {
    return 0;
  }
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseOptional = (value: string): number | null => {
  if (value.trim().length === 0) {
    return null;
  }
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumeric = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return value.toString();
};

export interface GoalSimulatorFormProps {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: SimulateGoalFormValues) => Promise<void>;
  readonly onDismissError: () => void;
}

export function GoalSimulatorForm({
  isSubmitting,
  submitError,
  onSubmit,
  onDismissError,
}: GoalSimulatorFormProps): ReactElement {
  const form = useForm<SimulateGoalFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(simulateGoalSchema) as Resolver<SimulateGoalFormValues>,
    defaultValues: DEFAULTS,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Simular meta"
      description="Calcule contribuicao mensal e prazo sem salvar."
    >
      <YStack gap="$4">
        <SimulatorFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Calculando..." : "Simular plano"}
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

interface SimulatorFieldsProps {
  readonly control: Control<SimulateGoalFormValues>;
  readonly errors: FieldErrors<SimulateGoalFormValues>;
}

function SimulatorFields({
  control,
  errors,
}: SimulatorFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <RequiredAmount
        control={control}
        errors={errors}
        name="targetAmount"
        id="sim-target"
        label="Valor alvo"
        placeholder="100000"
      />
      <RequiredAmount
        control={control}
        errors={errors}
        name="currentAmount"
        id="sim-current"
        label="Valor atual"
        placeholder="0"
      />
      <OptionalAmount
        control={control}
        errors={errors}
        name="monthlyIncome"
        id="sim-income"
        label="Renda mensal (opcional)"
        placeholder="0"
      />
      <OptionalAmount
        control={control}
        errors={errors}
        name="monthlyExpenses"
        id="sim-expenses"
        label="Despesa mensal (opcional)"
        placeholder="0"
      />
      <OptionalAmount
        control={control}
        errors={errors}
        name="monthlyContribution"
        id="sim-contribution"
        label="Contribuicao desejada (opcional)"
        placeholder="0"
      />
      <Controller
        control={control}
        name="targetDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="sim-date"
            label="Data alvo (opcional)"
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.targetDate?.message}
          />
        )}
      />
    </YStack>
  );
}

interface RequiredAmountProps extends SimulatorFieldsProps {
  readonly name: "targetAmount" | "currentAmount";
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
}

function RequiredAmount({
  control,
  errors,
  name,
  id,
  label,
  placeholder,
}: RequiredAmountProps): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id={id}
          label={label}
          placeholder={placeholder}
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

interface OptionalAmountProps extends SimulatorFieldsProps {
  readonly name: "monthlyIncome" | "monthlyExpenses" | "monthlyContribution";
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
}

function OptionalAmount({
  control,
  errors,
  name,
  id,
  label,
  placeholder,
}: OptionalAmountProps): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id={id}
          label={label}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseOptional(text))}
          errorText={errors[name]?.message}
        />
      )}
    />
  );
}
