/**
 * Domain model for the Custo do Estilo de Vida calculator (#627).
 *
 * Calculates the opportunity cost of recurring expenses over a
 * given time horizon if invested instead. Supports URL query param
 * encoding for viral sharing.
 */

import { round2 } from "./math-utils";

export const CUSTO_ESTILO_VIDA_PUBLIC_PATH = "/tools/custo-estilo-vida";

// ─── Expense entry ───────────────────────────────────────────────────────────

export interface RecurringExpense {
  name: string;
  monthlyAmount: number;
}

// ─── Form state ──────────────────────────────────────────────────────────────

export interface CustoEstiloVidaFormState extends Record<string, unknown> {
  expenses: RecurringExpense[];
  annualReturnPct: number;
  horizonYears: number;
}

/**
 * @returns A blank expense entry.
 */
export function createDefaultExpense(): RecurringExpense {
  return { name: "", monthlyAmount: 0 };
}

/**
 * @returns Default form state with two blank expenses.
 */
export function createDefaultCustoEstiloVidaFormState(): CustoEstiloVidaFormState {
  return {
    expenses: [createDefaultExpense(), createDefaultExpense()],
    annualReturnPct: 12,
    horizonYears: 10,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface CustoEstiloVidaValidationError {
  field: string;
  messageKey: string;
}

/**
 * @param form
 * @returns Validation errors, if any.
 */
export function validateCustoEstiloVidaForm(
  form: CustoEstiloVidaFormState,
): CustoEstiloVidaValidationError[] {
  const errors: CustoEstiloVidaValidationError[] = [];

  const hasValidExpense = form.expenses.some((e) => e.monthlyAmount > 0);
  if (!hasValidExpense) {
    errors.push({ field: "expenses", messageKey: "errors.atLeastOneExpenseRequired" });
  }

  if (form.horizonYears < 1) {
    errors.push({ field: "horizonYears", messageKey: "errors.horizonRequired" });
  }

  return errors;
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface ExpenseOpportunityCost {
  name: string;
  monthlyAmount: number;
  annualCost: number;
  opportunityCost: number;
}

export interface CustoEstiloVidaResult {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  totalOpportunityCost: number;
  expenses: ExpenseOpportunityCost[];
  horizonYears: number;
}

// ─── Calculation ─────────────────────────────────────────────────────────────

/**
 * @param monthlyPayment
 * @param monthlyRate
 * @param months
 * @returns Future value of the annuity.
 */
function futureValueOfAnnuity(monthlyPayment: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) { return monthlyPayment * months; }
  return monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

/**
 * @param form
 * @returns Opportunity cost result.
 */
export function calculateCustoEstiloVida(
  form: CustoEstiloVidaFormState,
): CustoEstiloVidaResult {
  const monthlyRate = Math.pow(1 + form.annualReturnPct / 100, 1 / 12) - 1;
  const totalMonths = form.horizonYears * 12;

  const validExpenses = form.expenses.filter((e) => e.monthlyAmount > 0);

  const expenses: ExpenseOpportunityCost[] = validExpenses.map((e) => {
    const annualCost = round2(e.monthlyAmount * 12);
    const opportunityCost = round2(futureValueOfAnnuity(e.monthlyAmount, monthlyRate, totalMonths));
    return {
      name: e.name || "Sem nome",
      monthlyAmount: round2(e.monthlyAmount),
      annualCost,
      opportunityCost,
    };
  });

  const totalMonthlyCost = round2(expenses.reduce((s, e) => s + e.monthlyAmount, 0));
  const totalAnnualCost = round2(totalMonthlyCost * 12);
  const totalOpportunityCost = round2(expenses.reduce((s, e) => s + e.opportunityCost, 0));

  return {
    totalMonthlyCost,
    totalAnnualCost,
    totalOpportunityCost,
    expenses,
    horizonYears: form.horizonYears,
  };
}

// ─── URL sharing ─────────────────────────────────────────────────────────────

/**
 * @param form
 * @returns Base64-encoded query string.
 */
export function encodeFormToQuery(form: CustoEstiloVidaFormState): string {
  const data = {
    e: form.expenses.filter((e) => e.monthlyAmount > 0).map((e) => ({
      n: e.name,
      v: e.monthlyAmount,
    })),
    r: form.annualReturnPct,
    h: form.horizonYears,
  };
  return btoa(JSON.stringify(data));
}

/**
 * @param encoded
 * @returns Decoded form state or null if invalid.
 */
export function decodeQueryToForm(encoded: string): Partial<CustoEstiloVidaFormState> | null {
  try {
    const data = JSON.parse(atob(encoded)) as {
      e?: { n: string; v: number }[];
      r?: number;
      h?: number;
    };
    if (!data.e || !Array.isArray(data.e)) { return null; }
    return {
      expenses: data.e.map((e) => ({ name: e.n, monthlyAmount: e.v })),
      annualReturnPct: data.r ?? 12,
      horizonYears: data.h ?? 10,
    };
  } catch {
    return null;
  }
}
