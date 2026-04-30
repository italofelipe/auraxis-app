/**
 * Brazilian INSS and IRRF progressive tax tables.
 *
 * Tables follow the 2025 regulation (Portaria MPS/MF nº 3 — Jan 2025).
 * These values are updated annually in January; see the table year constant
 * below. UI should display a disclaimer pointing to this constant.
 */

/** Year of the current table version. Update together with the brackets. */
export const BR_TAX_TABLE_YEAR = 2025;

// ─── INSS ─────────────────────────────────────────────────────────────────────

interface InsssBracket {
  upTo: number;
  rate: number;
}

/**
 * Progressive INSS contribution table (tabela progressiva — vigente 2025).
 * Each bracket applies only to the slice of salary within that range.
 */
const INSS_BRACKETS: readonly InsssBracket[] = [
  { upTo: 1_518.0, rate: 0.075 },
  { upTo: 2_793.88, rate: 0.09 },
  { upTo: 4_190.83, rate: 0.12 },
  { upTo: 8_157.41, rate: 0.14 },
];

/**
 * Calculates the INSS contribution using the progressive table.
 *
 * @param grossSalary Monthly gross salary in BRL.
 * @returns INSS contribution amount (capped at the ceiling bracket).
 */
export function calcInss(grossSalary: number): number {
  let inss = 0;
  let prevLimit = 0;

  for (const { upTo, rate } of INSS_BRACKETS) {
    if (grossSalary <= prevLimit) { break; }
    const sliceTop = Math.min(grossSalary, upTo);
    inss += (sliceTop - prevLimit) * rate;
    prevLimit = upTo;
    if (grossSalary <= upTo) { break; }
  }

  return round2(inss);
}

// ─── IRRF ─────────────────────────────────────────────────────────────────────

interface IrrfBracket {
  upTo: number;
  rate: number;
  /** Fixed deduction for this bracket (parcela a deduzir). */
  deduction: number;
}

/**
 * IRRF monthly income tax table (2025).
 * Taxable base = grossSalary − INSS − (dependents × PER_DEPENDENT_DEDUCTION).
 */
const IRRF_BRACKETS: readonly IrrfBracket[] = [
  { upTo: 2_259.2, rate: 0, deduction: 0 },
  { upTo: 2_826.65, rate: 0.075, deduction: 169.44 },
  { upTo: 3_751.05, rate: 0.15, deduction: 381.44 },
  { upTo: 4_664.68, rate: 0.225, deduction: 662.77 },
  { upTo: Infinity, rate: 0.275, deduction: 896.0 },
];

/** IRRF deduction per declared dependent (2025). */
export const IRRF_PER_DEPENDENT_DEDUCTION = 189.59;

/**
 * Calculates the IRRF (monthly income tax) on the taxable base.
 *
 * @param taxableBase Gross salary minus INSS and dependent deductions.
 * @returns IRRF tax amount (never negative).
 */
export function calcIrrf(taxableBase: number): number {
  if (taxableBase <= 0) { return 0; }

  for (const { upTo, rate, deduction } of IRRF_BRACKETS) {
    if (taxableBase <= upTo) {
      return round2(Math.max(0, taxableBase * rate - deduction));
    }
  }

  return 0;
}

/**
 * Calculates IRRF considering INSS already deducted and optional dependents.
 *
 * @param grossSalary Total gross salary/amount to be taxed.
 * @param inssAmount INSS already deducted (reduces taxable base).
 * @param dependents Number of IRRF-eligible dependents declared.
 * @returns IRRF amount.
 */
export function calcIrrfFromGross(
  grossSalary: number,
  inssAmount: number,
  dependents: number,
): number {
  const taxableBase =
    grossSalary - inssAmount - dependents * IRRF_PER_DEPENDENT_DEDUCTION;
  return calcIrrf(taxableBase);
}

// ─── INSS bracket breakdown ───────────────────────────────────────────────────

/** Per-bracket result of the progressive INSS calculation. */
export interface InssBracketBreakdown {
  /** Lower bound (exclusive) of this bracket — 0 for the first bracket. */
  from: number;
  /** Upper bound (inclusive) of this bracket. */
  to: number;
  /** Rate applied to the salary slice within this bracket. */
  rate: number;
  /** Portion of the salary falling in this bracket (0 when salary doesn't reach it). */
  sliceAmount: number;
  /** INSS contribution from this bracket alone. */
  contribution: number;
  /** True when the gross salary exceeds this bracket's lower bound. */
  isActive: boolean;
}

/**
 * Returns the full INSS bracket table with per-bracket contribution amounts.
 * Always returns one entry per bracket (all four), even for low salaries.
 *
 * @param grossSalary Monthly gross salary in BRL.
 * @returns One entry per INSS bracket.
 */
export function calcInssBracketBreakdown(grossSalary: number): InssBracketBreakdown[] {
  const result: InssBracketBreakdown[] = [];
  let prevLimit = 0;

  for (const { upTo, rate } of INSS_BRACKETS) {
    const isActive = grossSalary > prevLimit;
    const sliceAmount = isActive
      ? round2(Math.min(grossSalary, upTo) - prevLimit)
      : 0;
    const contribution = round2(sliceAmount * rate);

    result.push({ from: prevLimit, to: upTo, rate, sliceAmount, contribution, isActive });
    prevLimit = upTo;
  }

  return result;
}

// ─── IRRF bracket breakdown ───────────────────────────────────────────────────

/** Status of a single IRRF bracket against a given taxable base. */
export interface IrrfBracketBreakdown {
  /** Lower bound (exclusive) — 0 for the first bracket. */
  from: number;
  /** Upper bound (inclusive). `null` means no upper limit (last bracket). */
  to: number | null;
  /** Tax rate for this bracket. */
  rate: number;
  /** "Parcela a deduzir" (fixed deduction subtracted from rate × base). */
  parcela: number;
  /** True when the taxable base falls inside this bracket. */
  isApplicable: boolean;
}

/**
 * Returns the full IRRF bracket table annotated with applicability flags.
 *
 * @param taxableBase Taxable base after INSS and all deductions (BRL).
 * @returns All five IRRF brackets, each flagged as applicable or not.
 */
export function calcIrrfBracketBreakdown(taxableBase: number): IrrfBracketBreakdown[] {
  let prevLimit = 0;

  return IRRF_BRACKETS.map(({ upTo, rate, deduction }) => {
    const from = prevLimit;
    const to = upTo === Infinity ? null : upTo;
    const isApplicable =
      taxableBase > 0 && taxableBase > prevLimit && taxableBase <= upTo;
    prevLimit = upTo;

    return { from, to, rate, parcela: deduction, isApplicable };
  });
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
