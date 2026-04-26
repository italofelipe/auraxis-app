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

import type { Account, AccountType } from "@/features/accounts/contracts";
import {
  createAccountSchema,
  type CreateAccountFormValues,
} from "@/features/accounts/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const ACCOUNT_TYPE_OPTIONS: readonly { value: AccountType; label: string }[] = [
  { value: "checking", label: "Corrente" },
  { value: "savings", label: "Poupanca" },
  { value: "investment", label: "Investimento" },
  { value: "wallet", label: "Carteira" },
  { value: "other", label: "Outro" },
];

const buildDefaults = (initial: Account | null): CreateAccountFormValues => ({
  name: initial?.name ?? "",
  accountType: initial?.accountType ?? "checking",
  institution: initial?.institution ?? null,
  initialBalance: initial?.initialBalance ?? 0,
});

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

export interface AccountFormProps {
  readonly initialAccount: Account | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateAccountFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

export function AccountForm({
  initialAccount,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: AccountFormProps): ReactElement {
  const form = useForm<CreateAccountFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createAccountSchema) as Resolver<CreateAccountFormValues>,
    defaultValues: buildDefaults(initialAccount),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialAccount ? "Editar conta" : "Nova conta"}
      description="Conta bancaria, carteira ou investimento."
    >
      <YStack gap="$4">
        <AccountTypeToggle control={form.control} />
        <AccountFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar conta"}
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

function AccountTypeToggle({
  control,
}: {
  readonly control: Control<CreateAccountFormValues>;
}): ReactElement {
  return (
    <Controller
      control={control}
      name="accountType"
      render={({ field: { value, onChange } }) => (
        <XStack gap="$2" flexWrap="wrap">
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
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

interface AccountFieldsProps {
  readonly control: Control<CreateAccountFormValues>;
  readonly errors: FieldErrors<CreateAccountFormValues>;
}

function AccountFields({ control, errors }: AccountFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="acc-name"
            label="Nome"
            placeholder="Conta principal"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="institution"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="acc-institution"
            label="Instituicao (opcional)"
            placeholder="Nubank"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.institution?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="initialBalance"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="acc-balance"
            label="Saldo inicial"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={formatNumeric(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseNumeric(text))}
            errorText={errors.initialBalance?.message}
          />
        )}
      />
    </YStack>
  );
}
