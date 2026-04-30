/**
 * Domain model for the Tesouro Direto simulator.
 *
 * Simulates net return for:
 *  - Tesouro Selic: effectiveRate = selic + taxaIndicativa
 *  - Tesouro IPCA+: effectiveRate = ipca + taxaIndicativa
 *  - Tesouro Prefixado: effectiveRate = taxaIndicativa
 *
 * Costs:
 *  - B3 custody fee: 0.20% a.a. on principal for the period
 *  - IR: regressive table (same brackets as CDB)
 *
 * Regulatory basis: 2025 table. IOF (< 30 days) is not calculated — disclaimer shown.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Year of the IR bracket table used in this model. */
export const TESOURO_TABLE_YEAR = 2025;

/** B3 annual custody fee for Tesouro Direto (0.20% a.a.). */
export const TESOURO_B3_CUSTODY_RATE = 0.002;

/** Available Tesouro Direto bond types. */
export const TESOURO_TYPES = ["selic", "ipca_plus", "prefixado"] as const;

/** Regressive IR brackets for Tesouro Direto (same as CDB). */
export const TESOURO_IR_BRACKETS: readonly {
  readonly maxDays: number;
  readonly rate: number;
}[] = [
  { maxDays: 180, rate: 0.225 },
  { maxDays: 360, rate: 0.20 },
  { maxDays: 720, rate: 0.175 },
  { maxDays: 99999, rate: 0.15 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

/** Bond type for Tesouro Direto. */
export type TesouroDiretoType = (typeof TESOURO_TYPES)[number];

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the Tesouro Direto simulator. */
export interface TesouroDiretoFormState extends Record<string, unknown> {
  /** Bond type to simulate. */
  type: TesouroDiretoType;
  /** Principal investment amount in BRL (null until user fills in). */
  amount: number | null;
  /** Investment term in calendar days (default 365). */
  termDays: number;
  /**
   * Indicative rate ("juros" do título) as % a.a.:
   *  - Selic: small spread added to SELIC (e.g. 0.0747)
   *  - IPCA+: spread added to IPCA (e.g. 6.50)
   *  - Prefixado: full pre-set rate (e.g. 14.00)
   */
  taxaIndicativaPct: number | null;
  /** SELIC annual rate in % (default 10.75 as of Apr/2026 — manual input only). */
  selicPct: number;
  /** IPCA annual rate in % (default 4.5 — used as estimate). */
  ipcaPct: number;
}

/**
 * Returns the default initial form state for the Tesouro Direto simulator.
 *
 * @returns Default TesouroDiretoFormState.
 */
export function createDefaultTesouroDiretoFormState(): TesouroDiretoFormState {
  return {
    type: "selic",
    amount: null,
    termDays: 365,
    taxaIndicativaPct: null,
    selicPct: 10.75,
    ipcaPct: 4.5,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for the Tesouro Direto form. */
export interface TesouroDiretoValidationError {
  field: keyof TesouroDiretoFormState;
  messageKey: string;
}

/**
 * Validates the Tesouro Direto form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateTesouroDiretoForm(
  form: TesouroDiretoFormState,
): TesouroDiretoValidationError[] {
  const errors: TesouroDiretoValidationError[] = [];

  if (form.amount === null || form.amount <= 0) {
    errors.push({ field: "amount", messageKey: "errors.amountRequired" });
  }

  if (form.termDays < 1) {
    errors.push({ field: "termDays", messageKey: "errors.termDaysRequired" });
  }

  if (form.taxaIndicativaPct === null) {
    errors.push({ field: "taxaIndicativaPct", messageKey: "errors.taxaIndicativaRequired" });
  }

  return errors;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/** Complete calculation result for the Tesouro Direto simulator. */
export interface TesouroDiretoResult {
  /** Gross return before any deductions (BRL). */
  grossReturn: number;
  /** Gross amount including principal (BRL). */
  grossAmount: number;
  /** B3 custody fee deducted (BRL). */
  custodyFee: number;
  /** IR rate applied (decimal). */
  irRate: number;
  /** IR amount deducted (BRL). */
  irAmount: number;
  /** Net return after custody fee and IR (BRL). */
  netReturn: number;
  /** Final net amount including principal (BRL). */
  netAmount: number;
  /** Annualized net return rate (decimal). */
  annualizedNetReturn: number;
  /** Real return above IPCA using Fisher formula (decimal). */
  realReturn: number;
}

/**
 * Determines the effective annual rate for the given bond type.
 *
 * @param form Validated form state.
 * @returns Effective annual rate as a decimal.
 */
export function resolveEffectiveRate(form: TesouroDiretoFormState): number {
  const taxa = (form.taxaIndicativaPct ?? 0) / 100;
  const selic = form.selicPct / 100;
  const ipca = form.ipcaPct / 100;

  if (form.type === "selic") {
    return selic + taxa;
  }
  if (form.type === "ipca_plus") {
    return ipca + taxa;
  }
  return taxa;
}

/**
 * Finds the applicable IR rate given the investment term.
 *
 * @param termDays Term in calendar days.
 * @returns IR rate as a decimal.
 */
export function findTesourIrRate(termDays: number): number {
  for (const bracket of TESOURO_IR_BRACKETS) {
    if (termDays <= bracket.maxDays) {
      return bracket.rate;
    }
  }
  return 0.15;
}

/**
 * Calculates the Tesouro Direto simulation.
 *
 * Steps:
 *  1. Determine effective annual rate by bond type.
 *  2. Compute gross return: amount * ((1 + rate)^(termDays/365) - 1).
 *  3. Deduct B3 custody fee (0.20% p.a. on principal).
 *  4. Apply regressive IR on gross return.
 *  5. Compute net return and net amount.
 *  6. Annualised net return.
 *  7. Real return via Fisher formula.
 *
 * @param form Validated form state.
 * @returns TesouroDiretoResult.
 */
export function calculateTesouroDireto(form: TesouroDiretoFormState): TesouroDiretoResult {
  const amount = form.amount ?? 0;
  const termDays = form.termDays;
  const effectiveRate = resolveEffectiveRate(form);

  const grossReturn = round2(amount * (Math.pow(1 + effectiveRate, termDays / 365) - 1));
  const grossAmount = round2(amount + grossReturn);

  const custodyFee = round2(amount * TESOURO_B3_CUSTODY_RATE * (termDays / 365));
  const irRate = findTesourIrRate(termDays);
  const irAmount = round2(grossReturn * irRate);

  const netReturn = round2(grossReturn - custodyFee - irAmount);
  const netAmount = round2(amount + netReturn);

  const annualizedNetReturn = round4(Math.pow(netAmount / amount, 365 / termDays) - 1);

  const annualIpca = form.ipcaPct / 100;
  const periodIpca = Math.pow(1 + annualIpca, termDays / 365) - 1;
  const realReturn = round4((netAmount / amount) / (1 + periodIpca) - 1);

  return {
    grossReturn,
    grossAmount,
    custodyFee,
    irRate,
    irAmount,
    netReturn,
    netAmount,
    annualizedNetReturn,
    realReturn,
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

/**
 * Rounds a number to 4 decimal places (rate precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
