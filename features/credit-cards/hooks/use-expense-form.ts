import { useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type { Account } from "@/features/accounts/contracts";
import { useAccountsQuery } from "@/features/accounts/hooks/use-accounts-query";
import type { CreditCard } from "@/features/credit-cards/contracts";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import type { Tag } from "@/features/tags/contracts";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type {
  TransactionRecord,
  TransactionStatus,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { TRANSACTION_INSTALLMENTS_FEATURE_FLAG_KEY } from "@/features/transactions/installments-config";
import { isFeatureEnabled } from "@/shared/feature-flags";
import {
  parseCurrencyCentsInput,
  serializeAmount,
} from "@/shared/utils/currency";
import type { ExpenseSheetRequest } from "@/stores/expense-sheet-store";

import { resolveCreditCardBillingCycle } from "../model/billing-cycle";
import { currentBillMonth, shiftMonthKey } from "../model/billing-month";
import {
  type ExpenseFormValues,
  buildExpensePayloads,
} from "../model/expense-submission";
import {
  type DistributionChip,
  type InstallmentMode,
  type InstallmentPlan,
  buildDistribution,
  computeInstallmentPlan,
} from "../model/installment-plan";

const MIN_INSTALLMENTS = 2;
const MAX_INSTALLMENTS = 24;
const DEFAULT_INSTALLMENTS = 3;

/** Prévia de em qual fatura a despesa vai cair. */
export interface ExpenseFaturaPreview {
  readonly hasCard: boolean;
  readonly cardName: string | null;
  readonly billLabel: string | null;
  readonly closingDate: string | null;
  readonly dueDate: string | null;
  readonly limitAmount: number | null;
}

/** Resultado do envio (suporta sucesso parcial: entrada criada, financiado falha). */
export interface ExpenseSubmitResult {
  readonly created: number;
  readonly ok: boolean;
  readonly error: unknown;
}

export type ExpenseFormMode = "create" | "edit";

/** API pública do controller do formulário de despesa. */
export interface ExpenseFormController {
  readonly cards: readonly CreditCard[];
  readonly tags: readonly Tag[];
  readonly accounts: readonly Account[];
  readonly formMode: ExpenseFormMode;
  readonly title: string;
  readonly amountText: string;
  readonly amount: number;
  readonly purchaseDate: string;
  readonly creditCardId: string | null;
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly status: TransactionStatus;
  readonly mode: InstallmentMode;
  readonly installments: number;
  readonly hasDownPayment: boolean;
  readonly downPaymentText: string;
  readonly description: string;
  readonly plan: InstallmentPlan;
  readonly distribution: readonly DistributionChip[];
  readonly faturaPreview: ExpenseFaturaPreview;
  readonly canSubmit: boolean;
  readonly installmentsEnabled: boolean;
  readonly isSubmitting: boolean;
  readonly submitError: unknown;
  readonly setTitle: (value: string) => void;
  readonly setAmountText: (value: string) => void;
  readonly setPurchaseDate: (value: string) => void;
  readonly selectCard: (cardId: string | null) => void;
  readonly selectTag: (tagId: string | null) => void;
  readonly selectAccount: (accountId: string | null) => void;
  readonly setStatus: (status: TransactionStatus) => void;
  readonly setMode: (mode: InstallmentMode) => void;
  readonly setInstallments: (value: number) => void;
  readonly toggleDownPayment: (value: boolean) => void;
  readonly setDownPaymentText: (value: string) => void;
  readonly setDescription: (value: string) => void;
  readonly submit: () => Promise<ExpenseSubmitResult>;
  readonly reset: () => void;
}

const todayIso = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const parseAmount = (text: string): number => parseCurrencyCentsInput(text) ?? 0;

interface ExpenseFormInitialState {
  readonly title: string;
  readonly amountText: string;
  readonly purchaseDate: string;
  readonly creditCardId: string | null;
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly status: TransactionStatus;
  readonly mode: InstallmentMode;
  readonly installments: number;
  readonly hasDownPayment: boolean;
  readonly downPaymentText: string;
  readonly description: string;
}

const createBlankInitialState = (
  request: Extract<ExpenseSheetRequest, { mode: "create" }>,
): ExpenseFormInitialState => ({
  title: "",
  amountText: "",
  purchaseDate:
    request.presetMonth && /^\d{4}-\d{2}$/u.test(request.presetMonth)
      ? `${request.presetMonth}-01`
      : todayIso(),
  creditCardId: request.presetCreditCardId ?? null,
  tagId: null,
  accountId: null,
  status: "pending",
  mode: "avista",
  installments: DEFAULT_INSTALLMENTS,
  hasDownPayment: false,
  downPaymentText: "",
  description: "",
});

const createEditInitialState = (
  transaction: TransactionRecord,
): ExpenseFormInitialState => ({
  title: transaction.title,
  amountText: transaction.amount,
  purchaseDate: transaction.dueDate,
  creditCardId: transaction.creditCardId,
  tagId: transaction.tagId,
  accountId: transaction.accountId,
  status: transaction.status,
  mode: transaction.isInstallment ? "parcelado" : "avista",
  installments: transaction.installmentCount ?? DEFAULT_INSTALLMENTS,
  hasDownPayment: false,
  downPaymentText: "",
  description: transaction.description ?? transaction.observation ?? "",
});

const createInitialState = (
  request: ExpenseSheetRequest,
): ExpenseFormInitialState =>
  request.mode === "edit"
    ? createEditInitialState(request.transaction)
    : createBlankInitialState(request);

const defaultCreateRequest: ExpenseSheetRequest = { mode: "create" };

/**
 * Mês de fatura inicial da distribuição: usa o ciclo do cartão quando há cartão
 * com fechamento/vencimento; senão assume a próxima fatura do mês corrente.
 */
const resolveStartBillMonth = (
  card: CreditCard | null,
  purchaseDate: string,
): string => {
  if (card && card.closingDay !== null && card.dueDay !== null) {
    return resolveCreditCardBillingCycle({
      purchaseDate,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
    }).billMonth;
  }
  return shiftMonthKey(currentBillMonth(), 1);
};

/**
 * Monta a prévia "cai na fatura de X" a partir do cartão e da data da compra.
 *
 * @param card Cartão selecionado (ou null).
 * @param purchaseDate Data da compra (`YYYY-MM-DD`).
 * @returns Prévia da fatura.
 */
const buildFaturaPreview = (
  card: CreditCard | null,
  purchaseDate: string,
): ExpenseFaturaPreview => {
  if (!card || card.closingDay === null || card.dueDay === null) {
    return {
      hasCard: card !== null,
      cardName: card?.name ?? null,
      billLabel: null,
      closingDate: null,
      dueDate: null,
      limitAmount: card?.limitAmount ?? null,
    };
  }
  const cycle = resolveCreditCardBillingCycle({
    purchaseDate,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
  });
  return {
    hasCard: true,
    cardName: card.name,
    billLabel: cycle.billLabel,
    closingDate: cycle.closingDate,
    dueDate: cycle.dueDate,
    limitAmount: card.limitAmount,
  };
};

interface ExpenseFormState {
  readonly title: string;
  readonly amountText: string;
  readonly purchaseDate: string;
  readonly creditCardId: string | null;
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly status: TransactionStatus;
  readonly mode: InstallmentMode;
  readonly installments: number;
  readonly hasDownPayment: boolean;
  readonly downPaymentText: string;
  readonly description: string;
  readonly submitError: unknown;
  readonly setTitle: (value: string) => void;
  readonly setAmountText: (value: string) => void;
  readonly setPurchaseDate: (value: string) => void;
  readonly selectCard: (cardId: string | null) => void;
  readonly selectTag: (tagId: string | null) => void;
  readonly selectAccount: (accountId: string | null) => void;
  readonly setStatus: (status: TransactionStatus) => void;
  readonly setMode: (mode: InstallmentMode) => void;
  readonly setInstallments: (value: number) => void;
  readonly toggleDownPayment: (value: boolean) => void;
  readonly setDownPaymentText: (value: string) => void;
  readonly setDescription: (value: string) => void;
  readonly setSubmitError: (error: unknown) => void;
  readonly reset: () => void;
}

/** Estado bruto + setters do formulário (extraído para manter o hook enxuto). */
const useExpenseFormState = (request: ExpenseSheetRequest): ExpenseFormState => {
  const initialState = createInitialState(request);
  const [values, setValues] = useState<ExpenseFormInitialState>(initialState);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const requestKey =
    request.mode === "edit"
      ? `edit:${request.transaction.id}:${request.transaction.updatedAt ?? ""}`
      : `create:${request.presetCreditCardId ?? ""}:${request.presetMonth ?? ""}`;

  useEffect(() => {
    setValues(createInitialState(request));
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- requestKey captura o contexto externo relevante.
  }, [requestKey]);

  const updateField = useCallback(
    <Key extends keyof ExpenseFormInitialState>(
      key: Key,
      value: ExpenseFormInitialState[Key],
    ): void => {
      setValues((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const setInstallments = useCallback((value: number): void => {
    updateField(
      "installments",
      Math.min(MAX_INSTALLMENTS, Math.max(MIN_INSTALLMENTS, Math.floor(value))),
    );
  }, [updateField]);

  const setField =
    <Key extends keyof ExpenseFormInitialState>(key: Key) =>
    (value: ExpenseFormInitialState[Key]): void => {
      updateField(key, value);
    };

  const setStatusField = useCallback((value: TransactionStatus): void => {
    updateField("status", value);
  }, [updateField]);

  const setModeField = useCallback((value: InstallmentMode): void => {
    updateField("mode", value);
  }, [updateField]);

  const reset = useCallback((): void => {
    setValues(createBlankInitialState(defaultCreateRequest));
    setSubmitError(null);
  }, []);

  return {
    ...values,
    submitError,
    setTitle: setField("title"),
    setAmountText: setField("amountText"),
    setPurchaseDate: setField("purchaseDate"),
    selectCard: setField("creditCardId"),
    selectTag: setField("tagId"),
    selectAccount: setField("accountId"),
    setStatus: setStatusField,
    setMode: setModeField,
    setInstallments,
    toggleDownPayment: setField("hasDownPayment"),
    setDownPaymentText: setField("downPaymentText"),
    setDescription: setField("description"),
    setSubmitError,
    reset,
  };
};

interface ExpenseDerived {
  readonly amount: number;
  readonly downPayment: number;
  readonly selectedCard: CreditCard | null;
  readonly plan: InstallmentPlan;
  readonly distribution: readonly DistributionChip[];
  readonly faturaPreview: ExpenseFaturaPreview;
  readonly values: ExpenseFormValues;
}

/** Valores derivados do estado (parcelamento, distribuição, prévia, payload-values). */
const useExpenseDerived = (
  state: ExpenseFormState,
  cards: readonly CreditCard[],
): ExpenseDerived => {
  const amount = parseAmount(state.amountText);
  const downPayment = parseAmount(state.downPaymentText);
  const selectedCard = useMemo(
    () => cards.find((card) => card.id === state.creditCardId) ?? null,
    [cards, state.creditCardId],
  );
  const plan = useMemo(
    () =>
      computeInstallmentPlan({
        total: amount,
        downPayment:
          state.mode === "parcelado" && state.hasDownPayment ? downPayment : 0,
        installments: state.installments,
      }),
    [amount, downPayment, state.hasDownPayment, state.installments, state.mode],
  );
  const distribution = useMemo(
    () =>
      buildDistribution({
        mode: state.mode,
        total: amount,
        downPayment,
        hasDownPayment: state.hasDownPayment,
        installments: state.installments,
        startBillMonth: resolveStartBillMonth(selectedCard, state.purchaseDate),
      }),
    [
      amount,
      downPayment,
      selectedCard,
      state.hasDownPayment,
      state.installments,
      state.mode,
      state.purchaseDate,
    ],
  );
  const faturaPreview = useMemo(
    () => buildFaturaPreview(selectedCard, state.purchaseDate),
    [selectedCard, state.purchaseDate],
  );
  const values = useMemo<ExpenseFormValues>(
    () => ({
      title: state.title,
      amount,
      purchaseDate: state.purchaseDate,
      creditCardId: state.creditCardId,
      tagId: state.tagId,
      accountId: state.accountId,
      status: state.status,
      mode: state.mode,
      installments: state.installments,
      hasDownPayment: state.hasDownPayment,
      downPayment,
      description: state.description,
    }),
    [
      amount,
      downPayment,
      state.accountId,
      state.creditCardId,
      state.hasDownPayment,
      state.installments,
      state.mode,
      state.purchaseDate,
      state.status,
      state.tagId,
      state.title,
      state.description,
    ],
  );
  return { amount, downPayment, selectedCard, plan, distribution, faturaPreview, values };
};

const buildExpenseUpdatePayload = (
  values: ExpenseFormValues,
): UpdateTransactionCommand => {
  const description = values.description.trim();
  return {
    title: values.title.trim(),
    amount: serializeAmount(values.amount),
    type: "expense",
    dueDate: values.purchaseDate,
    status: values.status,
    creditCardId: values.creditCardId,
    tagId: values.tagId,
    accountId: values.accountId,
    description: description.length > 0 ? description : null,
  };
};

interface ExpenseFormControllerParts {
  readonly cards: readonly CreditCard[];
  readonly tags: readonly Tag[];
  readonly accounts: readonly Account[];
  readonly formMode: ExpenseFormMode;
  readonly state: ExpenseFormState;
  readonly derived: ExpenseDerived;
  readonly isSubmitting: boolean;
  readonly submit: () => Promise<ExpenseSubmitResult>;
}

const buildExpenseFormController = (
  parts: ExpenseFormControllerParts,
): ExpenseFormController => ({
  cards: parts.cards,
  tags: parts.tags,
  accounts: parts.accounts,
  formMode: parts.formMode,
  title: parts.state.title,
  amountText: parts.state.amountText,
  amount: parts.derived.amount,
  purchaseDate: parts.state.purchaseDate,
  creditCardId: parts.state.creditCardId,
  tagId: parts.state.tagId,
  accountId: parts.state.accountId,
  status: parts.state.status,
  mode: parts.state.mode,
  installments: parts.state.installments,
  hasDownPayment: parts.state.hasDownPayment,
  downPaymentText: parts.state.downPaymentText,
  description: parts.state.description,
  plan: parts.derived.plan,
  distribution: parts.derived.distribution,
  faturaPreview: parts.derived.faturaPreview,
  canSubmit: parts.derived.amount > 0,
  installmentsEnabled: isFeatureEnabled(TRANSACTION_INSTALLMENTS_FEATURE_FLAG_KEY),
  isSubmitting: parts.isSubmitting,
  submitError: parts.state.submitError,
  setTitle: parts.state.setTitle,
  setAmountText: parts.state.setAmountText,
  setPurchaseDate: parts.state.setPurchaseDate,
  selectCard: parts.state.selectCard,
  selectTag: parts.state.selectTag,
  selectAccount: parts.state.selectAccount,
  setStatus: parts.state.setStatus,
  setMode: parts.state.setMode,
  setInstallments: parts.state.setInstallments,
  toggleDownPayment: parts.state.toggleDownPayment,
  setDownPaymentText: parts.state.setDownPaymentText,
  setDescription: parts.state.setDescription,
  submit: parts.submit,
  reset: parts.state.reset,
});

interface ExpenseSubmitArgs {
  readonly request: ExpenseSheetRequest;
  readonly values: ExpenseFormValues;
  readonly createMutation: ReturnType<typeof useCreateTransactionMutation>;
  readonly updateMutation: ReturnType<typeof useUpdateTransactionMutation>;
  readonly setSubmitError: (error: unknown) => void;
}

const useExpenseSubmit = (args: ExpenseSubmitArgs): (() => Promise<ExpenseSubmitResult>) => {
  const queryClient = useQueryClient();
  const editTransactionId =
    args.request.mode === "edit" ? args.request.transaction.id : null;

  const invalidateExpenseSurfaces = useCallback(async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root }),
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.root }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root }),
    ]);
  }, [queryClient]);

  const submitEdit = useCallback(async (): Promise<ExpenseSubmitResult> => {
    if (editTransactionId === null) {
      return { created: 0, ok: false, error: null };
    }
    args.setSubmitError(null);
    try {
      await args.updateMutation.mutateAsync({
        transactionId: editTransactionId,
        payload: buildExpenseUpdatePayload(args.values),
      });
      await invalidateExpenseSurfaces();
      return { created: 0, ok: true, error: null };
    } catch (error) {
      args.setSubmitError(error);
      return { created: 0, ok: false, error };
    }
  }, [args, editTransactionId, invalidateExpenseSurfaces]);

  const submitCreate = useCallback(async (): Promise<ExpenseSubmitResult> => {
    const payloads = buildExpensePayloads(args.values);
    if (payloads.length === 0) {
      return { created: 0, ok: false, error: null };
    }
    args.setSubmitError(null);
    let created = 0;
    try {
      for (const payload of payloads) {
        await args.createMutation.mutateAsync(payload);
        created += 1;
      }
      await invalidateExpenseSurfaces();
      return { created, ok: true, error: null };
    } catch (error) {
      args.setSubmitError(error);
      return { created, ok: false, error };
    }
  }, [args, invalidateExpenseSurfaces]);

  return useCallback(async (): Promise<ExpenseSubmitResult> => {
    return args.request.mode === "edit" ? submitEdit() : submitCreate();
  }, [args.request.mode, submitCreate, submitEdit]);
};

/**
 * Controller do formulário "Lançar despesa": estado, prévia ao vivo
 * (parcelamento/entrada/fatura) e envio reaproveitando a feature `transactions`.
 * O cartão é opcional e o CTA só habilita com valor > 0. A entrada é enviada
 * como duas transações (ver `buildExpensePayloads`).
 *
 * @returns Controller do formulário de despesa.
 */
export const useExpenseForm = (
  request: ExpenseSheetRequest = defaultCreateRequest,
): ExpenseFormController => {
  const cardsQuery = useCreditCardsQuery();
  const tagsQuery = useTagsQuery();
  const accountsQuery = useAccountsQuery();
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const state = useExpenseFormState(request);

  const cards = useMemo(
    () => cardsQuery.data?.creditCards ?? [],
    [cardsQuery.data?.creditCards],
  );
  const tags = tagsQuery.data?.tags ?? [];
  const accounts = accountsQuery.data?.accounts ?? [];
  const derived = useExpenseDerived(state, cards);
  const submit = useExpenseSubmit({
    createMutation,
    request,
    setSubmitError: state.setSubmitError,
    updateMutation,
    values: derived.values,
  });

  return buildExpenseFormController({
    cards,
    tags,
    accounts,
    formMode: request.mode,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    state,
    derived,
    submit,
  });
};
