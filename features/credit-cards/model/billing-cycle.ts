/**
 * Cálculo puro do ciclo de fatura de um cartão (dia de fechamento + dia de
 * vencimento → mês de fatura e datas do ciclo).
 *
 * Portado das funções puras e testadas do auraxis-web
 * (`app/features/credit-cards/utils/billing-cycle.ts`), sem dependência de UI ou
 * framework. É a fonte canônica de "em qual fatura uma compra cai".
 */

/** Entrada do cálculo de ciclo de fatura. */
export interface BillingCycleInput {
  /** Data da compra (`YYYY-MM-DD`) ou instância `Date`. */
  readonly purchaseDate: string | Date;
  /** Dia de fechamento da fatura (1-31). */
  readonly closingDay: number;
  /** Dia de vencimento da fatura (1-31). */
  readonly dueDay: number;
}

/** Preview do ciclo de fatura resolvido para uma compra. */
export interface BillingCyclePreview {
  /** Mês da fatura em que a compra cai (`YYYY-MM`). */
  readonly billMonth: string;
  /** Rótulo humano do mês da fatura ("junho de 2026"). */
  readonly billLabel: string;
  /** Primeiro dia do ciclo (`YYYY-MM-DD`). */
  readonly cycleStartDate: string;
  /** Data de fechamento da fatura (`YYYY-MM-DD`). */
  readonly closingDate: string;
  /** Data de vencimento da fatura (`YYYY-MM-DD`). */
  readonly dueDate: string;
  /** Se a compra ocorre até a data de fechamento (cai nesta fatura). */
  readonly closesAfterPurchase: boolean;
}

/** Nomes extensos de meses em português (índice 0 = janeiro). */
const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/**
 * Converte strings de data da API e instâncias `Date` em valores locais
 * (somente data, sem componente de horário).
 *
 * @param value String de data (`YYYY-MM-DD`) ou instância `Date`.
 * @returns Data local (somente data).
 */
const toDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

/**
 * Retorna o primeiro dia de um mês deslocado pelo offset informado.
 *
 * @param year Ano base.
 * @param monthIndex Índice 0-based do mês base.
 * @param offset Deslocamento em meses.
 * @returns Primeiro dia do mês deslocado.
 */
const shiftMonth = (year: number, monthIndex: number, offset: number): Date => {
  return new Date(year, monthIndex + offset, 1);
};

/**
 * Retorna a quantidade de dias do mês alvo.
 *
 * @param year Ano alvo.
 * @param monthIndex Índice 0-based do mês alvo.
 * @returns Último dia do calendário no mês.
 */
const lastDayOfMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Clampa dias de fatura como 31 para o último dia válido em meses curtos.
 *
 * @param year Ano alvo.
 * @param monthIndex Índice 0-based do mês alvo.
 * @param day Dia solicitado.
 * @returns Dia válido para o mês.
 */
const clampDay = (year: number, monthIndex: number, day: number): number => {
  return Math.min(Math.max(day, 1), lastDayOfMonth(year, monthIndex));
};

/**
 * Cria uma `Date` local usando um dia seguro para o mês.
 *
 * @param year Ano alvo.
 * @param monthIndex Índice 0-based do mês alvo.
 * @param day Dia solicitado.
 * @returns Data local com dia clampado.
 */
const buildDate = (year: number, monthIndex: number, day: number): Date => {
  return new Date(year, monthIndex, clampDay(year, monthIndex, day));
};

/**
 * Serializa uma `Date` como `YYYY-MM-DD` sem conversão de fuso.
 *
 * @param date Data a serializar.
 * @returns String de data (somente data).
 */
const isoDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Serializa o mês da fatura como `YYYY-MM`.
 *
 * @param date Data dentro do mês da fatura alvo.
 * @returns Chave do mês da fatura.
 */
const billMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Formata o mês da fatura em português para o preview da UI.
 *
 * @param date Data dentro do mês da fatura alvo.
 * @returns Rótulo humano do mês da fatura.
 */
const billLabel = (date: Date): string => {
  return `${MONTH_LABELS[date.getMonth()]} de ${date.getFullYear()}`;
};

/**
 * Resolve qual fatura recebe uma compra a partir dos dias de fechamento e
 * vencimento do cartão.
 *
 * @param input Data da compra e configuração de ciclo do cartão.
 * @returns Preview do ciclo de fatura da compra.
 */
export const resolveCreditCardBillingCycle = (
  input: BillingCycleInput,
): BillingCyclePreview => {
  const purchaseDate = toDate(input.purchaseDate);
  const purchaseYear = purchaseDate.getFullYear();
  const purchaseMonth = purchaseDate.getMonth();

  const closeAnchor =
    purchaseDate.getDate() <= input.closingDay
      ? new Date(purchaseYear, purchaseMonth, 1)
      : shiftMonth(purchaseYear, purchaseMonth, 1);

  const closingDate = buildDate(
    closeAnchor.getFullYear(),
    closeAnchor.getMonth(),
    input.closingDay,
  );
  const previousCloseAnchor = shiftMonth(
    closeAnchor.getFullYear(),
    closeAnchor.getMonth(),
    -1,
  );
  const previousClosingDate = buildDate(
    previousCloseAnchor.getFullYear(),
    previousCloseAnchor.getMonth(),
    input.closingDay,
  );

  const dueAnchor =
    input.dueDay > input.closingDay
      ? closeAnchor
      : shiftMonth(closeAnchor.getFullYear(), closeAnchor.getMonth(), 1);
  const dueDate = buildDate(
    dueAnchor.getFullYear(),
    dueAnchor.getMonth(),
    input.dueDay,
  );
  const cycleStartDate = new Date(previousClosingDate);
  cycleStartDate.setDate(previousClosingDate.getDate() + 1);

  return {
    billMonth: billMonth(closingDate),
    billLabel: billLabel(closingDate),
    cycleStartDate: isoDate(cycleStartDate),
    closingDate: isoDate(closingDate),
    dueDate: isoDate(dueDate),
    closesAfterPurchase: purchaseDate <= closingDate,
  };
};
