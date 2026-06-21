/**
 * Controller (somente lógica, sem UI) do FEED redesenhado de "Transações".
 *
 * É uma camada fina sobre `useTransactionsScreenController` (filtros, navegação
 * de período, mutações, form) que adiciona o modo de visualização
 * (Fácil | Analítico) e deriva os view-models do feed — KPIs do herói, barras
 * de "Gastos por categoria" e itens do feed — a partir das funções puras de
 * `model/transactions-feed` e das tags públicas (`useTagsQuery`).
 *
 * O controller base permanece intocado: este hook apenas o consome e enriquece.
 * Consumir hooks públicos de outras features (`useTagsQuery`) é o padrão aceito
 * (espelha o controller da home de Cartões).
 */

import { useCallback, useMemo, useState } from "react";

import {
  type TransactionsScreenController,
  useTransactionsScreenController,
} from "@/features/transactions/hooks/use-transactions-screen-controller";
import {
  type CategoryBar,
  type FeedKpis,
  type TransactionFeedItem,
  computeFeedKpis,
  groupExpensesByCategory,
  toFeedItem,
} from "@/features/transactions/model/transactions-feed";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";

/** Modo de visualização do feed redesenhado. */
export type TransactionsFeedViewMode = "facil" | "analitico";

/** KPIs zerados, usados quando ainda não há dados carregados. */
const EMPTY_KPIS: FeedKpis = { income: 0, expense: 0, result: 0, count: 0 };

/** Data de hoje (`YYYY-MM-DD`) em horário local, para rótulos relativos. */
const todayIso = (): string => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

/**
 * Contrato do controller do feed: o controller base + os extras do feed.
 *
 * `viewMode`/`setViewMode` do controller base (list | calendar) são o eixo do
 * redesign (Fácil | Analítico); por isso são omitidos da base e redeclarados
 * aqui. O toggle de calendário (que reusa a flag list/calendar do controller
 * base) é exposto separadamente via `calendarActive`/`toggleCalendar`.
 */
export interface TransactionsFeedController
  extends Omit<TransactionsScreenController, "viewMode" | "setViewMode"> {
  /** Modo de visualização atual (Fácil | Analítico). */
  readonly viewMode: TransactionsFeedViewMode;
  /** Alterna o modo de visualização. */
  readonly setViewMode: (mode: TransactionsFeedViewMode) => void;
  /** True quando a visão de calendário está ativa (reusa o estado base). */
  readonly calendarActive: boolean;
  /** Alterna entre a lista (feed) e o calendário. */
  readonly toggleCalendar: () => void;
  /** KPIs agregados do período para o herói. */
  readonly heroKpis: FeedKpis;
  /** Barras de "Gastos por categoria" (modo Analítico). */
  readonly categoryBars: readonly CategoryBar[];
  /** Itens do feed prontos para render (view-models). */
  readonly feedItems: readonly TransactionFeedItem[];
}

/**
 * Orquestra o feed de transações: estende o controller base com o modo de
 * visualização e os view-models derivados (KPIs, barras por categoria e itens).
 *
 * @returns Controller do feed (base + extras).
 */
export function useTransactionsFeedController(): TransactionsFeedController {
  const {
    viewMode: baseViewMode,
    setViewMode: setBaseViewMode,
    ...base
  } = useTransactionsScreenController();
  const tagsQuery = useTagsQuery();
  const [viewMode, setViewMode] = useState<TransactionsFeedViewMode>("facil");

  const calendarActive = baseViewMode === "calendar";
  const toggleCalendar = useCallback((): void => {
    setBaseViewMode(baseViewMode === "calendar" ? "list" : "calendar");
  }, [baseViewMode, setBaseViewMode]);

  const records = useMemo(
    () => base.transactionsQuery.data?.transactions ?? [],
    [base.transactionsQuery.data],
  );
  const tags = useMemo(() => tagsQuery.data?.tags ?? [], [tagsQuery.data]);

  const heroKpis = useMemo<FeedKpis>(
    () => (records.length > 0 ? computeFeedKpis(records) : EMPTY_KPIS),
    [records],
  );
  const categoryBars = useMemo<readonly CategoryBar[]>(
    () => groupExpensesByCategory(records, tags),
    [records, tags],
  );
  // O feed visível respeita o filtro client-side de grupo de parcelas
  // ("mostrar a mesma compra"); os KPIs/barras seguem o conjunto do período
  // (paridade com o `monthBalance` do controller base, que usa tudo).
  const feedItems = useMemo<readonly TransactionFeedItem[]>(() => {
    const today = todayIso();
    const visible = base.installmentGroupFilter
      ? records.filter(
          (tx) => tx.installmentGroupId === base.installmentGroupFilter,
        )
      : records;
    return visible.map((tx) =>
      toFeedItem({ tx, tags, kpis: heroKpis, today, selectedMonth: base.selectedMonth }),
    );
  }, [records, tags, heroKpis, base.installmentGroupFilter, base.selectedMonth]);

  return {
    ...base,
    viewMode,
    setViewMode,
    calendarActive,
    toggleCalendar,
    heroKpis,
    categoryBars,
    feedItems,
  };
}
