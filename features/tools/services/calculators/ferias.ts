/**
 * Domain model for the Simulador de Férias CLT calculator.
 *
 * Calculates the gross and net values of CLT vacation pay, including:
 *   - proportional vacation pay (férias) for the chosen rest period
 *   - mandatory 1/3 constitutional bonus (terço constitucional)
 *   - optional cash conversion of up to 10 days (abono pecuniário)
 *   - INSS and IRRF deductions
 *
 * Regulatory basis:
 *   - CLT arts. 129–153 (vacation entitlement, periods, proportionality)
 *   - CF/88 art. 7º, XVII (1/3 constitutional)
 *   - STF RE 593.068 (abono pecuniário is INSS-exempt)
 *   - Tables: Portaria MPS/MF nº 3 — Jan 2025
 *
 * "Melhor mês" recommendation is intentionally simplified: the optimal
 * month depends on projected annual income. The tool advises avoiding
 * months that also include 13th-salary payments (Nov/Dec) to reduce
 * the IRRF base in that month.
 */

import {
  BR_TAX_TABLE_YEAR,
  IRRF_PER_DEPENDENT_DEDUCTION,
  calcInss,
  calcIrrf,
} from "./br-tax-tables";

export { BR_TAX_TABLE_YEAR };

/** Public route for the Férias CLT calculator page. */
export const FERIAS_PUBLIC_PATH = "/tools/ferias";

/**
 * Valid options for the number of vacation rest days (CLT art. 134).
 * Minimum period is 10 days; 20 days minimum when abono is sold.
 */
export const VACATION_DAYS_OPTIONS = [30, 20, 15, 10] as const;
export type VacationDaysOption = (typeof VACATION_DAYS_OPTIONS)[number];

/**
 * Fixed number of abono days allowed when cash conversion is requested.
 * CLT allows selling up to 1/3 of the 30-day entitlement = 10 days.
 */
export const ABONO_DAYS = 10;

/**
 * Minimum rest days required when converting vacation days to abono.
 * (CLT art. 143 — remaining vacation must be at least 20 days.)
 */
export const MIN_REST_DAYS_WITH_ABONO = 20;

// ─── Form state ───────────────────────────────────────────────────────────────

export interface FeriasFormState extends Record<string, unknown> {
  /** Monthly gross base salary in BRL. */
  grossSalary: number | null;
  /** Number of vacation rest days to take: 10, 15, 20, or 30. */
  vacationDays: VacationDaysOption;
  /**
   * Whether to sell 10 days as abono pecuniário (cash conversion).
   * Only valid when vacationDays is 20 or 30 (minimum 20 rest days required).
   */
  abonoEnabled: boolean;
  /**
   * Monthly average of overtime/commissions to include in the vacation base.
   * (CLT art. 142 — habitual payments must be included.)
   */
  overtimeAverage: number;
  /** Number of declared IRRF dependents. */
  dependents: number;
}

/**
 * Returns the default initial form state for the Férias calculator.
 *
 * @returns Default FeriasFormState.
 */
export function createDefaultFeriasFormState(): FeriasFormState {
  return {
    grossSalary: null,
    vacationDays: 30,
    abonoEnabled: false,
    overtimeAverage: 0,
    dependents: 0,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface FeriasValidationError {
  field: keyof FeriasFormState;
  messageKey: string;
}

/**
 * Validates the form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateFeriasForm(form: FeriasFormState): FeriasValidationError[] {
  return [
    ...validateBaseFields(form),
    ...validateAbonoConstraint(form),
  ];
}

/**
 * Validates salary and optional numeric fields.
 *
 * @param form Current form state.
 * @returns Validation errors for base fields.
 */
function validateBaseFields(form: FeriasFormState): FeriasValidationError[] {
  const errors: FeriasValidationError[] = [];
  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }
  if (form.overtimeAverage < 0) {
    errors.push({ field: "overtimeAverage", messageKey: "errors.overtimeAverageNegative" });
  }
  if (form.dependents < 0 || !Number.isInteger(form.dependents)) {
    errors.push({ field: "dependents", messageKey: "errors.dependentsInvalid" });
  }
  return errors;
}

/**
 * Validates that abono is only selected when the rest period allows it.
 *
 * @param form Current form state.
 * @returns Validation errors for the abono constraint.
 */
function validateAbonoConstraint(form: FeriasFormState): FeriasValidationError[] {
  if (form.abonoEnabled && form.vacationDays < MIN_REST_DAYS_WITH_ABONO) {
    return [{
      field: "abonoEnabled",
      messageKey: "errors.abonoRequiresMinRestDays",
    }];
  }
  return [];
}

// ─── Calculation result ───────────────────────────────────────────────────────

export interface FeriasResult {
  /** Input gross salary used for the calculation. */
  grossSalary: number;
  /** Number of vacation rest days taken. */
  vacationDays: number;
  /** Whether 10 days were sold as abono pecuniário. */
  abonoEnabled: boolean;
  /** Daily salary rate used as the basis for all calculations. */
  dailyRate: number;

  // ── Vacation pay ──────────────────────────────────────────────────────────────
  /** Proportional vacation pay = dailyRate × vacationDays. */
  vacationBasePay: number;
  /** 1/3 constitutional = vacationBasePay / 3. */
  constitutionalThird: number;
  /** Total vacation gross = vacationBasePay + constitutionalThird. */
  vacationGross: number;

  // ── Abono ─────────────────────────────────────────────────────────────────────
  /** Cash value of the abono (10 days × daily rate). Zero when not requested. */
  abonoValue: number;

  // ── Combined gross ────────────────────────────────────────────────────────────
  /** Total gross = vacationGross + abonoValue. */
  totalGross: number;

  // ── Deductions ────────────────────────────────────────────────────────────────
  /** INSS on vacation gross (abono is INSS-exempt). */
  inss: number;
  /** Dependent deduction applied to IRRF base. */
  dependentsDeduction: number;
  /** Taxable base for IRRF = totalGross − INSS − dependentsDeduction. */
  irBase: number;
  /** IRRF on the taxable base. */
  irrf: number;

  // ── Net ───────────────────────────────────────────────────────────────────────
  /** Net total = totalGross − INSS − IRRF. */
  netTotal: number;
  /** Effective deduction rate = (INSS + IRRF) / totalGross × 100. */
  effectiveRate: number;

  /** Tax table year used for INSS / IRRF calculation. */
  tableYear: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates the full vacation pay breakdown.
 *
 * @param form Validated form state.
 * @returns Complete result with per-component breakdown and net total.
 */
export function calculateFerias(form: FeriasFormState): FeriasResult {
  const gross = form.grossSalary ?? 0;
  const base = round2(gross + form.overtimeAverage);
  const dailyRate = round2(base / 30);

  // ── Vacation pay ─────────────────────────────────────────────────────────────
  const vacationBasePay = round2(dailyRate * form.vacationDays);
  const constitutionalThird = round2(vacationBasePay / 3);
  const vacationGross = round2(vacationBasePay + constitutionalThird);

  // ── Abono (INSS-exempt) ──────────────────────────────────────────────────────
  const abonoValue = form.abonoEnabled ? round2(dailyRate * ABONO_DAYS) : 0;

  // ── Combined gross ───────────────────────────────────────────────────────────
  const totalGross = round2(vacationGross + abonoValue);

  // ── INSS on vacation gross only ──────────────────────────────────────────────
  const inss = calcInss(vacationGross);

  // ── IRRF ────────────────────────────────────────────────────────────────────
  const dependentsDeduction = round2(form.dependents * IRRF_PER_DEPENDENT_DEDUCTION);
  const irBase = round2(Math.max(0, totalGross - inss - dependentsDeduction));
  const irrf = calcIrrf(irBase);

  // ── Net ──────────────────────────────────────────────────────────────────────
  const netTotal = round2(totalGross - inss - irrf);
  const effectiveRate = totalGross > 0
    ? round2(((inss + irrf) / totalGross) * 100)
    : 0;

  return {
    grossSalary: gross,
    vacationDays: form.vacationDays,
    abonoEnabled: form.abonoEnabled,
    dailyRate,
    vacationBasePay,
    constitutionalThird,
    vacationGross,
    abonoValue,
    totalGross,
    inss,
    dependentsDeduction,
    irBase,
    irrf,
    netTotal,
    effectiveRate,
    tableYear: BR_TAX_TABLE_YEAR,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Rounds a number to 2 decimal places (currency precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
