import { useEffect, type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { YStack } from "tamagui";

import type { GoalRecord } from "@/features/goals/contracts";
import {
  createGoalSchema,
  type CreateGoalFormValues,
} from "@/features/goals/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface GoalFormProps {
  readonly initialGoal?: GoalRecord | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateGoalFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

const goalToFormValues = (goal: GoalRecord | null | undefined): CreateGoalFormValues => {
  if (!goal) {
    return { title: "", targetAmount: 0, currentAmount: 0, targetDate: null };
  }
  return {
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate,
  };
};

const parseNumeric = (value: string): number => {
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

/**
 * Canonical create/edit form for goals. The form is dumb (controlled by the
 * parent's submit/cancel handlers) so the same component can power create,
 * edit and any future detail flow without bringing its own mutation.
 */
export function GoalForm({
  initialGoal,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: GoalFormProps): ReactElement {
  const form = useForm<CreateGoalFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createGoalSchema) as Resolver<CreateGoalFormValues>,
    defaultValues: goalToFormValues(initialGoal),
  });

  useEffect(() => {
    form.reset(goalToFormValues(initialGoal));
  }, [initialGoal, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialGoal ? "Editar meta" : "Nova meta"}
      description="Defina o objetivo, o valor alvo e a data desejada."
    >
      <YStack gap="$4">
        <GoalFormFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : initialGoal ? "Salvar alteracoes" : "Criar meta"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel salvar a meta"
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

interface GoalFormFieldsProps {
  readonly control: Control<CreateGoalFormValues>;
  readonly errors: FieldErrors<CreateGoalFormValues>;
}

function GoalFormFields({ control, errors }: GoalFormFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="goal-title"
            label="Titulo"
            placeholder="Ex: Casa propria"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.title?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="targetAmount"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="goal-target-amount"
            label="Valor alvo (R$)"
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
        name="currentAmount"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="goal-current-amount"
            label="Valor ja acumulado (R$)"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={formatNumeric(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseNumeric(text))}
            errorText={errors.currentAmount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="targetDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="goal-target-date"
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

export type GoalFormController = UseFormReturn<CreateGoalFormValues>;
