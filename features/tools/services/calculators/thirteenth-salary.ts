import {
  BR_TAX_TABLE_YEAR,
  calcInss,
  calcIrrfFromGross,
} from "./br-tax-tables";

export { BR_TAX_TABLE_YEAR };

/** Public route for the 13th salary calculator page. */
export const THIRTEENTH_SALARY_PUBLIC_PATH = "/tools/thirteenth-salary";

// ─── Form state ───────────────────────────────────────────────────────────────

export interface ThirteenthSalaryFormState extends Record<string, unknown> {
  /** Monthly gross salary in BRL. */
  grossSalary: number | null;
  /** Number of months worked in the reference year (1–12). */
  monthsWorked: number;
  /** Average monthly variable pay (overtime bonuses, etc.) in BRL. */
  variablePay: number;
  /** Advance already received (e.g., paid during vacation) in BRL. */
  advancePaid: number;
  /** Number of declared dependents for IRRF deduction. */
  dependents: number;
}

/**
 * Returns the default initial form state for the 13th salary calculator.
 *
 * @returns Default ThirteenthSalaryFormState.
 */
export function createDefaultThirteenthSalaryFormState(): ThirteenthSalaryFormState {
  return {
    grossSalary: null,
    monthsWorked: 12,
    variablePay: 0,
    advancePaid: 0,
    dependents: 0,
  };
}

// ─── Calculation result ───────────────────────────────────────────────────────

export interface ThirteenthSalaryInstallment {
  /** Gross amount of this installment. */
  gross: number;
  /** INSS deducted (only on 2nd installment). */
  inss: number;
  /** IRRF deducted (only on 2nd installment). */
  irrf: number;
  /** Net amount after deductions. */
  net: number;
}

export interface ThirteenthSalaryResult {
  /** Full gross 13th salary (before any deductions). */
  totalGross: number;
  /** Total INSS over the 13th salary. */
  totalInss: number;
  /** Total IRRF over the 13th salary. */
  totalIrrf: number;
  /** Net amount the employee will actually receive. */
  totalNet: number;
  /** Breakdown of the 1st installment (paid by November 30). */
  firstInstallment: ThirteenthSalaryInstallment;
  /** Breakdown of the 2nd installment (paid by December 20). */
  secondInstallment: ThirteenthSalaryInstallment;
  /** Tax table year used for this calculation. */
  tableYear: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ThirteenthSalaryValidationError {
  field: keyof ThirteenthSalaryFormState;
  messageKey: string;
}

/**
 * Validates the form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty means valid.
 */
export function validateThirteenthSalaryForm(
  form: ThirteenthSalaryFormState,
): ThirteenthSalaryValidationError[] {
  const errors: ThirteenthSalaryValidationError[] = [];

  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }

  if (form.monthsWorked < 1 || form.monthsWorked > 12) {
    errors.push({ field: "monthsWorked", messageKey: "errors.monthsWorkedRange" });
  }

  return errors;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates the 13th salary, INSS, IRRF and installment breakdown.
 *
 * Rules:
 * - 13th gross = (grossSalary + variablePay) × monthsWorked / 12 − advancePaid
 * - 1st installment = 50% of 13th gross; no INSS, no IRRF
 * - 2nd installment = remaining 50%; INSS and IRRF apply to the FULL 13th base
 * - INSS and IRRF are calculated on the full annual 13th base (not per installment)
 *
 * @param form Validated form state.
 * @returns Full calculation result.
 */
export function calculateThirteenthSalary(
  form: ThirteenthSalaryFormState,
): ThirteenthSalaryResult {
  const baseSalary = (form.grossSalary ?? 0) + form.variablePay;
  const proportionalBase = round2((baseSalary * form.monthsWorked) / 12);
  const totalGross = round2(Math.max(0, proportionalBase - form.advancePaid));

  const totalInss = calcInss(totalGross);
  const totalIrrf = calcIrrfFromGross(totalGross, totalInss, form.dependents);

  const firstGross = round2(totalGross / 2);
  const secondGross = round2(totalGross - firstGross);
  const totalNet = round2(totalGross - totalInss - totalIrrf);

  const firstInstallment: ThirteenthSalaryInstallment = {
    gross: firstGross,
    inss: 0,
    irrf: 0,
    net: firstGross,
  };

  const secondInstallment: ThirteenthSalaryInstallment = {
    gross: secondGross,
    inss: totalInss,
    irrf: totalIrrf,
    net: round2(secondGross - totalInss - totalIrrf),
  };

  return {
    totalGross,
    totalInss,
    totalIrrf,
    totalNet,
    firstInstallment,
    secondInstallment,
    tableYear: BR_TAX_TABLE_YEAR,
  };
}

/**
 * Rounds a number to 2 decimal places (currency precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
