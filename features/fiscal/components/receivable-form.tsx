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
  createReceivableSchema,
  type CreateReceivableFormValues,
} from "@/features/fiscal/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const defaultValues: CreateReceivableFormValues = {
  description: "",
  amount: "",
  expectedDate: new Date().toISOString().slice(0, 10),
  category: null,
};

export interface ReceivableFormProps {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateReceivableFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

/**
 * Canonical create form for fiscal receivables.
 */
export function ReceivableForm({
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: ReceivableFormProps): ReactElement {
  const form = useForm<CreateReceivableFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createReceivableSchema) as Resolver<CreateReceivableFormValues>,
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Novo recebivel"
      description="Cadastre um valor que voce espera receber."
    >
      <YStack gap="$4">
        <ReceivableFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Cadastrar recebivel"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel cadastrar"
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

interface ReceivableFieldsProps {
  readonly control: Control<CreateReceivableFormValues>;
  readonly errors: FieldErrors<CreateReceivableFormValues>;
}

function ReceivableFields({ control, errors }: ReceivableFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="receivable-description"
            label="Descricao"
            placeholder="Ex: NF 0123 - Cliente X"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.description?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="receivable-amount"
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
        name="expectedDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="receivable-expected-date"
            label="Data prevista"
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.expectedDate?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="receivable-category"
            label="Categoria (opcional)"
            placeholder="Ex: Servicos"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.category?.message}
          />
        )}
      />
    </YStack>
  );
}
