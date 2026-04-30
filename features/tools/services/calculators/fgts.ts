/**
 * Domain model for the Simulador de FGTS calculator.
 *
 * Projects the FGTS balance over time and simulates the termination fine
 * based on the dismissal type.
 *
 * Regulatory basis:
 *   - CLT art. 15: monthly deposit = 8% of gross salary.
 *   - TR + 3% per year correction. Since TR has been near zero since 2017,
 *     TR defaults to 0.0% but can be changed by the user.
 *   - Lei 13.467/2017 (Reforma Trabalhista): introduces "acordo entre partes"
 *     with 20% fine to worker and right to withdraw 80% of balance.
 *   - Sem justa causa: 40% fine to worker + 10% to government (FGTS Complementar).
 *   - Pedido de demissão / com justa causa: no fine, generally cannot withdraw.
 *
 * Last update reference year: 2025.
 */

/** Year of the FGTS regulatory table used in this model. */
export const FGTS_TABLE_YEAR = 2025;

/** Mandatory CLT deposit rate on gross salary. */
export const FGTS_DEPOSIT_RATE = 0.08;

// ─── Termination types ────────────────────────────────────────────────────────

/**
 * All CLT termination types supported by this calculator.
 * Order matters: used to build UI select options.
 */
export const FGTS_TERMINATION_TYPES = [
  "sem_justa_causa",
  "acordo",
  "pedido_demissao",
  "justa_causa",
] as const;

/** Union type for the supported termination types. */
export type FgtsTerminationType = (typeof FGTS_TERMINATION_TYPES)[number];

/**
 * Fine rates paid **to the worker** for each termination type.
 * These are applied to the projected FGTS balance.
 */
export const FGTS_FINE_RATES: Record<FgtsTerminationType, number> = {
  sem_justa_causa: 0.4,
  acordo: 0.2,
  pedido_demissao: 0,
  justa_causa: 0,
};

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the FGTS simulator. */
export interface FgtsFormState extends Record<string, unknown> {
  /** Monthly gross salary in BRL. */
  grossSalary: number | null;
  /** Full years of service. */
  yearsOfService: number;
  /** Additional months of service beyond full years (0–11). */
  monthsOfService: number;
  /**
   * Current FGTS balance in BRL.
   * When 0, the simulation starts from scratch.
   */
  currentBalance: number;
  /** Annual TR rate in percent (e.g. 0.0 for zero TR). */
  trRatePct: number;
  /** How the employment contract is being terminated. */
  terminationType: FgtsTerminationType;
}

/**
 * Returns the default initial form state for the FGTS simulator.
 *
 * @returns Default FgtsFormState.
 */
export function createDefaultFgtsFormState(): FgtsFormState {
  return {
    grossSalary: null,
    yearsOfService: 1,
    monthsOfService: 0,
    currentBalance: 0,
    trRatePct: 0.0,
    terminationType: "sem_justa_causa",
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** A validation error for the FGTS form. */
export interface FgtsValidationError {
  field: keyof FgtsFormState;
  messageKey: string;
}

/**
 * Validates the FGTS form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateFgtsForm(form: FgtsFormState): FgtsValidationError[] {
  const errors: FgtsValidationError[] = [];

  if (form.grossSalary === null || form.grossSalary <= 0) {
    errors.push({ field: "grossSalary", messageKey: "errors.grossSalaryRequired" });
  }
  if (form.yearsOfService < 0 || !Number.isFinite(form.yearsOfService)) {
    errors.push({ field: "yearsOfService", messageKey: "errors.yearsOfServiceInvalid" });
  }
  if (
    form.monthsOfService < 0 ||
    form.monthsOfService > 11 ||
    !Number.isFinite(form.monthsOfService)
  ) {
    errors.push({ field: "monthsOfService", messageKey: "errors.monthsOfServiceInvalid" });
  }
  if (form.currentBalance < 0) {
    errors.push({ field: "currentBalance", messageKey: "errors.currentBalanceInvalid" });
  }

  return errors;
}

// ─── Calculation result ───────────────────────────────────────────────────────

/** Result of the FGTS simulation. */
export interface FgtsResult {
  /** Projected FGTS balance after the service period. */
  projectedBalance: number;
  /** Monthly deposit = grossSalary × 8%. */
  monthlyDeposit: number;
  /** Total amount deposited = totalMonths × monthlyDeposit. */
  totalDeposited: number;
  /** Monetary correction earned over the period. */
  correctionAmount: number;
  /**
   * Fine paid to the worker.
   * 40% for sem_justa_causa; 20% for acordo; 0 otherwise.
   */
  fineAmount: number;
  /**
   * Government fine (FGTS Complementar).
   * 10% for sem_justa_causa only; 0 for all other types.
   */
  governmentFineAmount: number;
  /**
   * Total amount the worker can withdraw.
   * Includes balance + fine (varies by termination type).
   */
  withdrawableAmount: number;
  /** True when the worker can withdraw the balance upon this termination type. */
  canWithdraw: boolean;
  /** Tax table reference year. */
  tableYear: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/** Parameters for the FGTS monthly accumulation loop. */
interface AccumulateParams {
  /** Initial balance (may be zero when starting from scratch). */
  startBalance: number;
  /** Monthly deposit = grossSalary × 8%. */
  monthlyDeposit: number;
  /** Monthly compound correction rate. */
  monthlyRate: number;
  /** Total number of months to simulate. */
  totalMonths: number;
}

/**
 * Accumulates the FGTS balance over the given number of months.
 *
 * @param params Accumulation parameters.
 * @returns Final projected balance rounded to 2 decimal places.
 */
function accumulateBalance(params: AccumulateParams): number {
  let balance = params.startBalance;
  for (let month = 0; month < params.totalMonths; month++) {
    balance = (balance + params.monthlyDeposit) * (1 + params.monthlyRate);
  }
  return round2(balance);
}

/**
 * Derives withdrawable amount and withdrawal eligibility based on termination type.
 *
 * @param terminationType How the contract ended.
 * @param projectedBalance Final projected FGTS balance.
 * @param fineAmount Fine amount paid to the worker.
 * @returns Withdrawable amount and canWithdraw flag.
 */
function deriveWithdrawal(
  terminationType: FgtsTerminationType,
  projectedBalance: number,
  fineAmount: number,
): { withdrawableAmount: number; canWithdraw: boolean } {
  if (terminationType === "sem_justa_causa") {
    return { withdrawableAmount: round2(projectedBalance + fineAmount), canWithdraw: true };
  }
  if (terminationType === "acordo") {
    return { withdrawableAmount: round2(projectedBalance * 0.8 + fineAmount), canWithdraw: true };
  }
  return { withdrawableAmount: 0, canWithdraw: false };
}

/**
 * Simulates the FGTS balance over the service period.
 *
 * The monthly correction rate combines TR and the mandatory 3% p.a.:
 *   monthlyRate = (1 + trRatePct/100 + 0.03)^(1/12) - 1
 *
 * Starting balance is grown with compound interest alongside each month's
 * deposit. If currentBalance is 0, the simulation starts from zero.
 *
 * @param form Validated form state.
 * @returns Complete FGTS simulation result.
 */
export function calculateFgts(form: FgtsFormState): FgtsResult {
  const gross = form.grossSalary ?? 0;
  const totalMonths = form.yearsOfService * 12 + form.monthsOfService;
  const monthlyDeposit = round2(gross * FGTS_DEPOSIT_RATE);
  const monthlyRate = Math.pow(1 + form.trRatePct / 100 + 0.03, 1 / 12) - 1;
  const projectedBalance = accumulateBalance({
    startBalance: form.currentBalance,
    monthlyDeposit,
    monthlyRate,
    totalMonths,
  });
  const totalDeposited = round2(totalMonths * monthlyDeposit);
  const correctionAmount = round2(projectedBalance - totalDeposited - form.currentBalance);
  const fineAmount = round2(projectedBalance * FGTS_FINE_RATES[form.terminationType]);
  const governmentFineAmount =
    form.terminationType === "sem_justa_causa" ? round2(projectedBalance * 0.1) : 0;
  const { withdrawableAmount, canWithdraw } = deriveWithdrawal(
    form.terminationType,
    projectedBalance,
    fineAmount,
  );

  return {
    projectedBalance,
    monthlyDeposit,
    totalDeposited,
    correctionAmount,
    fineAmount,
    governmentFineAmount,
    withdrawableAmount,
    canWithdraw,
    tableYear: FGTS_TABLE_YEAR,
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
