import { useEffect, type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { YStack } from "tamagui";

import { TickerAutocomplete } from "@/features/wallet/components/ticker-autocomplete";
import type { WalletEntry } from "@/features/wallet/contracts";
import {
  createWalletEntrySchema,
  type CreateWalletEntryFormValues,
} from "@/features/wallet/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const parseNumeric = (value: string): number | null => {
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

const entryToFormValues = (
  entry: WalletEntry | null | undefined,
): CreateWalletEntryFormValues => {
  if (!entry) {
    return {
      name: "",
      assetClass: "stocks",
      ticker: null,
      value: null,
      quantity: null,
      annualRate: null,
      targetWithdrawDate: null,
      registerDate: new Date().toISOString().slice(0, 10),
    };
  }
  return {
    name: entry.name,
    assetClass: entry.assetClass,
    ticker: entry.ticker,
    value: entry.value,
    quantity: entry.quantity,
    annualRate: entry.annualRate,
    targetWithdrawDate: entry.targetWithdrawDate,
    registerDate: entry.registerDate,
  };
};

export interface WalletEntryFormProps {
  readonly initialEntry?: WalletEntry | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateWalletEntryFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

/**
 * Canonical create/edit form for wallet entries. View-only — submit, cancel
 * and error dismissal flow up to the parent so the same component powers
 * both flows.
 */
export function WalletEntryForm({
  initialEntry,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: WalletEntryFormProps): ReactElement {
  const form = useForm<CreateWalletEntryFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createWalletEntrySchema) as Resolver<CreateWalletEntryFormValues>,
    defaultValues: entryToFormValues(initialEntry),
  });

  useEffect(() => {
    form.reset(entryToFormValues(initialEntry));
  }, [initialEntry, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialEntry ? "Editar ativo" : "Novo ativo"}
      description="Registre um item da sua carteira financeira."
    >
      <YStack gap="$4">
        <WalletEntryFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Salvando..."
            : initialEntry
              ? "Salvar alteracoes"
              : "Adicionar ativo"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel salvar o ativo"
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

interface WalletEntryFieldsProps {
  readonly control: Control<CreateWalletEntryFormValues>;
  readonly errors: FieldErrors<CreateWalletEntryFormValues>;
}

function WalletEntryFields({
  control,
  errors,
}: WalletEntryFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <NameField control={control} errors={errors} />
      <AssetClassField control={control} errors={errors} />
      <TickerField control={control} errors={errors} />
      <ValueField control={control} errors={errors} />
      <QuantityField control={control} errors={errors} />
    </YStack>
  );
}

function NameField({ control, errors }: WalletEntryFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="name"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="wallet-name"
          label="Nome"
          placeholder="Ex: Petrobras PN"
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={onChange}
          errorText={errors.name?.message}
        />
      )}
    />
  );
}

function AssetClassField({ control, errors }: WalletEntryFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="assetClass"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="wallet-asset-class"
          label="Classe (ex: stocks, fixed-income, fii, crypto)"
          autoCapitalize="none"
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={onChange}
          errorText={errors.assetClass?.message}
        />
      )}
    />
  );
}

function TickerField({ control, errors }: WalletEntryFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="ticker"
      render={({ field: { onChange, value } }) => (
        <TickerAutocomplete
          id="wallet-ticker"
          label="Ticker (opcional)"
          placeholder="Ex: PETR4"
          value={value ?? ""}
          onChange={(text) => onChange(text.length > 0 ? text : null)}
          onSelect={(result) => onChange(result.stock)}
          errorText={errors.ticker?.message}
        />
      )}
    />
  );
}

function ValueField({ control, errors }: WalletEntryFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="value"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="wallet-value"
          label="Valor (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors.value?.message}
        />
      )}
    />
  );
}

function QuantityField({ control, errors }: WalletEntryFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="quantity"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="wallet-quantity"
          label="Quantidade (opcional)"
          placeholder="0"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors.quantity?.message}
        />
      )}
    />
  );
}
