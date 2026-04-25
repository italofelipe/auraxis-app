import { useEffect, type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { XStack, YStack } from "tamagui";

import type { TransactionRecord } from "@/features/transactions/contracts";
import {
  createTransactionSchema,
  type CreateTransactionFormValues,
} from "@/features/transactions/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const transactionToFormValues = (
  transaction: TransactionRecord | null | undefined,
): CreateTransactionFormValues => {
  if (!transaction) {
    return {
      title: "",
      amount: "",
      type: "expense",
      dueDate: new Date().toISOString().slice(0, 10),
      description: null,
      isRecurring: false,
    };
  }
  return {
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    dueDate: transaction.dueDate.slice(0, 10),
    description: transaction.description,
    isRecurring: transaction.isRecurring,
  };
};

export interface TransactionFormProps {
  readonly initialTransaction?: TransactionRecord | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateTransactionFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

/**
 * Canonical create/edit form for transactions. View-only — submit, cancel
 * and error dismissal flow up to the parent so the same component powers
 * both flows without owning a mutation.
 */
export function TransactionForm({
  initialTransaction,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: TransactionFormProps): ReactElement {
  const form = useForm<CreateTransactionFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createTransactionSchema) as Resolver<CreateTransactionFormValues>,
    defaultValues: transactionToFormValues(initialTransaction),
  });

  useEffect(() => {
    form.reset(transactionToFormValues(initialTransaction));
  }, [initialTransaction, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialTransaction ? "Editar transacao" : "Nova transacao"}
      description="Defina titulo, valor e categoria."
    >
      <YStack gap="$4">
        <TypeToggle control={form.control} />
        <TransactionFormFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Salvando..."
            : initialTransaction
              ? "Salvar alteracoes"
              : "Criar transacao"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel salvar a transacao"
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

function TypeToggle({
  control,
}: {
  readonly control: Control<CreateTransactionFormValues>;
}): ReactElement {
  return (
    <Controller
      control={control}
      name="type"
      render={({ field: { value, onChange } }) => (
        <XStack gap="$2" flexWrap="wrap">
          <AppButton
            tone={value === "expense" ? "primary" : "secondary"}
            onPress={() => onChange("expense")}
          >
            Despesa
          </AppButton>
          <AppButton
            tone={value === "income" ? "primary" : "secondary"}
            onPress={() => onChange("income")}
          >
            Receita
          </AppButton>
        </XStack>
      )}
    />
  );
}

interface TransactionFormFieldsProps {
  readonly control: Control<CreateTransactionFormValues>;
  readonly errors: FieldErrors<CreateTransactionFormValues>;
}

function TransactionFormFields({
  control,
  errors,
}: TransactionFormFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="tx-title"
            label="Titulo"
            placeholder="Ex: Aluguel"
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
            id="tx-amount"
            label="Valor (R$)"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.amount?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="tx-due-date"
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
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="tx-description"
            label="Descricao (opcional)"
            placeholder="Detalhes da transacao"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.description?.message}
          />
        )}
      />
    </YStack>
  );
}
