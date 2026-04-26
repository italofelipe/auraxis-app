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

import type { Budget, BudgetPeriod } from "@/features/budgets/contracts";
import {
  createBudgetSchema,
  type CreateBudgetFormValues,
} from "@/features/budgets/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const PERIOD_OPTIONS: readonly { value: BudgetPeriod; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "custom", label: "Custom" },
];

const EMPTY_DEFAULTS: CreateBudgetFormValues = {
  name: "",
  amount: "0.00",
  period: "monthly",
  tagId: null,
  startDate: null,
  endDate: null,
};

const buildDefaults = (initial: Budget | null): CreateBudgetFormValues => {
  if (initial === null) {
    return EMPTY_DEFAULTS;
  }
  return {
    name: initial.name,
    amount: initial.amount,
    period: initial.period,
    tagId: initial.tagId,
    startDate: initial.startDate,
    endDate: initial.endDate,
  };
};

export interface BudgetFormProps {
  readonly initialBudget: Budget | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateBudgetFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

export function BudgetForm({
  initialBudget,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: BudgetFormProps): ReactElement {
  const form = useForm<CreateBudgetFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createBudgetSchema) as Resolver<CreateBudgetFormValues>,
    defaultValues: buildDefaults(initialBudget),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialBudget ? "Editar orcamento" : "Novo orcamento"}
      description="Defina o teto e a frequencia para a categoria."
    >
      <YStack gap="$4">
        <PeriodToggle control={form.control} />
        <BudgetFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar orcamento"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel salvar"
            fallbackDescription="Confira os dados e tente novamente."
            secondaryActionLabel="Fechar"
            onSecondaryAction={onDismissError}
          />
        ) : null}
        <AppButton tone="secondary" onPress={onCancel}>
          Cancelar
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function PeriodToggle({
  control,
}: {
  readonly control: Control<CreateBudgetFormValues>;
}): ReactElement {
  return (
    <Controller
      control={control}
      name="period"
      render={({ field: { value, onChange } }) => (
        <XStack gap="$2" flexWrap="wrap">
          {PERIOD_OPTIONS.map((option) => (
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
  );
}

interface BudgetFieldsProps {
  readonly control: Control<CreateBudgetFormValues>;
  readonly errors: FieldErrors<CreateBudgetFormValues>;
}

function BudgetFields({ control, errors }: BudgetFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <TextField
        control={control}
        errors={errors}
        name="name"
        id="bud-name"
        label="Nome"
        placeholder="Alimentacao"
      />
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="bud-amount"
            label="Limite"
            placeholder="1500.00"
            keyboardType="decimal-pad"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.amount?.message}
          />
        )}
      />
      <NullableTextField
        control={control}
        errors={errors}
        name="tagId"
        id="bud-tag"
        label="Tag (opcional)"
        placeholder="UUID da tag"
      />
      <NullableTextField
        control={control}
        errors={errors}
        name="startDate"
        id="bud-start"
        label="Inicio (opcional)"
        placeholder="AAAA-MM-DD"
      />
      <NullableTextField
        control={control}
        errors={errors}
        name="endDate"
        id="bud-end"
        label="Fim (opcional)"
        placeholder="AAAA-MM-DD"
      />
    </YStack>
  );
}

interface TextFieldProps extends BudgetFieldsProps {
  readonly name: "name";
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
}

function TextField({
  control,
  errors,
  name,
  id,
  label,
  placeholder,
}: TextFieldProps): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id={id}
          label={label}
          placeholder={placeholder}
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={onChange}
          errorText={errors[name]?.message}
        />
      )}
    />
  );
}

interface NullableTextFieldProps extends BudgetFieldsProps {
  readonly name: "tagId" | "startDate" | "endDate";
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
}

function NullableTextField({
  control,
  errors,
  name,
  id,
  label,
  placeholder,
}: NullableTextFieldProps): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id={id}
          label={label}
          placeholder={placeholder}
          autoCapitalize="none"
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={(text) => onChange(text.length > 0 ? text : null)}
          errorText={errors[name]?.message}
        />
      )}
    />
  );
}
