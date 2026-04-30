/**
 * Domain model for the INSS + IR na Folha payroll calculator.
 *
 * Computes the exact INSS and IRRF deductions from a monthly gross salary,
 * showing progressive bracket breakdowns and all IR deductions applied.
 *
 * Regulatory: tables are reviewed annually in January (Portaria MPS/MF).
 * UI must display `BR_TAX_TABLE_YEAR` to inform users of the reference year.
 */

import {
  BR_TAX_TABLE_YEAR,
  IRRF_PER_DEPENDENT_DEDUCTION,
  calcInss,
  calcIrrf,
  calcInssBracketBreakdown,
  calcIrrfBracketBreakdown,
  type InssBracketBreakdown,
  type IrrfBracketBreakdown,
} from "./br-tax-tables";

export { BR_TAX_TABLE_YEAR };

/** Public route for the INSS + IR payroll calculator page. */
export const INSS_IR_FOLHA_PUBLIC_PATH = "/tools/inss-ir-folha";

/**
 * Maximum fraction of gross salary that is deductible for PGBL private pension.
 * Source: RFB — 12% of total annual gross income (applied monthly here).
 */
export const PRIVATE_PENSION_DEDUCTION_LIMIT = 0.12;

// ─── Form state ───────────────────────────────────────────────────────────────

export interface InssIrFormState extends Record<string, unknown> {
  /** Monthly gross salary in BRL. */
  grossSalary: number | null;
  /** Number of declared IRRF dependents. */
  dependents: number;
  /** Monthly court-ordered or formal alimony payment in BRL (fully deductible for IR). */
  alimentPension: number;
  /** Monthly PGBL private pension contribution in BRL (deductible up to 12% of gross). */
  privatePension: number;
}

/**
 * Returns the default initial form state for the INSS + IR calculator.
 *
 * @returns Default InssIrFormState.
 */
export function createDefaultInssIrFormState(): InssIrFormState {
  return {
    grossSalary: null,
    dependents: 0,
    alimentPension: 0,
    privatePension: 0,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface InssIrValidationError {
  field: keyof InssIrFormState;
  messageKey: string;
}

/**
 * Validates the form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateInssIrForm(form: InssIrFormState): InssIrValidationError[] {
  const errors: InssIrValidationError[] = [];

  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }

  if (form.dependents < 0 || !Number.isInteger(form.dependents)) {
    errors.push({ field: "dependents", messageKey: "errors.dependentsInvalid" });
  }

  if (form.alimentPension < 0) {
    errors.push({ field: "alimentPension", messageKey: "errors.alimentPensionNegative" });
  }

  if (form.privatePension < 0) {
    errors.push({ field: "privatePension", messageKey: "errors.privatePensionNegative" });
  }

  return errors;
}

// ─── Calculation result ───────────────────────────────────────────────────────

export interface InssIrResult {
  /** Input gross salary used for the calculation. */
  grossSalary: number;

  // ── INSS ────────────────────────────────────────────────────────────────────
  /** Per-bracket INSS contribution breakdown. */
  inssBrackets: InssBracketBreakdown[];
  /** Total INSS deducted from gross salary. */
  totalInss: number;

  // ── IR deductions ────────────────────────────────────────────────────────────
  /** Private pension deduction applied (capped at 12% of gross). */
  privatePensionDeduction: number;
  /** Full alimony deduction applied. */
  alimentPensionDeduction: number;
  /** Total deduction from declared dependents (dependents × R$ 189,59). */
  dependentsDeduction: number;
  /** Sum of all IR-specific deductions (privatePension + alimony + dependents). */
  totalIrDeductions: number;
  /** Taxable base for IRRF = grossSalary − INSS − totalIrDeductions. */
  irBase: number;

  // ── IRRF ────────────────────────────────────────────────────────────────────
  /** Full IRRF bracket table annotated with applicability. */
  irrfBrackets: IrrfBracketBreakdown[];
  /** Total IRRF deducted. */
  totalIrrf: number;

  // ── Net ─────────────────────────────────────────────────────────────────────
  /** Net salary = grossSalary − INSS − IRRF. */
  netSalary: number;
  /** Combined effective rate = (INSS + IRRF) / grossSalary × 100. */
  effectiveRate: number;

  /** Tax table year used for this calculation. */
  tableYear: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates INSS and IRRF deductions from a monthly gross salary.
 *
 * Deduction order for IR base:
 *   irBase = grossSalary − INSS − privatePensionDeduction − alimentPension − dependentsDeduction
 *
 * Private pension is capped at `PRIVATE_PENSION_DEDUCTION_LIMIT` (12%) of gross.
 *
 * @param form Validated form state.
 * @returns Complete calculation result with bracket breakdowns.
 */
export function calculateInssIr(form: InssIrFormState): InssIrResult {
  const gross = form.grossSalary ?? 0;

  // ── INSS ──────────────────────────────────────────────────────────────────
  const inssBrackets = calcInssBracketBreakdown(gross);
  const totalInss = calcInss(gross);

  // ── IR deductions ─────────────────────────────────────────────────────────
  const privatePensionDeduction = round2(
    Math.min(form.privatePension, gross * PRIVATE_PENSION_DEDUCTION_LIMIT),
  );
  const alimentPensionDeduction = round2(form.alimentPension);
  const dependentsDeduction = round2(form.dependents * IRRF_PER_DEPENDENT_DEDUCTION);
  const totalIrDeductions = round2(
    privatePensionDeduction + alimentPensionDeduction + dependentsDeduction,
  );

  // ── IRRF ──────────────────────────────────────────────────────────────────
  const irBase = round2(Math.max(0, gross - totalInss - totalIrDeductions));
  const irrfBrackets = calcIrrfBracketBreakdown(irBase);
  const totalIrrf = calcIrrf(irBase);

  // ── Net ───────────────────────────────────────────────────────────────────
  const netSalary = round2(gross - totalInss - totalIrrf);
  const effectiveRate = gross > 0
    ? round2(((totalInss + totalIrrf) / gross) * 100)
    : 0;

  return {
    grossSalary: gross,
    inssBrackets,
    totalInss,
    privatePensionDeduction,
    alimentPensionDeduction,
    dependentsDeduction,
    totalIrDeductions,
    irBase,
    irrfBrackets,
    totalIrrf,
    netSalary,
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
