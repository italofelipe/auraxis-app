/**
 * Lógica derivada (pura) do selo "fatura {mmm/aa}" exibido em lançamentos de
 * cartão no FEED de "Transações".
 *
 * Contexto: quando a lista é navegada por MÊS, o backend agrupa lançamentos de
 * cartão pelo mês da FATURA (ciclo de fechamento), não pela data da compra. Uma
 * compra de 19/06 que cai na fatura de julho aparece na lista de "julho"
 * exibindo a data real 19/06. Para não confundir, marcamos essas linhas com um
 * selo discreto com o mês da fatura (= mês selecionado no feed).
 *
 * Sem dependência de UI: recebe dados crus e devolve o rótulo curto do mês ou
 * null quando o selo não se aplica. A composição i18n ("fatura {{month}}") fica
 * na camada de componente.
 */

/** Referência de mês selecionado no feed (`month` 0-indexado, como `Date`). */
export interface SelectedMonthRef {
  readonly year: number;
  /** Mês 0-indexado (0 = janeiro, 11 = dezembro). */
  readonly month: number;
}

/** Argumentos para resolver o selo de fatura de um lançamento. */
export interface InvoiceBadgeArgs {
  /** Id do cartão de crédito do lançamento (null quando não é de cartão). */
  readonly creditCardId: string | null;
  /** Data de vencimento do lançamento (`YYYY-MM-DD` ou ISO com horário). */
  readonly dueDate: string;
  /**
   * Mês selecionado no feed, ou null quando não há um mês único de referência
   * (ex.: um eventual modo de range custom) — nesse caso o selo não aparece.
   */
  readonly selectedMonth: SelectedMonthRef | null;
}

/**
 * Extrai o par ano/mês (0-indexado) de uma string de data, somente por data
 * (sem componente de horário), evitando bugs de fuso.
 *
 * @param value String de data (`YYYY-MM-DD` ou ISO).
 * @returns Ano e mês 0-indexado.
 */
const toYearMonth = (value: string): { year: number; month: number } => {
  const [datePart] = value.split("T");
  const [year, month] = (datePart ?? "").split("-").map(Number);
  return { year: year ?? 1970, month: (month ?? 1) - 1 };
};

/**
 * Rótulo curto "mmm/aa" (ex.: "jul/26") do mês selecionado, em pt-BR via Intl.
 * O `Intl` devolve "jul. de 26"; reduzimos para a forma compacta removendo o
 * ponto da abreviação do mês e juntando mês e ano de 2 dígitos com "/".
 *
 * @param selectedMonth Mês selecionado no feed.
 * @returns Rótulo curto pt-BR no formato "mmm/aa".
 */
export const invoiceBadgeMonthLabel = (selectedMonth: SelectedMonthRef): string => {
  const reference = new Date(selectedMonth.year, selectedMonth.month, 1);
  const parts = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).formatToParts(reference);
  const monthPart = parts.find((part) => part.type === "month")?.value ?? "";
  const yearPart = parts.find((part) => part.type === "year")?.value ?? "";
  const month = monthPart.replace(/\.$/, "");
  return `${month}/${yearPart}`;
};

/**
 * Resolve o rótulo do selo de fatura ("mmm/aa") para um lançamento, ou null
 * quando o selo não se aplica. O selo só aparece quando:
 *   1. o lançamento é de cartão (`creditCardId` presente);
 *   2. há um mês selecionado de referência (não em modo range custom); e
 *   3. o mês/ano do `dueDate` (data da compra) difere do mês selecionado — ou
 *      seja, a compra "veio de outro mês" pela fatura.
 *
 * @param args Id do cartão, data de vencimento e mês selecionado.
 * @returns Rótulo "mmm/aa" do mês da fatura, ou null.
 */
export const resolveInvoiceBadgeMonth = ({
  creditCardId,
  dueDate,
  selectedMonth,
}: InvoiceBadgeArgs): string | null => {
  if (!creditCardId || !selectedMonth) {
    return null;
  }
  const due = toYearMonth(dueDate);
  const sameMonth = due.year === selectedMonth.year && due.month === selectedMonth.month;
  if (sameMonth) {
    return null;
  }
  return invoiceBadgeMonthLabel(selectedMonth);
};
