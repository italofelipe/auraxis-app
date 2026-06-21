/**
 * Controller (somente lógica, sem UI) da tela "Detalhe do cartão" redesenhada.
 *
 * Resolve o cartão a partir da lista, dispara a query de utilização oficial
 * (gating pelo ciclo configurado) e — espelhando o padrão do
 * `use-cards-home-controller` — compõe `useTransactionsQuery` + `useTagsQuery`
 * com as funções puras do modelo (`card-transactions`, `credit-card-aggregation`)
 * para derivar o bloco de limite, a série de evolução, as principais categorias
 * e os lançamentos recentes deste cartão. Os números oficiais da fatura/utilização
 * são preferidos quando disponíveis; senão, derivamos das transações da janela.
 *
 * Consumir os hooks públicos de outras features (`useTransactionsQuery`,
 * `useTagsQuery`) a partir de Cartões é o padrão aceito aqui (espelha o app web).
 */

import { useCallback, useMemo } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { buildCreditCardBillPath } from "@/core/navigation/routes";
import type { CreditCard } from "@/features/credit-cards/contracts";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import {
  billWindowStartDate,
  currentBillMonth,
  monthEndDate,
} from "@/features/credit-cards/model/billing-month";
import { enrichCardTransactions } from "@/features/credit-cards/model/card-transactions";
import {
  buildCreditCardDetailViewModel,
  type CreditCardDetailViewModel,
} from "@/features/credit-cards/model/credit-card-detail";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useExpenseSheetStore } from "@/stores/expense-sheet-store";

/** Quantidade de meses da janela de evolução da fatura (inclui o mês atual). */
export const CREDIT_CARD_DETAIL_WINDOW_MONTHS = 7;

/**
 * Tamanho de página pedido ao listar transações do cartão. A listagem do backend
 * é paginada; pedimos uma página ampla para cobrir a janela inteira numa chamada.
 */
export const CREDIT_CARD_DETAIL_TRANSACTION_PAGE_SIZE = 500;

export interface UseCreditCardDetailScreenControllerOptions {
  /** Overrides the route param — used in tests. */
  readonly creditCardId?: string;
}

export interface CreditCardDetailScreenController {
  readonly creditCardId: string;
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly creditCard: CreditCard | null;
  readonly hasCycleConfig: boolean;
  readonly utilizationQuery: ReturnType<typeof useCreditCardUtilizationQuery>;
  readonly tagsQuery: ReturnType<typeof useTagsQuery>;
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly notFound: boolean;
  /** View-model derivado da tela; null quando o cartão não existe. */
  readonly detail: CreditCardDetailViewModel | null;
  readonly handleViewBill: () => void;
  readonly handleBack: () => void;
  /** Abre o sheet "Lançar despesa". */
  readonly handleLaunchExpense: () => void;
  /** Placeholder — bloquear cartão ainda não tem backend (no-op intencional). */
  readonly handleBlockCard: () => void;
  /** Placeholder — ajustes do cartão ainda não têm backend (no-op intencional). */
  readonly handleOpenSettings: () => void;
}

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

/**
 * Orquestra a tela "Detalhe do cartão": resolve o cartão, classifica o ciclo de
 * fatura (gating da utilização) e deriva o view-model da tela a partir das
 * transações da janela cruzadas com as tags. A tela permanece view-only.
 *
 * @param options Override opcional do id do cartão (testes).
 * @returns Contrato tipado consumido pela tela.
 */
export function useCreditCardDetailScreenController(
  options: UseCreditCardDetailScreenControllerOptions = {},
): CreditCardDetailScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const creditCardId = options.creditCardId ?? resolveStringParam(params.id);
  const openExpenseSheet = useExpenseSheetStore((state) => state.open);

  const creditCardsQuery = useCreditCardsQuery();
  const tagsQuery = useTagsQuery();

  const creditCard = useMemo<CreditCard | null>(
    () =>
      creditCardsQuery.data?.creditCards.find((card) => card.id === creditCardId) ??
      null,
    [creditCardsQuery.data, creditCardId],
  );

  const hasCycleConfig =
    creditCard !== null &&
    creditCard.closingDay !== null &&
    creditCard.dueDay !== null;

  const month = currentBillMonth();
  const utilizationQuery = useCreditCardUtilizationQuery(creditCardId, {
    enabled: hasCycleConfig,
  });
  const transactionsQuery = useTransactionsQuery({
    type: "expense",
    creditCardId,
    startDate: billWindowStartDate(month, CREDIT_CARD_DETAIL_WINDOW_MONTHS),
    endDate: monthEndDate(month),
    perPage: CREDIT_CARD_DETAIL_TRANSACTION_PAGE_SIZE,
  });

  const detail = useMemo<CreditCardDetailViewModel | null>(() => {
    if (creditCard === null) {
      return null;
    }
    const enriched = enrichCardTransactions(
      transactionsQuery.data?.transactions ?? [],
      [creditCard],
    );
    return buildCreditCardDetailViewModel({
      card: creditCard,
      transactions: enriched,
      tags: tagsQuery.data?.tags ?? [],
      utilization: utilizationQuery.data ?? null,
      month,
      windowMonths: CREDIT_CARD_DETAIL_WINDOW_MONTHS,
    });
  }, [
    creditCard,
    transactionsQuery.data?.transactions,
    tagsQuery.data?.tags,
    utilizationQuery.data,
    month,
  ]);

  const handleViewBill = useCallback((): void => {
    router.push(buildCreditCardBillPath(creditCardId));
  }, [router, creditCardId]);

  const handleBack = useCallback((): void => {
    router.back();
  }, [router]);

  const handleLaunchExpense = useCallback((): void => {
    openExpenseSheet();
  }, [openExpenseSheet]);

  return {
    creditCardId,
    creditCardsQuery,
    creditCard,
    hasCycleConfig,
    utilizationQuery,
    tagsQuery,
    transactionsQuery,
    notFound: !creditCardsQuery.isLoading && creditCard === null,
    detail,
    handleViewBill,
    handleBack,
    handleLaunchExpense,
    handleBlockCard: noopCardAction,
    handleOpenSettings: noopCardAction,
  };
}

/**
 * Placeholder das ações "Bloquear" e "Ajustes" — ainda sem backend. Mantido
 * nomeado (em vez de inline) para deixar explícito que é um no-op intencional.
 */
const noopCardAction = (): void => {
  /* Sem backend para bloquear/ajustar cartão ainda (ver PR/handoff). */
};
