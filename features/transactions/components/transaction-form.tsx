import { useEffect, useMemo, type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormSetValue,
} from "react-hook-form";
import { Paragraph, XStack, YStack } from "tamagui";

import type { CreditCard } from "@/features/credit-cards/contracts";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { TRANSACTION_INSTALLMENTS_FEATURE_FLAG_KEY } from "@/features/transactions/installments-config";
import { previewInstallments } from "@/features/transactions/utils/preview-installments";
import {
  createTransactionSchema,
  type CreateTransactionFormValues,
} from "@/features/transactions/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppToggleRow } from "@/shared/components/app-toggle-row";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { formatCurrency, formatShortDate } from "@/shared/utils/formatters";

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
      creditCardId: null,
      isInstallment: false,
      installmentCount: null,
    };
  }
  return {
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    dueDate: transaction.dueDate.slice(0, 10),
    description: transaction.description,
    isRecurring: transaction.isRecurring,
    creditCardId: transaction.creditCardId,
    isInstallment: transaction.isInstallment,
    installmentCount: transaction.installmentCount,
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
  const installmentsEnabled = isFeatureEnabled(TRANSACTION_INSTALLMENTS_FEATURE_FLAG_KEY);
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
        {installmentsEnabled ? (
          <TransactionInstallmentFields
            control={form.control}
            errors={form.formState.errors}
            setValue={form.setValue}
          />
        ) : null}
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

interface TransactionInstallmentFieldsProps {
  readonly control: Control<CreateTransactionFormValues>;
  readonly errors: FieldErrors<CreateTransactionFormValues>;
  readonly setValue: UseFormSetValue<CreateTransactionFormValues>;
}

function TransactionInstallmentFields({
  control,
  errors,
  setValue,
}: TransactionInstallmentFieldsProps): ReactElement | null {
  const creditCardsQuery = useCreditCardsQuery();
  const transactionType = useWatch({ control, name: "type" });
  const creditCardId = useWatch({ control, name: "creditCardId" });
  const isInstallment = useWatch({ control, name: "isInstallment" });
  const installmentCount = useWatch({ control, name: "installmentCount" });
  const amount = useWatch({ control, name: "amount" });
  const dueDate = useWatch({ control, name: "dueDate" });

  useResetInstallmentFields({
    creditCardId,
    installmentCount,
    isInstallment,
    setValue,
    transactionType,
  });

  const creditCards = creditCardsQuery.data?.creditCards ?? [];

  if (transactionType !== "expense") {
    return null;
  }

  return (
    <YStack gap="$3">
      <CreditCardSelector
        creditCardId={creditCardId}
        creditCards={creditCards}
        creditCardsQuery={creditCardsQuery}
        errorText={errors.creditCardId?.message}
        setValue={setValue}
      />
      {creditCardId ? <InstallmentToggle control={control} setValue={setValue} /> : null}
      {creditCardId && isInstallment ? (
        <InstallmentCountSection
          amount={amount}
          control={control}
          dueDate={dueDate}
          errorText={errors.installmentCount?.message}
          installmentCount={installmentCount}
        />
      ) : null}
    </YStack>
  );
}

interface ResetInstallmentFieldsInput {
  readonly creditCardId: string | null;
  readonly installmentCount: number | null;
  readonly isInstallment: boolean;
  readonly setValue: UseFormSetValue<CreateTransactionFormValues>;
  readonly transactionType: CreateTransactionFormValues["type"];
}

function useResetInstallmentFields({
  creditCardId,
  installmentCount,
  isInstallment,
  setValue,
  transactionType,
}: ResetInstallmentFieldsInput): void {
  useEffect(() => {
    if (transactionType === "expense") {
      return;
    }
    resetInstallmentValues(setValue, { clearCreditCard: creditCardId !== null });
  }, [creditCardId, setValue, transactionType]);

  useEffect(() => {
    if (creditCardId) {
      return;
    }
    if (isInstallment || installmentCount !== null) {
      resetInstallmentValues(setValue);
    }
  }, [creditCardId, installmentCount, isInstallment, setValue]);
}

const resetInstallmentValues = (
  setValue: UseFormSetValue<CreateTransactionFormValues>,
  options: { readonly clearCreditCard?: boolean } = {},
): void => {
  if (options.clearCreditCard) {
    setValue("creditCardId", null, { shouldDirty: true, shouldValidate: true });
  }
  setValue("isInstallment", false, { shouldDirty: true, shouldValidate: true });
  setValue("installmentCount", null, { shouldDirty: true, shouldValidate: true });
};

interface CreditCardSelectorProps {
  readonly creditCardId: string | null;
  readonly creditCards: readonly CreditCard[];
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly errorText?: string;
  readonly setValue: UseFormSetValue<CreateTransactionFormValues>;
}

function CreditCardSelector({
  creditCardId,
  creditCards,
  creditCardsQuery,
  errorText,
  setValue,
}: CreditCardSelectorProps): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        Cartao de credito
      </Paragraph>
      <XStack gap="$2" flexWrap="wrap">
        {creditCardId ? (
          <AppButton
            tone="secondary"
            onPress={() => resetInstallmentValues(setValue, { clearCreditCard: true })}
          >
            Sem cartao
          </AppButton>
        ) : null}
        {creditCards.map((creditCard) => (
          <CreditCardOptionButton
            key={creditCard.id}
            creditCard={creditCard}
            selected={creditCardId === creditCard.id}
            onSelect={(nextCreditCardId) => {
              setValue("creditCardId", nextCreditCardId, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        ))}
      </XStack>
      <CreditCardsQueryState query={creditCardsQuery} creditCardsCount={creditCards.length} />
      {errorText ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {errorText}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

interface InstallmentToggleProps {
  readonly control: Control<CreateTransactionFormValues>;
  readonly setValue: UseFormSetValue<CreateTransactionFormValues>;
}

function InstallmentToggle({
  control,
  setValue,
}: InstallmentToggleProps): ReactElement {
  return (
    <Controller
      control={control}
      name="isInstallment"
      render={({ field: { value, onChange } }) => (
        <AppToggleRow
          label="Compra parcelada"
          description="Divida a despesa no cartao e visualize o calendario de parcelas."
          checked={Boolean(value)}
          testID="transaction-installment-toggle"
          onCheckedChange={(checked) => {
            onChange(checked);
            if (!checked) {
              setValue("installmentCount", null, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        />
      )}
    />
  );
}

interface InstallmentCountSectionProps {
  readonly amount: string;
  readonly control: Control<CreateTransactionFormValues>;
  readonly dueDate: string;
  readonly errorText?: string;
  readonly installmentCount: number | null;
}

function InstallmentCountSection({
  amount,
  control,
  dueDate,
  errorText,
  installmentCount,
}: InstallmentCountSectionProps): ReactElement {
  return (
    <>
      <Controller
        control={control}
        name="installmentCount"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppInputField
            id="tx-installment-count"
            label="Quantidade de parcelas"
            placeholder="12"
            keyboardType="number-pad"
            value={value === null ? "" : String(value)}
            onBlur={onBlur}
            onChangeText={(text) => onChange(parseInstallmentCountInput(text))}
            errorText={errorText}
            helperText="De 2 a 60 parcelas."
          />
        )}
      />
      <InstallmentsPreview
        amount={amount}
        dueDate={dueDate}
        installmentCount={installmentCount}
      />
    </>
  );
}

interface CreditCardOptionButtonProps {
  readonly creditCard: CreditCard;
  readonly selected: boolean;
  readonly onSelect: (creditCardId: string) => void;
}

function CreditCardOptionButton({
  creditCard,
  selected,
  onSelect,
}: CreditCardOptionButtonProps): ReactElement {
  const label = formatCreditCardLabel(creditCard);
  return (
    <AppButton
      tone={selected ? "primary" : "secondary"}
      accessibilityState={{ selected }}
      onPress={() => onSelect(creditCard.id)}
    >
      {label}
    </AppButton>
  );
}

interface CreditCardsQueryStateProps {
  readonly query: ReturnType<typeof useCreditCardsQuery>;
  readonly creditCardsCount: number;
}

function CreditCardsQueryState({
  query,
  creditCardsCount,
}: CreditCardsQueryStateProps): ReactElement | null {
  if (query.isLoading) {
    return (
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Carregando cartoes.
      </Paragraph>
    );
  }
  if (query.isError) {
    return (
      <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
        Nao foi possivel carregar cartoes.
      </Paragraph>
    );
  }
  if (creditCardsCount === 0) {
    return (
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Cadastre um cartao para parcelar despesas.
      </Paragraph>
    );
  }
  return null;
}

interface InstallmentsPreviewProps {
  readonly amount: string;
  readonly dueDate: string;
  readonly installmentCount: number | null;
}

function InstallmentsPreview({
  amount,
  dueDate,
  installmentCount,
}: InstallmentsPreviewProps): ReactElement | null {
  const preview = useMemo(() => {
    if (installmentCount === null || installmentCount < 2 || amount.trim().length === 0) {
      return null;
    }
    const firstDueDate = parseDueDateForPreview(dueDate);
    if (!firstDueDate) {
      return null;
    }
    try {
      return previewInstallments({ amount, installmentCount, firstDueDate });
    } catch {
      return null;
    }
  }, [amount, dueDate, installmentCount]);

  if (!preview) {
    return null;
  }

  const lastInstallment = preview.installments.at(-1);
  return (
    <YStack gap="$1" backgroundColor="$surfaceRaised" padding="$3" borderRadius="$1">
      <Paragraph color="$color" fontFamily="$body" fontSize="$3">
        {installmentCount}x de {formatPreviewCurrency(preview.perInstallmentAmount)}
      </Paragraph>
      {lastInstallment ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Primeira em {formatShortDate(preview.installments[0].dueDate)} - ultima em{" "}
          {formatShortDate(lastInstallment.dueDate)}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

const parseInstallmentCountInput = (text: string): number | null => {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 0) {
    return null;
  }
  return Number.parseInt(digits, 10);
};

const parseDueDateForPreview = (value: string): Date | null => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatCreditCardLabel = (creditCard: CreditCard): string => {
  if (creditCard.lastFourDigits) {
    return `${creditCard.name} final ${creditCard.lastFourDigits}`;
  }
  return creditCard.name;
};

const formatPreviewCurrency = (value: string): string => {
  return formatCurrency(Number(value)).replace(/\u00A0/g, " ");
};
