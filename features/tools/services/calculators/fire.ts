/**
 * Domain model for the Simulador FIRE (Financial Independence, Retire Early).
 *
 * Supports four FIRE variants:
 *   - FIRE:       Standard — 25x annual expenses (4% SWR)
 *   - Lean FIRE:  Lean variant with a 3% annual expense ratio reduction multiplier (≈ 20x)
 *   - Fat FIRE:   Fat variant — 33x annual expenses (~3% SWR for luxury lifestyle)
 *   - Coast FIRE: Lump sum that, left to grow until retirement, reaches the FIRE number
 *                 without further contributions.
 *
 * PMT formula (FV):
 *   PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
 *
 * Coast FIRE coast number:
 *   CoastNumber = FIRENumber / (1+r)^n
 *
 * Real return (Fisher):
 *   realRate = (1 + nominal) / (1 + inflation) - 1
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Year of this model's regulatory basis. */
export const FIRE_TABLE_YEAR = 2025;

/** Available FIRE variant identifiers. */
export const FIRE_VARIANTS = ["fire", "lean_fire", "fat_fire", "coast_fire"] as const;

/**
 * Safe withdrawal rate multiplier for each FIRE variant.
 * The required patrimony = annualExpenses * SWR_MULTIPLIER[variant].
 */
export const FIRE_SWR_MULTIPLIERS: Record<FireVariant, number> = {
  fire: 25,
  lean_fire: 20,
  fat_fire: 33,
  coast_fire: 25,
};

// ─── Types ────────────────────────────────────────────────────────────────────

/** FIRE variant identifier. */
export type FireVariant = (typeof FIRE_VARIANTS)[number];

/** A single data point in the FIRE patrimony evolution chart. */
export interface FireChartPoint {
  /** Age at this data point. */
  age: number;
  /** Projected patrimony at this age (nominal BRL). */
  patrimony: number;
}

/** Breakdown for a specific FIRE variant milestone. */
export interface FireVariantMilestone {
  /** Variant label. */
  variant: FireVariant;
  /** Required patrimony for this variant. */
  requiredPatrimony: number;
  /** Monthly contribution required to reach this variant's target. */
  requiredMonthlyContribution: number;
  /** Whether the current trajectory reaches this variant's target. */
  isOnTrack: boolean;
}

/** Complete calculation result for the FIRE simulator. */
export interface FireResult {
  /** Selected variant result — primary focus. */
  selectedVariant: FireVariantMilestone;
  /** All four variant milestones for comparison. */
  allVariants: FireVariantMilestone[];
  /** Coast FIRE number — lump sum needed today to reach FIRE without more contributions. */
  coastNumber: number;
  /** Number of months until retirement age. */
  monthsToRetirement: number;
  /** Year-by-year patrimony growth chart data. */
  chartData: FireChartPoint[];
  /** Real annual return after inflation (Fisher formula, as %). */
  realReturnPct: number;
  /** Projected patrimony at retirement using selected variant PMT. */
  projectedPatrimony: number;
}

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the FIRE simulator. */
export interface FireFormState extends Record<string, unknown> {
  /** Current age in years (default 30). */
  currentAge: number;
  /** Target retirement age in years (default 45). */
  retirementAge: number;
  /** Monthly expenses in today's Reais (null until user fills in). */
  monthlyExpenses: number | null;
  /** Current patrimony / savings in BRL (default 0). */
  currentPatrimony: number;
  /** Expected nominal annual return in % (default 8.0). */
  expectedReturnPct: number;
  /** IPCA annual rate in % (default 4.5). */
  ipcaPct: number;
  /** Selected FIRE variant (default "fire"). */
  variant: FireVariant;
}

/**
 * Returns the default initial form state for the FIRE simulator.
 *
 * @returns Default FireFormState.
 */
export function createDefaultFireFormState(): FireFormState {
  return {
    currentAge: 30,
    retirementAge: 45,
    monthlyExpenses: null,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    variant: "fire",
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for the FIRE form. */
export interface FireValidationError {
  field: keyof FireFormState;
  messageKey: string;
}

/**
 * Validates the FIRE form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateFireForm(form: FireFormState): FireValidationError[] {
  const errors: FireValidationError[] = [];

  if (form.retirementAge <= form.currentAge) {
    errors.push({ field: "retirementAge", messageKey: "errors.retirementAgeAfterCurrent" });
  }

  if (form.monthlyExpenses === null || form.monthlyExpenses <= 0) {
    errors.push({ field: "monthlyExpenses", messageKey: "errors.expensesRequired" });
  }

  if (form.expectedReturnPct <= 0) {
    errors.push({ field: "expectedReturnPct", messageKey: "errors.returnRequired" });
  }

  return errors;
}

// ─── Calculation helpers ──────────────────────────────────────────────────────

/** Options for monthly PMT calculation. */
interface PmtOptions {
  /** Target future value. */
  fv: number;
  /** Present value (current patrimony). */
  pv: number;
  /** Monthly rate (decimal). */
  r: number;
  /** Number of months. */
  n: number;
}

/**
 * Calculates the monthly PMT needed to reach a future value.
 *
 * PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
 * Returns 0 if n <= 0 or the patrimony already exceeds the target.
 *
 * @param opts PMT calculation options.
 * @returns Monthly PMT amount in BRL (0 if no contribution needed).
 */
function calcPmt(opts: PmtOptions): number {
  if (opts.n <= 0) { return 0; }
  const growth = Math.pow(1 + opts.r, opts.n);
  const pvGrown = opts.pv * growth;
  if (pvGrown >= opts.fv) { return 0; }
  return round2((opts.fv - pvGrown) * opts.r / (growth - 1));
}

/** Options for year-by-year chart data generation. */
interface ChartDataOptions {
  /** Current patrimony in BRL. */
  pv: number;
  /** Monthly contribution in BRL. */
  monthlyPmt: number;
  /** Monthly rate (decimal). */
  monthlyRate: number;
  /** Current age in years. */
  currentAge: number;
  /** Retirement age in years. */
  retirementAge: number;
}

/**
 * Builds a year-by-year chart of patrimony accumulation.
 *
 * @param opts Chart data options.
 * @returns Array of FireChartPoints.
 */
function buildChartData(opts: ChartDataOptions): FireChartPoint[] {
  const chartData: FireChartPoint[] = [];
  let patrimony = opts.pv;

  for (let age = opts.currentAge; age <= opts.retirementAge; age++) {
    chartData.push({ age, patrimony: round2(patrimony) });
    for (let m = 0; m < 12; m++) {
      patrimony = patrimony * (1 + opts.monthlyRate) + opts.monthlyPmt;
    }
  }

  return chartData;
}

/** Options for building a variant milestone. */
interface VariantMilestoneOptions {
  /** FIRE variant. */
  variant: FireVariant;
  /** Annual expenses. */
  annualExpenses: number;
  /** Current patrimony. */
  pv: number;
  /** Monthly rate. */
  monthlyRate: number;
  /** Number of months to retirement. */
  n: number;
}

/**
 * Builds a FireVariantMilestone for a given variant.
 *
 * @param opts Variant milestone options.
 * @returns FireVariantMilestone for this variant.
 */
function buildVariantMilestone(opts: VariantMilestoneOptions): FireVariantMilestone {
  const requiredPatrimony = round2(opts.annualExpenses * FIRE_SWR_MULTIPLIERS[opts.variant]);
  const requiredMonthlyContribution = calcPmt({
    fv: requiredPatrimony,
    pv: opts.pv,
    r: opts.monthlyRate,
    n: opts.n,
  });
  const projectedGrowth = opts.pv * Math.pow(1 + opts.monthlyRate, opts.n)
    + (opts.n > 0 && opts.monthlyRate > 0
      ? requiredMonthlyContribution * (Math.pow(1 + opts.monthlyRate, opts.n) - 1) / opts.monthlyRate
      : requiredMonthlyContribution * opts.n);
  const isOnTrack = round2(projectedGrowth) >= requiredPatrimony;
  return { variant: opts.variant, requiredPatrimony, requiredMonthlyContribution, isOnTrack };
}

// ─── Main calculation ─────────────────────────────────────────────────────────

/**
 * Calculates the FIRE simulation for all variants.
 *
 * @param form Validated form state.
 * @returns Complete FireResult.
 */
export function calculateFire(form: FireFormState): FireResult {
  const nominalAnnual = form.expectedReturnPct / 100;
  const inflationAnnual = form.ipcaPct / 100;
  const realAnnual = (1 + nominalAnnual) / (1 + inflationAnnual) - 1;
  const monthlyRate = Math.pow(1 + nominalAnnual, 1 / 12) - 1;
  const monthsToRetirement = (form.retirementAge - form.currentAge) * 12;
  const monthlyExpenses = form.monthlyExpenses ?? 0;
  const annualExpenses = monthlyExpenses * 12;
  const pv = form.currentPatrimony;

  const milestoneOpts = FIRE_VARIANTS.map((v) => ({
    variant: v,
    annualExpenses,
    pv,
    monthlyRate,
    n: monthsToRetirement,
  }));

  const allVariants = milestoneOpts.map(buildVariantMilestone);

  const selectedVariant = allVariants.find((m) => m.variant === form.variant)
    ?? allVariants[0]!;

  // Coast FIRE: lump sum needed today to reach FIRE number by retirement
  const fireNumber = round2(annualExpenses * FIRE_SWR_MULTIPLIERS.fire);
  const coastNumber = monthsToRetirement > 0
    ? round2(fireNumber / Math.pow(1 + nominalAnnual, monthsToRetirement / 12))
    : fireNumber;

  const projectedPatrimony = round2(
    pv * Math.pow(1 + monthlyRate, monthsToRetirement) +
    (monthsToRetirement > 0 && monthlyRate > 0
      ? selectedVariant.requiredMonthlyContribution
        * (Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate
      : selectedVariant.requiredMonthlyContribution * monthsToRetirement),
  );

  const chartData = buildChartData({
    pv,
    monthlyPmt: selectedVariant.requiredMonthlyContribution,
    monthlyRate,
    currentAge: form.currentAge,
    retirementAge: form.retirementAge,
  });

  return {
    selectedVariant,
    allVariants,
    coastNumber,
    monthsToRetirement,
    chartData,
    realReturnPct: round4(realAnnual * 100),
    projectedPatrimony,
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
 * Rounds a number to 4 decimal places.
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
