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

import {
  createWalletOperationSchema,
  type CreateWalletOperationFormValues,
} from "@/features/wallet/validators-operations";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

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

const defaultValues: CreateWalletOperationFormValues = {
  kind: "buy",
  quantity: 0,
  unitPrice: 0,
  executedAt: new Date().toISOString().slice(0, 10),
  notes: null,
};

export interface WalletOperationFormProps {
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateWalletOperationFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

/**
 * Canonical create form for wallet operations (buy/sell).
 */
export function WalletOperationForm({
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: WalletOperationFormProps): ReactElement {
  const form = useForm<CreateWalletOperationFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createWalletOperationSchema) as Resolver<CreateWalletOperationFormValues>,
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Nova operacao"
      description="Compra ou venda registrada para o ativo."
    >
      <YStack gap="$4">
        <KindToggle control={form.control} />
        <OperationFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Registrar operacao"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel registrar"
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

function KindToggle({
  control,
}: {
  readonly control: Control<CreateWalletOperationFormValues>;
}): ReactElement {
  return (
    <Controller
      control={control}
      name="kind"
      render={({ field: { value, onChange } }) => (
        <XStack gap="$2" flexWrap="wrap">
          <AppButton
            tone={value === "buy" ? "primary" : "secondary"}
            onPress={() => onChange("buy")}
          >
            Compra
          </AppButton>
          <AppButton
            tone={value === "sell" ? "primary" : "secondary"}
            onPress={() => onChange("sell")}
          >
            Venda
          </AppButton>
        </XStack>
      )}
    />
  );
}

interface OperationFieldsProps {
  readonly control: Control<CreateWalletOperationFormValues>;
  readonly errors: FieldErrors<CreateWalletOperationFormValues>;
}

function OperationFields({
  control,
  errors,
}: OperationFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="op-quantity"
            label="Quantidade"
            placeholder="0"
            keyboardType="decimal-pad"
            value={formatNumeric(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseNumeric(text))}
            errorText={errors.quantity?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="unitPrice"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="op-unit-price"
            label="Preco unitario (R$)"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={formatNumeric(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseNumeric(text))}
            errorText={errors.unitPrice?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="executedAt"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="op-executed-at"
            label="Data da operacao"
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.executedAt?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="op-notes"
            label="Notas (opcional)"
            placeholder="Detalhes da operacao"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.notes?.message}
          />
        )}
      />
    </YStack>
  );
}
