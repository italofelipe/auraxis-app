/**
 * Domain model for the Dividir Conta (bill splitting) calculator.
 *
 * Supports two modes:
 *  - equal: the total (with fees) is divided equally among N people.
 *  - individual: each person pays proportionally to their own consumption,
 *    plus a proportional share of the service fee and tip.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Available bill-splitting modes. */
export const DIVIDIR_CONTA_MODES = ["equal", "individual"] as const;

/** Public route for the Dividir Conta calculator page. */
export const DIVIDIR_CONTA_PUBLIC_PATH = "/tools/dividir-conta";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Splitting mode: equal split or proportional to individual consumption. */
export type DividirContaMode = "equal" | "individual";

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the Dividir Conta calculator. */
export interface DividirContaFormState extends Record<string, unknown> {
  /** Total bill amount in BRL before fees (must be > 0). */
  total: number | null;
  /** Service fee percentage (default 10%). */
  serviceFeePct: number;
  /** Tip percentage (default 0%). */
  tipPct: number;
  /** Number of people splitting the bill (minimum 2). */
  people: number;
  /** Splitting mode: equal or by individual consumption. */
  mode: DividirContaMode;
  /**
   * Array of individual consumption amounts (one per person).
   * Only used when mode = "individual". Length equals `people`.
   */
  individualAmounts: (number | null)[];
}

/**
 * Returns the default initial form state for the Dividir Conta calculator.
 *
 * @returns Default DividirContaFormState.
 */
export function createDefaultDividirContaFormState(): DividirContaFormState {
  return {
    total: null,
    serviceFeePct: 10,
    tipPct: 0,
    people: 2,
    mode: "equal",
    individualAmounts: [null, null],
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for Dividir Conta form. */
export interface DividirContaValidationError {
  field: keyof DividirContaFormState | `individualAmounts.${number}`;
  messageKey: string;
}

/**
 * Validates the Dividir Conta form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateDividirContaForm(
  form: DividirContaFormState,
): DividirContaValidationError[] {
  const errors: DividirContaValidationError[] = [];

  if (form.total === null || form.total <= 0) {
    errors.push({ field: "total", messageKey: "errors.totalRequired" });
  }

  if (form.people < 2 || !Number.isInteger(form.people)) {
    errors.push({ field: "people", messageKey: "errors.minPeople" });
  }

  if (form.serviceFeePct < 0 || form.serviceFeePct > 100) {
    errors.push({ field: "serviceFeePct", messageKey: "errors.invalidFee" });
  }

  if (form.tipPct < 0 || form.tipPct > 100) {
    errors.push({ field: "tipPct", messageKey: "errors.invalidTip" });
  }

  if (form.mode === "individual") {
    const allFilled = form.individualAmounts
      .slice(0, form.people)
      .every((v) => v !== null && v >= 0);
    if (!allFilled) {
      errors.push({ field: "individualAmounts", messageKey: "errors.allAmountsRequired" });
    }
  }

  return errors;
}

// ─── Result ───────────────────────────────────────────────────────────────────

/** Calculation result for the Dividir Conta calculator. */
export interface DividirContaResult {
  /** Service fee amount in BRL. */
  serviceFeeBrl: number;
  /** Tip amount in BRL. */
  tipBrl: number;
  /** Total bill including all fees and tip. */
  totalWithFees: number;
  /** Per-person amount when splitting equally. */
  perPersonEqual: number;
  /**
   * Per-person amounts when splitting by individual consumption.
   * Each entry includes the person's proportional share of fees.
   */
  perPersonIndividual: number[];
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates the bill split for all modes.
 *
 * Equal mode: (total + fees) / people.
 * Individual mode: each person pays their consumption + proportional share of fees.
 *
 * @param form Validated form state.
 * @returns Complete result with per-person breakdowns.
 */
export function calculateDividirConta(form: DividirContaFormState): DividirContaResult {
  const total = form.total ?? 0;
  const serviceFeeBrl = round2(total * (form.serviceFeePct / 100));
  const tipBrl = round2(total * (form.tipPct / 100));
  const totalFees = serviceFeeBrl + tipBrl;
  const totalWithFees = round2(total + totalFees);
  const perPersonEqual = round2(totalWithFees / form.people);

  let perPersonIndividual: number[] = [];

  if (form.mode === "individual") {
    const amounts = form.individualAmounts.slice(0, form.people);
    const consumptionTotal = amounts.reduce<number>((sum, v) => sum + (v ?? 0), 0);

    perPersonIndividual = amounts.map((v) => {
      const consumption = v ?? 0;
      const feeShare = consumptionTotal > 0
        ? round2((consumption / consumptionTotal) * totalFees)
        : round2(totalFees / form.people);
      return round2(consumption + feeShare);
    });
  } else {
    perPersonIndividual = Array.from({ length: form.people }, () => perPersonEqual);
  }

  return {
    serviceFeeBrl,
    tipBrl,
    totalWithFees,
    perPersonEqual,
    perPersonIndividual,
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
