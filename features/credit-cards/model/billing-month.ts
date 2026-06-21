/**
 * Utilidades puras de "mês de fatura" (chave `YYYY-MM`) para a área de Cartões.
 *
 * Portado das funções puras e testadas do auraxis-web
 * (`app/features/credit-cards/utils/transaction-billing.ts`), sem dependência de
 * UI ou framework. É a fonte canônica de cálculo de mês; os controllers de
 * Cartões devem delegar para cá (DRY).
 */

/** Abreviações de meses em português (índice 0 = janeiro). */
const MONTH_ABBR_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** Nomes extensos de meses em português (índice 0 = janeiro). */
const MONTH_LABELS_PT = [
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

const padMonth = (value: number): string => value.toString().padStart(2, "0");

/**
 * Divide uma chave de mês (`YYYY-MM`) em ano e índice de mês (0-based).
 *
 * @param month Chave `YYYY-MM`.
 * @returns Tupla `[ano, índiceDoMês]`.
 */
export const parseMonthKey = (month: string): readonly [number, number] => {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const monthNumber = Number.parseInt(monthRaw ?? "", 10);
  return [
    Number.isFinite(year) ? year : 1970,
    (Number.isFinite(monthNumber) ? monthNumber : 1) - 1,
  ];
};

/**
 * Formata ano + índice de mês como chave `YYYY-MM` normalizada (com virada de ano).
 *
 * @param year Ano.
 * @param monthIndex Índice 0-based do mês (pode ser negativo ou > 11).
 * @returns Chave `YYYY-MM`.
 */
export const formatMonthKey = (year: number, monthIndex: number): string => {
  const date = new Date(year, monthIndex, 1);
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}`;
};

/**
 * Mês de fatura atual (`YYYY-MM`) baseado na data corrente.
 *
 * @returns Chave `YYYY-MM` do mês atual.
 */
export const currentBillMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${padMonth(now.getMonth() + 1)}`;
};

/**
 * Desloca uma chave de mês (`YYYY-MM`) por um número de meses.
 *
 * @param month Mês base (`YYYY-MM`).
 * @param delta Deslocamento em meses (negativo = passado).
 * @returns Nova chave `YYYY-MM`.
 */
export const shiftMonthKey = (month: string, delta: number): string => {
  const [year, monthIndex] = parseMonthKey(month);
  return formatMonthKey(year, monthIndex + delta);
};

/**
 * Abreviação do mês em português ("Jun").
 *
 * @param month Mês (`YYYY-MM`).
 * @returns Abreviação de 3 letras.
 */
export const monthKeyShort = (month: string): string => {
  const [, monthIndex] = parseMonthKey(month);
  return MONTH_ABBR_PT[monthIndex] ?? "";
};

/**
 * Rótulo extenso do mês em português ("junho de 2026").
 *
 * @param month Mês (`YYYY-MM`).
 * @returns Rótulo humano.
 */
export const monthKeyLabel = (month: string): string => {
  const [year, monthIndex] = parseMonthKey(month);
  return `${MONTH_LABELS_PT[monthIndex] ?? ""} de ${year}`;
};

/**
 * Gera a janela crescente de N meses de fatura terminando em `endMonth`.
 *
 * @param endMonth Mês final (`YYYY-MM`), incluído na janela.
 * @param count Quantidade de meses (>= 1).
 * @returns Lista de chaves `YYYY-MM`, da mais antiga para a mais recente.
 */
export const billMonthsWindow = (endMonth: string, count: number): string[] => {
  const [year, monthIndex] = parseMonthKey(endMonth);
  const total = Math.max(1, count);
  const months: string[] = [];
  for (let offset = total - 1; offset >= 0; offset -= 1) {
    months.push(formatMonthKey(year, monthIndex - offset));
  }
  return months;
};

/**
 * Primeiro dia (`YYYY-MM-DD`) da janela de N meses terminando em `endMonth`, com
 * folga de 1 mês para cobrir compras que caem na fatura do mês mais antigo.
 *
 * @param endMonth Mês final (`YYYY-MM`).
 * @param count Quantidade de meses da janela.
 * @returns Data inicial `YYYY-MM-DD` para filtrar transações.
 */
export const billWindowStartDate = (endMonth: string, count: number): string => {
  const [year, monthIndex] = parseMonthKey(endMonth);
  const date = new Date(year, monthIndex - Math.max(1, count), 1);
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}-01`;
};

/**
 * Último dia (`YYYY-MM-DD`) de um mês.
 *
 * @param month Mês (`YYYY-MM`).
 * @returns Data final `YYYY-MM-DD`.
 */
export const monthEndDate = (month: string): string => {
  const [year, monthIndex] = parseMonthKey(month);
  const last = new Date(year, monthIndex + 1, 0);
  return `${last.getFullYear()}-${padMonth(last.getMonth() + 1)}-${padMonth(last.getDate())}`;
};
