/**
 * Domain model for the Financiamento Imobiliário calculator.
 *
 * Computes SAC (Sistema de Amortização Constante) and PRICE (Tabela Price)
 * amortization schedules side-by-side, and provides an estimated CET.
 *
 * Regulatory note:
 *   O CET real pode variar conforme a instituição financeira.
 *   Consulte a tabela de CET antes de contratar.
 */

/** Reference year used for calculations. */
export const FINANCIAMENTO_TABLE_YEAR = 2025;

/** Maximum number of months allowed in a mortgage schedule. */
const MAX_TERM_MONTHS = 360;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Amortization system selector. */
export type AmortizationSystem = "sac" | "price";

/**
 * A single row in the amortization schedule.
 */
export interface FinanciamentoAmortizacaoRow {
  /** Month number (1-based). */
  month: number;
  /** Total payment for the month (amortization + interest + insurance + admin fee). */
  payment: number;
  /** Principal amortized in the month. */
  amortization: number;
  /** Interest charged in the month. */
  interest: number;
  /** Outstanding balance after the month's payment. */
  balance: number;
}

/**
 * Aggregated result for a single amortization system.
 */
export interface FinanciamentoSystemResult {
  /** Payment for the first month. */
  firstPayment: number;
  /** Payment for the last month. */
  lastPayment: number;
  /** Total amount paid over the full term (principal + interest + insurance + admin). */
  totalPaid: number;
  /** Total interest paid over the full term. */
  totalInterest: number;
  /** Full amortization schedule (up to MAX_TERM_MONTHS rows). */
  schedule: FinanciamentoAmortizacaoRow[];
}

/**
 * Form state for the Financiamento Imobiliário calculator.
 */
export interface FinanciamentoFormState extends Record<string, unknown> {
  /** Total property value in BRL. */
  propertyValue: number | null;
  /** Down payment as a percentage of the property value (default: 20). */
  downPaymentPct: number;
  /** Loan term in months (default: 360, max: 360). */
  termMonths: number;
  /** Annual interest rate in percent (e.g. 12 = 12% a.a.). */
  annualRatePct: number | null;
  /** Monthly insurance premium in BRL (default: 0). */
  insuranceMonthly: number;
  /** Monthly administration fee in BRL (default: 0). */
  adminFeeMonthly: number;
}

/**
 * Aggregated result for the Financiamento Imobiliário calculator.
 */
export interface FinanciamentoResult {
  /** Financed amount (propertyValue × (1 − downPaymentPct/100)). */
  loanAmount: number;
  /** Down payment amount in BRL. */
  downPayment: number;
  /** SAC amortization result. */
  sac: FinanciamentoSystemResult;
  /** PRICE amortization result. */
  price: FinanciamentoSystemResult;
  /** Effective monthly interest rate used in calculations. */
  monthlyRate: number;
  /**
   * Estimated CET (Custo Efetivo Total) in percent per annum.
   * Approximation: ((totalPaid / loanAmount)^(12 / termMonths) − 1) × 100.
   * The SAC total is used for the CET estimate.
   */
  cetEstimatedPct: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validation error descriptor.
 */
export interface FinanciamentoValidationError {
  /** Form field that failed validation. */
  field: keyof FinanciamentoFormState;
  /** i18n message key (relative to financiamentoImobiliario namespace). */
  messageKey: string;
}

/**
 * Validates the Financiamento Imobiliário form state.
 *
 * @param form Current form state.
 * @returns Array of validation errors (empty when valid).
 */
export function validateFinanciamentoForm(
  form: FinanciamentoFormState,
): FinanciamentoValidationError[] {
  const errors: FinanciamentoValidationError[] = [];

  if (form.propertyValue === null || form.propertyValue <= 0) {
    errors.push({ field: "propertyValue", messageKey: "errors.propertyValueRequired" });
  }

  if (form.downPaymentPct < 0 || form.downPaymentPct >= 100) {
    errors.push({ field: "downPaymentPct", messageKey: "errors.downPaymentPctRange" });
  }

  if (form.termMonths < 12 || form.termMonths > MAX_TERM_MONTHS) {
    errors.push({ field: "termMonths", messageKey: "errors.termMonthsRange" });
  }

  if (form.annualRatePct === null || form.annualRatePct <= 0) {
    errors.push({ field: "annualRatePct", messageKey: "errors.annualRateRequired" });
  }

  return errors;
}

// ─── Default state ────────────────────────────────────────────────────────────

/**
 * Creates the default form state for the Financiamento Imobiliário calculator.
 *
 * @returns Fresh form state with sensible defaults.
 */
export function createDefaultFinanciamentoFormState(): FinanciamentoFormState {
  return {
    propertyValue: null,
    downPaymentPct: 20,
    termMonths: 360,
    annualRatePct: null,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Shared input options for amortization schedule builders.
 */
interface ScheduleOptions {
  /** Initial principal (PV). */
  loanAmount: number;
  /** Monthly interest rate (decimal). */
  monthlyRate: number;
  /** Number of months. */
  termMonths: number;
  /** Monthly insurance premium in BRL. */
  insuranceMonthly: number;
  /** Monthly administration fee in BRL. */
  adminFeeMonthly: number;
}

/**
 * Builds the SAC (Sistema de Amortização Constante) schedule.
 *
 * In SAC, the principal amortization is constant each month:
 *   A = PV / n
 * The monthly payment decreases over time as the balance falls:
 *   PMT_k = A + PV_k × rate + insurance + adminFee
 *
 * @param opts Schedule options.
 * @returns Aggregated SAC result.
 */
function buildSacSchedule(opts: ScheduleOptions): FinanciamentoSystemResult {
  const { loanAmount, monthlyRate, termMonths, insuranceMonthly, adminFeeMonthly } = opts;
  const schedule: FinanciamentoAmortizacaoRow[] = [];
  const amortization = loanAmount / termMonths;
  let balance = loanAmount;
  let totalPaid = 0;
  let totalInterest = 0;

  for (let k = 1; k <= termMonths; k++) {
    const interest = balance * monthlyRate;
    const extraCosts = insuranceMonthly + adminFeeMonthly;
    const payment = amortization + interest + extraCosts;
    balance = balance - amortization;
    if (balance < 0) { balance = 0; }

    totalPaid += payment;
    totalInterest += interest;

    schedule.push({
      month: k,
      payment,
      amortization,
      interest,
      balance,
    });
  }

  return {
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule[schedule.length - 1]?.payment ?? 0,
    totalPaid,
    totalInterest,
    schedule,
  };
}

/**
 * Builds the PRICE (Tabela Price) schedule.
 *
 * In PRICE, the total payment is constant each month:
 *   PMT = PV × rate / (1 − (1 + rate)^(−n))
 * The amortization grows and interest shrinks over time.
 *
 * @param opts Schedule options.
 * @returns Aggregated PRICE result.
 */
function buildPriceSchedule(opts: ScheduleOptions): FinanciamentoSystemResult {
  const { loanAmount, monthlyRate, termMonths, insuranceMonthly, adminFeeMonthly } = opts;
  const schedule: FinanciamentoAmortizacaoRow[] = [];

  // Constant base PMT (principal + interest only)
  const basePmt =
    loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));

  const extraCosts = insuranceMonthly + adminFeeMonthly;
  let balance = loanAmount;
  let totalPaid = 0;
  let totalInterest = 0;

  for (let k = 1; k <= termMonths; k++) {
    const interest = balance * monthlyRate;
    const amortization = basePmt - interest;
    const payment = basePmt + extraCosts;
    balance = balance - amortization;
    if (balance < 0) { balance = 0; }

    totalPaid += payment;
    totalInterest += interest;

    schedule.push({
      month: k,
      payment,
      amortization,
      interest,
      balance,
    });
  }

  return {
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule[schedule.length - 1]?.payment ?? 0,
    totalPaid,
    totalInterest,
    schedule,
  };
}

// ─── Main calculation ─────────────────────────────────────────────────────────

/**
 * Calculates the complete financing comparison between SAC and PRICE systems.
 *
 * Assumes the form has already been validated (see validateFinanciamentoForm).
 *
 * @param form Validated form state.
 * @returns Complete financing result with both amortization schedules.
 */
export function calculateFinanciamento(form: FinanciamentoFormState): FinanciamentoResult {
  const propertyValue = form.propertyValue as number;
  const downPayment = propertyValue * (form.downPaymentPct / 100);
  const loanAmount = propertyValue - downPayment;
  const annualRate = form.annualRatePct as number;

  // Convert annual nominal rate to monthly using compound conversion
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

  const termMonths = Math.min(form.termMonths, MAX_TERM_MONTHS);

  const scheduleOpts: ScheduleOptions = {
    loanAmount,
    monthlyRate,
    termMonths,
    insuranceMonthly: form.insuranceMonthly,
    adminFeeMonthly: form.adminFeeMonthly,
  };

  const sac = buildSacSchedule(scheduleOpts);
  const price = buildPriceSchedule(scheduleOpts);

  // CET estimate: annualise the total-cost ratio over the term
  // Uses SAC totalPaid as representative scenario
  const cetEstimatedPct =
    (Math.pow(sac.totalPaid / loanAmount, 12 / termMonths) - 1) * 100;

  return {
    loanAmount,
    downPayment,
    sac,
    price,
    monthlyRate,
    cetEstimatedPct,
  };
}
