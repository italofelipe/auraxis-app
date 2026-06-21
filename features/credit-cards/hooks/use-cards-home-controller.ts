/**
 * Controller (somente lógica, sem UI) da HOME redesenhada de "Cartões".
 *
 * Orquestra um mês de fatura + cartão selecionados compartilhados que alimentam
 * duas visões — "Faturas" e "Analítico" — compondo os hooks de query públicos
 * (cartões, tags, transações, fatura e utilização) com as funções puras já
 * testadas do modelo (`billing-month`, `card-transactions`,
 * `credit-card-aggregation`, `credit-card-statement`, `credit-card-analytics`).
 *
 * Nenhuma estilização ou JSX vive aqui: o hook devolve view-models tipados que a
 * tela renderiza. As funções de cálculo NÃO são reimplementadas — este módulo
 * apenas seleciona estado, dispara as queries certas e delega para o modelo.
 *
 * Consumir os hooks públicos de outras features (`useTransactionsQuery`,
 * `useTagsQuery`) a partir de Cartões é o padrão aceito aqui (espelha o app web).
 */

import { useCallback, useMemo, useState } from "react";

import type {
  CreditCard,
  CreditCardBillRecord,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import { useCreditCardBillQuery } from "@/features/credit-cards/hooks/use-credit-card-bill-query";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import {
  billMonthsWindow,
  billWindowStartDate,
  currentBillMonth,
  monthEndDate,
  monthKeyLabel,
  monthKeyShort,
  shiftMonthKey,
} from "@/features/credit-cards/model/billing-month";
import { enrichCardTransactions } from "@/features/credit-cards/model/card-transactions";
import {
  type AnalyticsViewModel,
  buildAnalytics,
} from "@/features/credit-cards/model/credit-card-analytics";
import {
  type StatementViewModel,
  buildStatement,
} from "@/features/credit-cards/model/credit-card-statement";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";

/** Quantidade de meses da janela analítica/tendência (inclui o mês atual). */
export const CARDS_HOME_WINDOW_MONTHS = 6;

/** Quantidade de maiores lançamentos exibidos no Analítico. */
export const CARDS_HOME_TOP_COUNT = 7;

/**
 * Tamanho de página pedido ao listar transações. A listagem do backend é
 * paginada e não expõe um default amplo, então pedimos uma página grande para
 * cobrir a janela inteira de ~6 meses numa única chamada (ver limitação no
 * cabeçalho do PR/handoff caso o volume ultrapasse este teto).
 */
export const CARDS_HOME_TRANSACTION_PAGE_SIZE = 500;

/** Visão selecionada na HOME de Cartões. */
export type CardsHomeView = "faturas" | "analitico";

/** Chip de mês exibido no seletor horizontal. */
export interface CardsHomeMonthChip {
  /** Chave do mês (`YYYY-MM`). */
  readonly month: string;
  /** Abreviação ("Jun"). */
  readonly shortLabel: string;
  /** Rótulo extenso ("junho de 2026"). */
  readonly label: string;
  /** Marca o mês de fatura atual (relativo à data corrente). */
  readonly isCurrent: boolean;
}

/** Contrato completo retornado pelo controller da HOME de Cartões. */
export interface CardsHomeController {
  /** Query dos cartões (para loading/erro/refetch). */
  readonly cardsQuery: ReturnType<typeof useCreditCardsQuery>;
  /** Query das tags/categorias (para loading/erro/refetch). */
  readonly tagsQuery: ReturnType<typeof useTagsQuery>;
  /** Query das transações da janela (para loading/erro/refetch). */
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  /** Query de utilização oficial (habilitada só com cartão único). */
  readonly utilizationQuery: ReturnType<typeof useCreditCardUtilizationQuery>;
  /** Query da fatura oficial (habilitada só com cartão único). */
  readonly billQuery: ReturnType<typeof useCreditCardBillQuery>;
  /** Visão atual ("faturas" | "analitico"). */
  readonly view: CardsHomeView;
  /** Cartão selecionado, ou null para "Todos os cartões". */
  readonly selectedCardId: string | null;
  /** Mês de fatura selecionado (`YYYY-MM`). */
  readonly selectedMonth: string;
  /** Chips de mês recentes (do mais antigo ao mais recente). */
  readonly months: readonly CardsHomeMonthChip[];
  /** View-model da visão Faturas. */
  readonly faturas: StatementViewModel;
  /** View-model da visão Analítico. */
  readonly analitico: AnalyticsViewModel;
  /** Define a visão ativa. */
  readonly setView: (view: CardsHomeView) => void;
  /** Seleciona um cartão (ou null para "Todos"). */
  readonly selectCard: (cardId: string | null) => void;
  /** Seleciona um mês de fatura específico. */
  readonly selectMonth: (month: string) => void;
  /** Vai para o mês anterior. */
  readonly goPreviousMonth: () => void;
  /** Vai para o mês seguinte. */
  readonly goNextMonth: () => void;
}

/**
 * Monta os chips de mês da janela recente, marcando o mês de fatura atual.
 *
 * @param selectedMonth Mês selecionado (`YYYY-MM`), fim da janela.
 * @returns Chips do mais antigo ao mais recente.
 */
const buildMonthChips = (selectedMonth: string): CardsHomeMonthChip[] => {
  const current = currentBillMonth();
  return billMonthsWindow(selectedMonth, CARDS_HOME_WINDOW_MONTHS).map(
    (month) => ({
      month,
      shortLabel: monthKeyShort(month),
      label: monthKeyLabel(month),
      isCurrent: month === current,
    }),
  );
};

/** Parte de leitura do controller (queries + view-models derivados). */
interface CardsHomeData {
  readonly cardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly tagsQuery: ReturnType<typeof useTagsQuery>;
  readonly transactionsQuery: ReturnType<typeof useTransactionsQuery>;
  readonly utilizationQuery: ReturnType<typeof useCreditCardUtilizationQuery>;
  readonly billQuery: ReturnType<typeof useCreditCardBillQuery>;
  readonly months: readonly CardsHomeMonthChip[];
  readonly faturas: StatementViewModel;
  readonly analitico: AnalyticsViewModel;
}

/**
 * Dispara as queries e deriva os view-models a partir da seleção atual. Mantém o
 * lado de leitura isolado do estado/handlers do controller (DRY e legibilidade).
 *
 * @param selectedCardId Cartão selecionado (ou null para "Todos").
 * @param selectedMonth Mês de fatura selecionado (`YYYY-MM`).
 * @returns Queries e view-models já memoizados.
 */
const useCardsHomeData = (
  selectedCardId: string | null,
  selectedMonth: string,
): CardsHomeData => {
  const cardsQuery = useCreditCardsQuery();
  const tagsQuery = useTagsQuery();
  const transactionsQuery = useTransactionsQuery({
    type: "expense",
    startDate: billWindowStartDate(selectedMonth, CARDS_HOME_WINDOW_MONTHS),
    endDate: monthEndDate(selectedMonth),
    perPage: CARDS_HOME_TRANSACTION_PAGE_SIZE,
  });

  const isSingleCard = selectedCardId !== null;
  const utilizationQuery = useCreditCardUtilizationQuery(selectedCardId ?? "", {
    enabled: isSingleCard,
  });
  const billQuery = useCreditCardBillQuery(selectedCardId ?? "", selectedMonth, {
    enabled: isSingleCard,
  });

  const cards = useMemo<readonly CreditCard[]>(
    () => cardsQuery.data?.creditCards ?? [],
    [cardsQuery.data?.creditCards],
  );
  const tags = useMemo(() => tagsQuery.data?.tags ?? [], [tagsQuery.data?.tags]);
  const enriched = useMemo(
    () => enrichCardTransactions(transactionsQuery.data?.transactions ?? [], cards),
    [transactionsQuery.data?.transactions, cards],
  );
  const bill = useMemo<CreditCardBillRecord | null>(
    () => (isSingleCard ? billQuery.data ?? null : null),
    [isSingleCard, billQuery.data],
  );
  const utilization = useMemo<CreditCardUtilizationRecord | null>(
    () => (isSingleCard ? utilizationQuery.data ?? null : null),
    [isSingleCard, utilizationQuery.data],
  );

  const months = useMemo(() => buildMonthChips(selectedMonth), [selectedMonth]);
  const faturas = useMemo(
    () =>
      buildStatement({
        transactions: enriched,
        tags,
        cards,
        month: selectedMonth,
        cardId: selectedCardId,
        bill,
        utilization,
        trendMonths: CARDS_HOME_WINDOW_MONTHS,
      }),
    [enriched, tags, cards, selectedMonth, selectedCardId, bill, utilization],
  );
  const analitico = useMemo(
    () =>
      buildAnalytics({
        transactions: enriched,
        tags,
        cards,
        month: selectedMonth,
        cardId: selectedCardId,
        utilization,
        windowMonths: CARDS_HOME_WINDOW_MONTHS,
        topCount: CARDS_HOME_TOP_COUNT,
      }),
    [enriched, tags, cards, selectedMonth, selectedCardId, utilization],
  );

  return {
    cardsQuery,
    tagsQuery,
    transactionsQuery,
    utilizationQuery,
    billQuery,
    months,
    faturas,
    analitico,
  };
};

/**
 * Hook controller da HOME de Cartões: estado compartilhado + view-models.
 *
 * @returns Contrato tipado consumido pela tela (queries, estado, view-models e
 *   handlers).
 */
export function useCardsHomeController(): CardsHomeController {
  const [view, setView] = useState<CardsHomeView>("faturas");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    currentBillMonth(),
  );

  const data = useCardsHomeData(selectedCardId, selectedMonth);

  const selectCard = useCallback((cardId: string | null): void => {
    setSelectedCardId(cardId);
  }, []);
  const selectMonth = useCallback((month: string): void => {
    setSelectedMonth(month);
  }, []);
  const goPreviousMonth = useCallback((): void => {
    setSelectedMonth((current) => shiftMonthKey(current, -1));
  }, []);
  const goNextMonth = useCallback((): void => {
    setSelectedMonth((current) => shiftMonthKey(current, 1));
  }, []);

  return {
    ...data,
    view,
    selectedCardId,
    selectedMonth,
    setView,
    selectCard,
    selectMonth,
    goPreviousMonth,
    goNextMonth,
  };
}
