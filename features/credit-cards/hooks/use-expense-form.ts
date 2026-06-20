import { useCallback, useMemo, useState } from "react";

import type { Account } from "@/features/accounts/contracts";
import { useAccountsQuery } from "@/features/accounts/hooks/use-accounts-query";
import type { CreditCard } from "@/features/credit-cards/contracts";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import type { Tag } from "@/features/tags/contracts";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type { TransactionStatus } from "@/features/transactions/contracts";
import { useCreateTransactionMutation } from "@/features/transactions/hooks/use-transaction-mutations";
import { TRANSACTION_INSTALLMENTS_FEATURE_FLAG_KEY } from "@/features/transactions/installments-config";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { parseCurrencyCentsInput } from "@/shared/utils/currency";

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

/** API pública do controller do formulário de despesa. */
export interface ExpenseFormController {
  readonly cards: readonly CreditCard[];
  readonly tags: readonly Tag[];
  readonly accounts: readonly Account[];
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
  readonly setSubmitError: (error: unknown) => void;
  readonly reset: () => void;
}

/** Estado bruto + setters do formulário (extraído para manter o hook enxuto). */
const useExpenseFormState = (): ExpenseFormState => {
  const [title, setTitle] = useState("");
  const [amountText, setAmountText] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayIso);
  const [creditCardId, setCreditCardId] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState<TransactionStatus>("pending");
  const [mode, setMode] = useState<InstallmentMode>("avista");
  const [installments, setInstallmentsState] = useState(DEFAULT_INSTALLMENTS);
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentText, setDownPaymentText] = useState("");
  const [submitError, setSubmitError] = useState<unknown>(null);

  const setInstallments = useCallback((value: number): void => {
    setInstallmentsState(
      Math.min(MAX_INSTALLMENTS, Math.max(MIN_INSTALLMENTS, Math.floor(value))),
    );
  }, []);

  const reset = useCallback((): void => {
    setTitle("");
    setAmountText("");
    setPurchaseDate(todayIso());
    setCreditCardId(null);
    setTagId(null);
    setAccountId(null);
    setStatus("pending");
    setMode("avista");
    setInstallmentsState(DEFAULT_INSTALLMENTS);
    setHasDownPayment(false);
    setDownPaymentText("");
    setSubmitError(null);
  }, []);

  return {
    title,
    amountText,
    purchaseDate,
    creditCardId,
    tagId,
    accountId,
    status,
    mode,
    installments,
    hasDownPayment,
    downPaymentText,
    submitError,
    setTitle,
    setAmountText,
    setPurchaseDate,
    selectCard: setCreditCardId,
    selectTag: setTagId,
    selectAccount: setAccountId,
    setStatus,
    setMode,
    setInstallments,
    toggleDownPayment: setHasDownPayment,
    setDownPaymentText,
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
      description: "",
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
    ],
  );
  return { amount, downPayment, selectedCard, plan, distribution, faturaPreview, values };
};

/**
 * Controller do formulário "Lançar despesa": estado, prévia ao vivo
 * (parcelamento/entrada/fatura) e envio reaproveitando a feature `transactions`.
 * O cartão é opcional e o CTA só habilita com valor > 0. A entrada é enviada
 * como duas transações (ver `buildExpensePayloads`).
 *
 * @returns Controller do formulário de despesa.
 */
export const useExpenseForm = (): ExpenseFormController => {
  const cardsQuery = useCreditCardsQuery();
  const tagsQuery = useTagsQuery();
  const accountsQuery = useAccountsQuery();
  const createMutation = useCreateTransactionMutation();
  const state = useExpenseFormState();

  const cards = useMemo(
    () => cardsQuery.data?.creditCards ?? [],
    [cardsQuery.data?.creditCards],
  );
  const tags = tagsQuery.data?.tags ?? [];
  const accounts = accountsQuery.data?.accounts ?? [];
  const derived = useExpenseDerived(state, cards);

  const submit = useCallback(async (): Promise<ExpenseSubmitResult> => {
    const payloads = buildExpensePayloads(derived.values);
    if (payloads.length === 0) {
      return { created: 0, ok: false, error: null };
    }
    state.setSubmitError(null);
    let created = 0;
    try {
      for (const payload of payloads) {
        await createMutation.mutateAsync(payload);
        created += 1;
      }
      return { created, ok: true, error: null };
    } catch (error) {
      state.setSubmitError(error);
      return { created, ok: false, error };
    }
  }, [createMutation, derived.values, state]);

  return {
    cards,
    tags,
    accounts,
    title: state.title,
    amountText: state.amountText,
    amount: derived.amount,
    purchaseDate: state.purchaseDate,
    creditCardId: state.creditCardId,
    tagId: state.tagId,
    accountId: state.accountId,
    status: state.status,
    mode: state.mode,
    installments: state.installments,
    hasDownPayment: state.hasDownPayment,
    downPaymentText: state.downPaymentText,
    plan: derived.plan,
    distribution: derived.distribution,
    faturaPreview: derived.faturaPreview,
    canSubmit: derived.amount > 0,
    installmentsEnabled: isFeatureEnabled(TRANSACTION_INSTALLMENTS_FEATURE_FLAG_KEY),
    isSubmitting: createMutation.isPending,
    submitError: state.submitError,
    setTitle: state.setTitle,
    setAmountText: state.setAmountText,
    setPurchaseDate: state.setPurchaseDate,
    selectCard: state.selectCard,
    selectTag: state.selectTag,
    selectAccount: state.selectAccount,
    setStatus: state.setStatus,
    setMode: state.setMode,
    setInstallments: state.setInstallments,
    toggleDownPayment: state.toggleDownPayment,
    setDownPaymentText: state.setDownPaymentText,
    submit,
    reset: state.reset,
  };
};
