/**
 * Domain model for the Hora Extra CLT calculator.
 *
 * Computes gross overtime pay for the three standard CLT overtime rates
 * (50%, 75%, 100%) and estimates the INSS impact on the overtime amount.
 *
 * Regulatory basis:
 *   - Art. 59 CLT: overtime ≤ 2 h/day; rate ≥ 50%.
 *   - Art. 73 CLT: night-shift add-on ≥ 20% (not calculated here).
 *   - Collective agreements may stipulate 75% for Sundays/holidays.
 *
 * IRRF impact is intentionally excluded — use the INSS+IR tool for that,
 * as it depends on personal deductions (dependents, alimony, pension).
 */

import {
  BR_TAX_TABLE_YEAR,
  calcInss,
} from "./br-tax-tables";

export { BR_TAX_TABLE_YEAR };

/** Default CLT monthly hours divisor (8 h/day × 44 h/week ÷ 7 × 30). */
export const CLT_DEFAULT_HOURS_PER_MONTH = 220;

/** Overtime rate multipliers per CLT modality. */
export const OVERTIME_RATES = {
  fifty: 1.5,
  seventyFive: 1.75,
  oneHundred: 2.0,
} as const;

/** Public route for the Hora Extra calculator page. */
export const HORA_EXTRA_PUBLIC_PATH = "/tools/hora-extra";

// ─── Form state ───────────────────────────────────────────────────────────────

export interface HoraExtraFormState extends Record<string, unknown> {
  /** Monthly gross base salary in BRL. */
  grossSalary: number | null;
  /** Monthly working hours used to derive hourly rate (default: 220). */
  hoursPerMonth: number;
  /** Number of overtime hours at 50% (weekday extra hours). */
  hours50: number;
  /** Number of overtime hours at 75% (Sunday/holiday — collective agreement). */
  hours75: number;
  /** Number of overtime hours at 100% (holidays or collective agreement). */
  hours100: number;
}

/**
 * Returns the default initial form state for the Hora Extra calculator.
 *
 * @returns Default HoraExtraFormState.
 */
export function createDefaultHoraExtraFormState(): HoraExtraFormState {
  return {
    grossSalary: null,
    hoursPerMonth: CLT_DEFAULT_HOURS_PER_MONTH,
    hours50: 0,
    hours75: 0,
    hours100: 0,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface HoraExtraValidationError {
  field: keyof HoraExtraFormState;
  messageKey: string;
}

/**
 * Validates the form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateHoraExtraForm(
  form: HoraExtraFormState,
): HoraExtraValidationError[] {
  const errors: HoraExtraValidationError[] = [
    ...validateScalarFields(form),
    ...validateOvertimeHoursFields(form),
  ];
  return errors;
}

/**
 * Validates salary and hours-per-month scalar fields.
 *
 * @param form Current form state.
 * @returns Validation errors for scalar fields.
 */
function validateScalarFields(
  form: HoraExtraFormState,
): HoraExtraValidationError[] {
  const errors: HoraExtraValidationError[] = [];
  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }
  if (form.hoursPerMonth <= 0 || !Number.isFinite(form.hoursPerMonth)) {
    errors.push({ field: "hoursPerMonth", messageKey: "errors.hoursPerMonthInvalid" });
  }
  return errors;
}

/**
 * Validates the per-rate overtime hour fields.
 *
 * @param form Current form state.
 * @returns Validation errors for overtime hour fields.
 */
function validateOvertimeHoursFields(
  form: HoraExtraFormState,
): HoraExtraValidationError[] {
  const errors: HoraExtraValidationError[] = [];
  const hourFields = [
    { field: "hours50", value: form.hours50 },
    { field: "hours75", value: form.hours75 },
    { field: "hours100", value: form.hours100 },
  ] as const;

  for (const { field, value } of hourFields) {
    if (value < 0 || !Number.isFinite(value)) {
      errors.push({ field, messageKey: "errors.hoursNegative" });
    }
  }

  if (form.hours50 === 0 && form.hours75 === 0 && form.hours100 === 0) {
    errors.push({ field: "hours50", messageKey: "errors.noOvertimeHours" });
  }

  return errors;
}

// ─── Calculation result ───────────────────────────────────────────────────────

/** Breakdown for a single overtime rate modality. */
export interface OvertimeBreakdown {
  /** Hours entered by the user. */
  hours: number;
  /** Rate multiplier (e.g. 1.5 for 50%). */
  rateMultiplier: number;
  /** Overtime gross = hours × hourlyRate × rateMultiplier. */
  grossAmount: number;
}

export interface HoraExtraResult {
  /** Input gross salary used for the calculation. */
  grossSalary: number;
  /** Monthly hours divisor used. */
  hoursPerMonth: number;
  /** Hourly rate = grossSalary / hoursPerMonth. */
  hourlyRate: number;

  // ── Per-rate breakdowns ────────────────────────────────────────────────────
  overtime50: OvertimeBreakdown;
  overtime75: OvertimeBreakdown;
  overtime100: OvertimeBreakdown;

  // ── Totals ─────────────────────────────────────────────────────────────────
  /** Sum of all overtime hours. */
  totalOvertimeHours: number;
  /** Sum of all overtime gross amounts. */
  totalOvertimeGross: number;

  // ── INSS impact ────────────────────────────────────────────────────────────
  /** INSS deducted from base salary alone. */
  inssOnBase: number;
  /** INSS deducted from (base + overtime) combined. */
  inssOnCombined: number;
  /** Additional INSS due to overtime = inssOnCombined − inssOnBase. */
  inssOvertimeImpact: number;

  // ── Net overtime ───────────────────────────────────────────────────────────
  /**
   * Estimated net overtime = totalOvertimeGross − inssOvertimeImpact.
   * Does NOT include IRRF impact; use the INSS+IR tool for full deduction detail.
   */
  netOvertimeEstimate: number;

  /** Tax table year used for INSS calculation. */
  tableYear: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates overtime pay for all three CLT modalities.
 *
 * @param form Validated form state.
 * @returns Complete result with per-rate breakdowns and INSS impact.
 */
export function calculateHoraExtra(form: HoraExtraFormState): HoraExtraResult {
  const gross = form.grossSalary ?? 0;
  const hoursPerMonth = form.hoursPerMonth > 0 ? form.hoursPerMonth : CLT_DEFAULT_HOURS_PER_MONTH;

  const hourlyRate = round2(gross / hoursPerMonth);

  // ── Per-rate breakdowns ────────────────────────────────────────────────────
  const overtime50: OvertimeBreakdown = {
    hours: form.hours50,
    rateMultiplier: OVERTIME_RATES.fifty,
    grossAmount: round2(form.hours50 * hourlyRate * OVERTIME_RATES.fifty),
  };

  const overtime75: OvertimeBreakdown = {
    hours: form.hours75,
    rateMultiplier: OVERTIME_RATES.seventyFive,
    grossAmount: round2(form.hours75 * hourlyRate * OVERTIME_RATES.seventyFive),
  };

  const overtime100: OvertimeBreakdown = {
    hours: form.hours100,
    rateMultiplier: OVERTIME_RATES.oneHundred,
    grossAmount: round2(form.hours100 * hourlyRate * OVERTIME_RATES.oneHundred),
  };

  const totalOvertimeHours = round2(form.hours50 + form.hours75 + form.hours100);
  const totalOvertimeGross = round2(
    overtime50.grossAmount + overtime75.grossAmount + overtime100.grossAmount,
  );

  // ── INSS impact ────────────────────────────────────────────────────────────
  const inssOnBase = calcInss(gross);
  const inssOnCombined = calcInss(gross + totalOvertimeGross);
  const inssOvertimeImpact = round2(inssOnCombined - inssOnBase);

  // ── Net overtime estimate ──────────────────────────────────────────────────
  const netOvertimeEstimate = round2(totalOvertimeGross - inssOvertimeImpact);

  return {
    grossSalary: gross,
    hoursPerMonth,
    hourlyRate,
    overtime50,
    overtime75,
    overtime100,
    totalOvertimeHours,
    totalOvertimeGross,
    inssOnBase,
    inssOnCombined,
    inssOvertimeImpact,
    netOvertimeEstimate,
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
