/**
 * Funções puras que alimentam o FEED redesenhado de "Transações" (modos Fácil
 * e Analítico). Sem dependência de UI ou framework: recebem registros crus +
 * tags e devolvem KPIs, barras por categoria e view-models tipados.
 *
 * O cálculo de cor/nome de categoria espelha o padrão dos Cartões
 * (`credit-card-aggregation`), reusando `resolveCategoryColor` /
 * `NO_CATEGORY_COLOR`. Formatação monetária delega para `formatCurrencySigned`.
 */

import type {
  TransactionRecord,
  TransactionStatus,
  TransactionType,
} from "@/features/transactions/contracts";
import {
  resolveInvoiceBadgeMonth,
  type SelectedMonthRef,
} from "@/features/transactions/model/invoice-badge";
import type { Tag } from "@/features/tags/contracts";
import { NO_CATEGORY_COLOR, resolveCategoryColor } from "@/shared/theme";
import { formatCurrencySigned } from "@/shared/utils/formatters";

/** Rótulo usado para lançamentos sem categoria. */
export const NO_CATEGORY_LABEL = "Sem categoria";

/** Janela máxima (em dias) coberta por rótulos relativos "em/há N dias". */
export const RELATIVE_DATE_WINDOW_DAYS = 14;

/** Milissegundos em um dia, usado no cálculo de diferença de datas. */
const MS_PER_DAY = 86_400_000;

/** KPIs agregados do feed (herói). */
export interface FeedKpis {
  /** Soma das receitas (entradas) não canceladas. */
  readonly income: number;
  /** Soma das despesas (saídas) não canceladas. */
  readonly expense: number;
  /** Resultado líquido do período (income − expense). */
  readonly result: number;
  /** Quantidade de lançamentos considerados. */
  readonly count: number;
}

/** Barra de "Gastos por categoria" (modo Analítico). */
export interface CategoryBar {
  /** Id da tag, ou null para "Sem categoria". */
  readonly tagId: string | null;
  /** Nome da categoria (tag) ou "Sem categoria". */
  readonly name: string;
  /** Cor hexadecimal resolvida para a categoria. */
  readonly color: string;
  /** Total gasto na categoria. */
  readonly total: number;
}

/** View-model de um item do feed de transações. */
export interface TransactionFeedItem {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  /** Valor numérico do lançamento (sempre positivo). */
  readonly amount: number;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly isRecurring: boolean;
  readonly isInstallment: boolean;
  /** Nome da categoria (tag) ou "Sem categoria". */
  readonly categoryName: string;
  /** Cor hexadecimal da categoria. */
  readonly categoryColor: string;
  /** Ícone da categoria (tag) ou null. */
  readonly categoryIcon: string | null;
  /** Rótulo relativo ("Hoje", "em 3 dias") ou null para fallback "DD mmm". */
  readonly relativeDate: string | null;
  /** Rótulo de data pronto: o relativo quando há, senão o fallback "DD mmm". */
  readonly dateDisplay: string;
  /** Valor monetário formatado com sinal (ex.: "+ R$ 250,00"). */
  readonly signedDisplay: string;
  /** Participação do lançamento no fluxo do seu tipo (0..100, inteiro). */
  readonly percentOfFlow: number;
  /**
   * Rótulo "mmm/aa" do mês da fatura (= mês selecionado) quando o lançamento é
   * de cartão e a compra veio de outro mês; null quando o selo não se aplica.
   */
  readonly invoiceBadgeMonth: string | null;
}

/**
 * Converte uma string de data (`YYYY-MM-DD` ou ISO com horário) em uma data
 * local somente-data (sem componente de horário), evitando bugs de fuso.
 *
 * @param value String de data da API.
 * @returns Data local normalizada (00:00 local).
 */
const toDateOnly = (value: string): Date => {
  const [datePart] = value.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

/**
 * Diferença em dias (inteiro) entre `dueDate` e `today`, somente por data.
 *
 * @param dueDate Data alvo (`YYYY-MM-DD`).
 * @param today Data de referência (`YYYY-MM-DD`).
 * @returns Dias relativos (positivo = futuro, negativo = passado).
 */
const dayDelta = (dueDate: string, today: string): number => {
  const diff = toDateOnly(dueDate).getTime() - toDateOnly(today).getTime();
  return Math.round(diff / MS_PER_DAY);
};

/**
 * Rótulo relativo de uma data de vencimento ("Hoje", "Ontem", "Amanhã",
 * "em N dias", "há N dias") ou null quando está fora da janela de ±14 dias —
 * nesse caso a UI usa o fallback "DD mmm". Parsing é date-only/timezone-safe.
 *
 * @param dueDate Data de vencimento (`YYYY-MM-DD`).
 * @param today Data de referência (`YYYY-MM-DD`).
 * @returns Rótulo relativo em pt-BR ou null.
 */
export const relativeDateLabel = (
  dueDate: string,
  today: string,
): string | null => {
  const delta = dayDelta(dueDate, today);
  if (delta === 0) {
    return "Hoje";
  }
  if (delta === -1) {
    return "Ontem";
  }
  if (delta === 1) {
    return "Amanhã";
  }
  if (delta > 1 && delta <= RELATIVE_DATE_WINDOW_DAYS) {
    return `em ${delta} dias`;
  }
  if (delta < -1 && delta >= -RELATIVE_DATE_WINDOW_DAYS) {
    return `há ${Math.abs(delta)} dias`;
  }
  return null;
};

/** Abreviações de mês em pt-BR (índice 0 = janeiro), para o fallback "DD mmm". */
const MONTH_ABBR_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/**
 * Rótulo curto "DD mmm" (ex.: "20 jun") a partir de uma data `YYYY-MM-DD`,
 * com parsing date-only/timezone-safe.
 *
 * @param dueDate Data de vencimento (`YYYY-MM-DD`).
 * @returns Rótulo curto pt-BR.
 */
export const shortDateLabel = (dueDate: string): string => {
  const date = toDateOnly(dueDate);
  return `${date.getDate()} ${MONTH_ABBR_PT[date.getMonth()] ?? ""}`.trim();
};

/** Converte o amount string da API em número, tratando valores inválidos. */
const parseAmount = (amount: string): number => {
  const value = Number.parseFloat(amount);
  return Number.isNaN(value) ? 0 : value;
};

/**
 * Indica se um registro deve entrar nos agregados: nunca canceladas e, quando
 * uma whitelist de status é informada, somente os status listados.
 *
 * @param record Registro de transação.
 * @param statuses Whitelist opcional de status.
 * @returns True quando o registro deve ser contado.
 */
const isCountable = (
  record: TransactionRecord,
  statuses: readonly TransactionStatus[] | undefined,
): boolean => {
  if (record.status === "cancelled") {
    return false;
  }
  return statuses ? statuses.includes(record.status) : true;
};

/**
 * Calcula os KPIs do herói (receitas, despesas, resultado e contagem) a partir
 * dos registros, somando pelo `amount` string. Canceladas são sempre excluídas;
 * uma whitelist opcional de status restringe ainda mais o conjunto.
 *
 * @param transactions Registros de transação.
 * @param statuses Whitelist opcional de status a considerar.
 * @returns KPIs agregados do período.
 */
export const computeFeedKpis = (
  transactions: readonly TransactionRecord[],
  statuses?: readonly TransactionStatus[],
): FeedKpis => {
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const record of transactions) {
    if (!isCountable(record, statuses)) {
      continue;
    }
    count += 1;
    const value = parseAmount(record.amount);
    if (record.type === "income") {
      income += value;
    } else {
      expense += value;
    }
  }
  return { income, expense, result: income - expense, count };
};

/** Resolve nome/cor de categoria a partir de um id de tag (ou null). */
const resolveCategory = (
  tagId: string | null,
  tagById: ReadonlyMap<string, Tag>,
): { readonly name: string; readonly color: string } => {
  const tag = tagId ? tagById.get(tagId) ?? null : null;
  if (!tagId) {
    return { name: NO_CATEGORY_LABEL, color: NO_CATEGORY_COLOR };
  }
  return {
    name: tag?.name ?? NO_CATEGORY_LABEL,
    color: resolveCategoryColor({ id: tagId, color: tag?.color }),
  };
};

/**
 * Agrupa apenas as despesas (não canceladas) por categoria, somando o total e
 * resolvendo nome/cor da tag, ordenado por total decrescente. Espelha o padrão
 * dos Cartões.
 *
 * @param transactions Registros de transação.
 * @param tags Categorias do usuário.
 * @returns Barras por categoria, do maior para o menor total.
 */
export const groupExpensesByCategory = (
  transactions: readonly TransactionRecord[],
  tags: readonly Tag[],
): CategoryBar[] => {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const totals = new Map<string | null, number>();
  for (const record of transactions) {
    if (record.type !== "expense" || record.status === "cancelled") {
      continue;
    }
    const current = totals.get(record.tagId) ?? 0;
    totals.set(record.tagId, current + parseAmount(record.amount));
  }
  return [...totals.entries()]
    .map(([tagId, total]) => ({ ...resolveCategory(tagId, tagById), tagId, total }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Percentual inteiro de um valor sobre um total. Retorna 0 quando o total é 0.
 *
 * @param amount Valor parcial.
 * @param total Total de referência.
 * @returns Percentual inteiro (0..100+).
 */
export const percentOfTotal = (amount: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Math.round((amount / total) * 100);
};

/** Argumentos para construir um item do feed. */
export interface ToFeedItemArgs {
  /** Registro cru da transação. */
  readonly tx: TransactionRecord;
  /** Categorias do usuário. */
  readonly tags: readonly Tag[];
  /** KPIs do período (para o denominador de `percentOfFlow`). */
  readonly kpis: FeedKpis;
  /** Data de referência (`YYYY-MM-DD`) para o rótulo relativo. */
  readonly today: string;
  /**
   * Mês selecionado no feed (para o selo de fatura). Ausente/null quando não há
   * um mês único de referência — nesse caso o selo nunca aparece.
   */
  readonly selectedMonth?: SelectedMonthRef | null;
}

/**
 * Constrói o view-model de um item do feed: categoria (nome/cor/ícone), rótulo
 * relativo de data, valor com sinal e participação no fluxo do seu tipo
 * (receita vs despesa). Recebe um objeto único para respeitar o limite de
 * parâmetros do lint.
 *
 * @param args Registro, tags, KPIs e data de referência.
 * @returns View-model pronto para a UI.
 */
export const toFeedItem = ({
  tx,
  tags,
  kpis,
  today,
  selectedMonth = null,
}: ToFeedItemArgs): TransactionFeedItem => {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const category = resolveCategory(tx.tagId, tagById);
  const tag = tx.tagId ? tagById.get(tx.tagId) ?? null : null;
  const amount = parseAmount(tx.amount);
  const signed = tx.type === "income" ? amount : -amount;
  const flow = tx.type === "income" ? kpis.income : kpis.expense;
  const relativeDate = relativeDateLabel(tx.dueDate, today);
  return {
    id: tx.id,
    title: tx.title,
    description: tx.description,
    amount,
    type: tx.type,
    status: tx.status,
    isRecurring: tx.isRecurring,
    isInstallment: tx.isInstallment,
    categoryName: category.name,
    categoryColor: category.color,
    categoryIcon: tag?.icon ?? null,
    relativeDate,
    dateDisplay: relativeDate ?? shortDateLabel(tx.dueDate),
    signedDisplay: formatCurrencySigned(signed),
    percentOfFlow: percentOfTotal(amount, flow),
    invoiceBadgeMonth: resolveInvoiceBadgeMonth({
      creditCardId: tx.creditCardId,
      dueDate: tx.dueDate,
      selectedMonth,
    }),
  };
};
