/**
 * Domain model for the Rescisão Contratual CLT calculator.
 *
 * Calculates the gross and net severance pay for CLT-regulated employment
 * terminations, including:
 *   - Saldo de salário proporcional (prorated final month salary)
 *   - Aviso prévio indenizado (paid notice period — exempt from INSS)
 *   - 13º salário proporcional (prorated 13th salary)
 *   - Férias proporcionais + 1/3 constitucional (accrued vacation)
 *   - Férias vencidas + 1/3 (expired vacation if any)
 *   - Multa do FGTS (40% sem justa causa, 20% acordo)
 *   - INSS and IRRF deductions
 *
 * Regulatory basis:
 *   - CLT arts. 477–480 (termination, notice period, rights)
 *   - Lei 12.506/2011 (progressive notice period formula)
 *   - Lei 13.467/2017 art. 484-A (mutual agreement — "distrato" with 20% FGTS multa)
 *   - STJ RE / precedents: aviso prévio indenizado exempt from INSS (Lei 9.528/97)
 *   - Tables: Portaria MPS/MF nº 3 — Jan 2025
 *
 * Note: for termination types with cause (com_justa_causa), the employee loses
 * férias proporcionais, 13th salary, aviso prévio, and FGTS multa rights per CLT.
 */

import {
  BR_TAX_TABLE_YEAR,
  IRRF_PER_DEPENDENT_DEDUCTION,
  calcInss,
  calcIrrf,
} from "./br-tax-tables";

export { BR_TAX_TABLE_YEAR };

/** Public route for the Rescisão CLT calculator page. */
export const RESCISAO_PUBLIC_PATH = "/tools/rescisao";

/** Base days for aviso prévio (Lei 12.506/2011). */
export const AVISO_PREVIO_BASE_DAYS = 30;

/** Extra days per full year of service (Lei 12.506/2011). */
export const AVISO_PREVIO_EXTRA_DAYS_PER_YEAR = 3;

/** Maximum aviso prévio days (Lei 12.506/2011). */
export const AVISO_PREVIO_MAX_DAYS = 90;

/** FGTS multa rate for termination without just cause (CLT art. 18 § 1º). */
export const FGTS_MULTA_RATE_SEM_JUSTA_CAUSA = 0.4;

/** FGTS multa rate for mutual agreement termination (Lei 13.467/2017). */
export const FGTS_MULTA_RATE_ACORDO = 0.2;

// ─── Termination types ────────────────────────────────────────────────────────

/**
 * CLT termination type.
 *
 * - `sem_justa_causa`: employer-initiated dismissal without cause (full rights + 40% FGTS)
 * - `com_justa_causa`: employer-initiated dismissal for cause (loses proportional rights)
 * - `pedido_de_demissao`: employee-initiated resignation (no aviso from employer, no FGTS)
 * - `acordo`: mutual agreement (distrato — 20% FGTS, since Lei 13.467/2017)
 */
export type TerminationType =
  | "sem_justa_causa"
  | "com_justa_causa"
  | "pedido_de_demissao"
  | "acordo";

export const TERMINATION_TYPES: readonly TerminationType[] = [
  "sem_justa_causa",
  "com_justa_causa",
  "pedido_de_demissao",
  "acordo",
] as const;

// ─── Form state ───────────────────────────────────────────────────────────────

export interface RescisaoFormState extends Record<string, unknown> {
  /** Monthly gross base salary in BRL. */
  grossSalary: number | null;
  /** Type of employment termination. */
  terminationType: TerminationType;
  /** Full years of service for aviso prévio calculation (Lei 12.506/2011). */
  yearsOfService: number;
  /** Days worked in the final (partial) month, for saldo de salário. */
  daysWorkedInLastMonth: number;
  /** Months worked in the current calendar year (1–12), for 13th salary. */
  monthsFor13: number;
  /**
   * Months since the last vacation acquisition anniversary (0–11).
   * Zero means less than one full month has elapsed since the anniversary.
   */
  monthsForVacation: number;
  /** Whether the employee has an unused full vacation period (férias vencidas). */
  hasExpiredVacation: boolean;
  /** Monthly average of overtime/commissions to include in the calculation base. */
  overtimeAverage: number;
  /** Number of declared IRRF dependents. */
  dependents: number;
  /** Current FGTS account balance, used to compute the multa. */
  fgtsBalance: number;
}

/**
 * Returns the default initial form state for the Rescisão calculator.
 *
 * @returns Default RescisaoFormState.
 */
export function createDefaultRescisaoFormState(): RescisaoFormState {
  return {
    grossSalary: null,
    terminationType: "sem_justa_causa",
    yearsOfService: 1,
    daysWorkedInLastMonth: 30,
    monthsFor13: 1,
    monthsForVacation: 0,
    hasExpiredVacation: false,
    overtimeAverage: 0,
    dependents: 0,
    fgtsBalance: 0,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface RescisaoValidationError {
  field: keyof RescisaoFormState;
  messageKey: string;
}

/**
 * Validates the form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateRescisaoForm(
  form: RescisaoFormState,
): RescisaoValidationError[] {
  return [
    ...validateSalaryAndService(form),
    ...validateDaysAndMonths(form),
    ...validateOptionalAmounts(form),
  ];
}

/**
 * Validates gross salary and years-of-service fields.
 *
 * @param form Current form state.
 * @returns Validation errors for these fields.
 */
function validateSalaryAndService(
  form: RescisaoFormState,
): RescisaoValidationError[] {
  const errors: RescisaoValidationError[] = [];
  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }
  if (!Number.isInteger(form.yearsOfService) || form.yearsOfService < 0) {
    errors.push({ field: "yearsOfService", messageKey: "errors.yearsOfServiceInvalid" });
  }
  if (!Number.isInteger(form.dependents) || form.dependents < 0) {
    errors.push({ field: "dependents", messageKey: "errors.dependentsInvalid" });
  }
  return errors;
}

/**
 * Validates day and month count fields.
 *
 * @param form Current form state.
 * @returns Validation errors for days/months fields.
 */
function validateDaysAndMonths(
  form: RescisaoFormState,
): RescisaoValidationError[] {
  const errors: RescisaoValidationError[] = [];
  if (
    !Number.isInteger(form.daysWorkedInLastMonth) ||
    form.daysWorkedInLastMonth < 1 ||
    form.daysWorkedInLastMonth > 31
  ) {
    errors.push({
      field: "daysWorkedInLastMonth",
      messageKey: "errors.daysWorkedInLastMonthInvalid",
    });
  }
  if (
    !Number.isInteger(form.monthsFor13) ||
    form.monthsFor13 < 1 ||
    form.monthsFor13 > 12
  ) {
    errors.push({ field: "monthsFor13", messageKey: "errors.monthsFor13Invalid" });
  }
  if (
    !Number.isInteger(form.monthsForVacation) ||
    form.monthsForVacation < 0 ||
    form.monthsForVacation > 11
  ) {
    errors.push({
      field: "monthsForVacation",
      messageKey: "errors.monthsForVacationInvalid",
    });
  }
  return errors;
}

/**
 * Validates optional amount fields (overtime average and FGTS balance).
 *
 * @param form Current form state.
 * @returns Validation errors for amount fields.
 */
function validateOptionalAmounts(
  form: RescisaoFormState,
): RescisaoValidationError[] {
  const errors: RescisaoValidationError[] = [];
  if (form.overtimeAverage < 0) {
    errors.push({ field: "overtimeAverage", messageKey: "errors.overtimeAverageNegative" });
  }
  if (form.fgtsBalance < 0) {
    errors.push({ field: "fgtsBalance", messageKey: "errors.fgtsBalanceNegative" });
  }
  return errors;
}

// ─── Calculation result ───────────────────────────────────────────────────────

export interface RescisaoResult {
  /** Input gross salary. */
  grossSalary: number;
  /** Termination type used for calculation. */
  terminationType: TerminationType;
  /** Computed aviso prévio days (capped at 90). */
  noticeDays: number;

  // ── Components ───────────────────────────────────────────────────────────────
  /** Prorated final month salary = dailyRate × daysWorkedInLastMonth. */
  saldoSalario: number;
  /** Paid notice period = dailyRate × noticeDays. Zero when not applicable. */
  avisoPrevio: number;
  /** Prorated 13th salary for months worked in current year. Zero when not applicable. */
  decimoTerceiroProporcional: number;
  /** Proportional vacation base pay (without the 1/3 bonus). */
  feriasProporcionaisBase: number;
  /** 1/3 constitutional on férias proporcionais. */
  feriasProporcionaisThird: number;
  /** Total proportional vacation pay = base + 1/3. */
  feriasProporcionais: number;
  /** Expired vacation base pay (30 days). Zero if no expired vacation. */
  feriasVencidasBase: number;
  /** 1/3 constitutional on férias vencidas. */
  feriasVencidasThird: number;
  /** Total expired vacation pay = base + 1/3. */
  feriasVencidas: number;
  /** FGTS penalty (40% or 20% of balance). Zero when not applicable. */
  fgtsMulta: number;

  // ── Subtotals ────────────────────────────────────────────────────────────────
  /** Sum of all gross components including FGTS multa. */
  totalGross: number;

  // ── Deductions ───────────────────────────────────────────────────────────────
  /**
   * INSS base: saldo + decimoTerceiro + feriasProporcionaisBase + feriasVencidasBase.
   * Aviso prévio indenizado and FGTS multa are excluded (non-INSS basis).
   */
  inssBase: number;
  /** INSS contribution on inssBase. */
  inss: number;
  /** IRRF dependent deduction applied. */
  dependentsDeduction: number;
  /**
   * IRRF taxable base = (saldo + aviso + 13th + férias) − INSS − dependents.
   * FGTS multa is excluded from IRRF.
   */
  irrfBase: number;
  /** IRRF on irrfBase. */
  irrf: number;

  // ── Net ──────────────────────────────────────────────────────────────────────
  /** Net total = totalGross − INSS − IRRF. */
  netTotal: number;
  /** Tax table year used for calculations. */
  tableYear: number;
}

// ─── Férias components helper ─────────────────────────────────────────────────

interface FeriasComponents {
  proporcionaisBase: number;
  proporcionaisThird: number;
  proporcionais: number;
  vencidasBase: number;
  vencidasThird: number;
  vencidas: number;
}

interface FeriasComponentsInput {
  type: TerminationType;
  base: number;
  months: number;
  hasExpired: boolean;
  dailyRate: number;
}

/**
 * Computes all férias-related components in a single pass.
 *
 * @param input Férias calculation inputs.
 * @returns All férias proportional and expired components.
 */
function computeFeriasComponents(input: FeriasComponentsInput): FeriasComponents {
  const proporcionaisBase = calcFeriasProporcionaisBase(input.type, input.base, input.months);
  const proporcionaisThird = round2(proporcionaisBase / 3);
  const vencidasBase = input.hasExpired ? round2(input.dailyRate * 30) : 0;
  const vencidasThird = round2(vencidasBase / 3);
  return {
    proporcionaisBase,
    proporcionaisThird,
    proporcionais: round2(proporcionaisBase + proporcionaisThird),
    vencidasBase,
    vencidasThird,
    vencidas: round2(vencidasBase + vencidasThird),
  };
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates the full rescisão contratual CLT breakdown.
 *
 * @param form Validated form state.
 * @returns Complete result with per-component breakdown and net total.
 */
export function calculateRescisao(form: RescisaoFormState): RescisaoResult {
  const gross = form.grossSalary ?? 0;
  const base = round2(gross + form.overtimeAverage);
  const dailyRate = round2(base / 30);

  const saldoSalario = calcSaldoSalario(dailyRate, form.daysWorkedInLastMonth);
  const noticeDays = calcNoticeDays(form.yearsOfService);
  const avisoPrevio = calcAvisoPrevio(form.terminationType, dailyRate, noticeDays);
  const decimoTerceiroProporcional = calcDecimoTerceiro(form.terminationType, base, form.monthsFor13);
  const ferias = computeFeriasComponents({
    type: form.terminationType,
    base,
    months: form.monthsForVacation,
    hasExpired: form.hasExpiredVacation,
    dailyRate,
  });
  const fgtsMulta = calcFgtsMulta(form.terminationType, form.fgtsBalance);
  const totalGross = round2(
    saldoSalario + avisoPrevio + decimoTerceiroProporcional +
    ferias.proporcionais + ferias.vencidas + fgtsMulta,
  );
  // INSS: on saldo + 13th + férias base (not on aviso indenizado, not on multa, not on 1/3)
  const inssBase = round2(
    saldoSalario + decimoTerceiroProporcional + ferias.proporcionaisBase + ferias.vencidasBase,
  );
  const inss = calcInss(inssBase);
  // IRRF: on all taxable components (aviso IS taxable for IRRF, FGTS multa is not)
  const irrfGross = round2(
    saldoSalario + avisoPrevio + decimoTerceiroProporcional + ferias.proporcionais + ferias.vencidas,
  );
  const dependentsDeduction = round2(form.dependents * IRRF_PER_DEPENDENT_DEDUCTION);
  const irrfBase = round2(Math.max(0, irrfGross - inss - dependentsDeduction));
  const irrf = calcIrrf(irrfBase);
  const netTotal = round2(totalGross - inss - irrf);

  return {
    grossSalary: gross,
    terminationType: form.terminationType,
    noticeDays,
    saldoSalario,
    avisoPrevio,
    decimoTerceiroProporcional,
    feriasProporcionaisBase: ferias.proporcionaisBase,
    feriasProporcionaisThird: ferias.proporcionaisThird,
    feriasProporcionais: ferias.proporcionais,
    feriasVencidasBase: ferias.vencidasBase,
    feriasVencidasThird: ferias.vencidasThird,
    feriasVencidas: ferias.vencidas,
    fgtsMulta,
    totalGross,
    inssBase,
    inss,
    dependentsDeduction,
    irrfBase,
    irrf,
    netTotal,
    tableYear: BR_TAX_TABLE_YEAR,
  };
}

// ─── Private calculation helpers ─────────────────────────────────────────────

/**
 * Calculates the prorated final month salary.
 *
 * @param dailyRate Daily salary rate.
 * @param days Days worked in the last month.
 * @returns Saldo de salário.
 */
function calcSaldoSalario(dailyRate: number, days: number): number {
  return round2(dailyRate * days);
}

/**
 * Calculates the aviso prévio days (Lei 12.506/2011).
 *
 * @param yearsOfService Full years of service.
 * @returns Notice period in days, capped at 90.
 */
function calcNoticeDays(yearsOfService: number): number {
  return Math.min(
    AVISO_PREVIO_MAX_DAYS,
    AVISO_PREVIO_BASE_DAYS + AVISO_PREVIO_EXTRA_DAYS_PER_YEAR * yearsOfService,
  );
}

/**
 * Calculates the aviso prévio indenizado amount.
 * Only applicable for sem_justa_causa and acordo terminations.
 *
 * @param type Termination type.
 * @param dailyRate Daily salary rate.
 * @param noticeDays Aviso prévio days.
 * @returns Aviso prévio amount.
 */
function calcAvisoPrevio(
  type: TerminationType,
  dailyRate: number,
  noticeDays: number,
): number {
  if (type !== "sem_justa_causa" && type !== "acordo") { return 0; }
  return round2(dailyRate * noticeDays);
}

/**
 * Calculates the proportional 13th salary.
 * Not applicable for com_justa_causa terminations.
 *
 * @param type Termination type.
 * @param base Monthly base salary including overtime average.
 * @param months Months worked in the current year (1–12).
 * @returns Proportional 13th salary amount.
 */
function calcDecimoTerceiro(
  type: TerminationType,
  base: number,
  months: number,
): number {
  if (type === "com_justa_causa") { return 0; }
  return round2((base * Math.min(months, 12)) / 12);
}

/**
 * Calculates the proportional vacation base pay (without 1/3).
 * Not applicable for com_justa_causa terminations.
 *
 * @param type Termination type.
 * @param base Monthly base salary including overtime average.
 * @param months Months since last vacation anniversary (0–11).
 * @returns Proportional vacation base pay.
 */
function calcFeriasProporcionaisBase(
  type: TerminationType,
  base: number,
  months: number,
): number {
  if (type === "com_justa_causa" || months === 0) { return 0; }
  return round2((base * Math.min(months, 11)) / 12);
}

/**
 * Returns the FGTS multa rate for the given termination type.
 *
 * @param type Termination type.
 * @returns Multa rate (0, 0.2, or 0.4).
 */
function getFgtsMultaRate(type: TerminationType): number {
  if (type === "sem_justa_causa") { return FGTS_MULTA_RATE_SEM_JUSTA_CAUSA; }
  if (type === "acordo") { return FGTS_MULTA_RATE_ACORDO; }
  return 0;
}

/**
 * Calculates the FGTS multa based on termination type.
 *
 * @param type Termination type.
 * @param fgtsBalance Current FGTS balance.
 * @returns FGTS multa amount.
 */
function calcFgtsMulta(type: TerminationType, fgtsBalance: number): number {
  return round2(fgtsBalance * getFgtsMultaRate(type));
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
