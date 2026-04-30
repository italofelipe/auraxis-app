/**
 * Domain model for the Calculadora MEI.
 *
 * Calculates the monthly DAS payment, projects annual revenue, lists
 * available INSS benefits, and compares the DAS cost against PF autonomous
 * taxation (carnê-leão IRPF + INSS autonomous).
 *
 * Regulatory basis (2025):
 *   - Annual limit: R$81,000/year (R$6,750/month).
 *   - DAS 2025 = 5% of minimum wage (R$1,518) for INSS + ISS/ICMS by activity.
 *     Comércio:  INSS R$75.90 + ICMS R$1.00 = R$76.90/month
 *     Serviços:  INSS R$75.90 + ISS  R$5.00 = R$80.90/month
 *     Ambos:     INSS R$75.90 + ICMS R$1.00 + ISS R$5.00 = R$81.90/month
 *   - Benefits eligibility: 12 consecutive DAS payments required.
 *   - PF autonomous comparison:
 *     INSS autônomo: 20% on revenue up to ceiling (R$7,786.02 × 20% = R$1,557.20/month).
 *     IRPF: progressive table on (revenue − INSS autônomo).
 */

/** Year of the MEI regulatory table used in this model. */
export const MEI_TABLE_YEAR = 2025;

/** Annual MEI revenue limit (2025). */
export const MEI_ANNUAL_LIMIT = 81_000;

/** Monthly MEI revenue limit (2025). */
export const MEI_MONTHLY_LIMIT = 6_750;

/** Minimum wage 2025 — basis for DAS INSS component. */
const MIN_WAGE_2025 = 1_518;

/** INSS MEI rate: 5% of minimum wage. */
const MEI_INSS_RATE = 0.05;

/** Computed INSS component for all MEI types. */
const MEI_INSS_COMPONENT = round2(MIN_WAGE_2025 * MEI_INSS_RATE); // R$75.90

// ─── DAS amounts by activity ──────────────────────────────────────────────────

/** Monthly DAS amounts per activity type (2025). */
export const MEI_DAS_BY_ACTIVITY = {
  comercio: round2(MEI_INSS_COMPONENT + 1.0),   // R$76.90
  servicos: round2(MEI_INSS_COMPONENT + 5.0),   // R$80.90
  ambos: round2(MEI_INSS_COMPONENT + 1.0 + 5.0), // R$81.90
} as const;

// ─── INSS autonomous ceiling ──────────────────────────────────────────────────

/** Maximum INSS contribution ceiling for autonomous workers (2025). */
const INSS_AUTONOMOUS_CEILING = 7_786.02;

/** INSS autonomous rate (20% on revenue up to ceiling). */
const INSS_AUTONOMOUS_RATE = 0.2;

/** Maximum monthly INSS for autonomous worker. */
const INSS_AUTONOMOUS_MAX = round2(INSS_AUTONOMOUS_CEILING * INSS_AUTONOMOUS_RATE); // R$1,557.20

// ─── IRPF table 2025 (monthly) ────────────────────────────────────────────────

interface IrpfBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

/**
 * Monthly IRPF brackets (2025 — same table as br-tax-tables for consistency).
 */
const IRPF_BRACKETS: readonly IrpfBracket[] = [
  { upTo: 2_259.2, rate: 0, deduction: 0 },
  { upTo: 2_826.65, rate: 0.075, deduction: 169.44 },
  { upTo: 3_751.05, rate: 0.15, deduction: 381.44 },
  { upTo: 4_664.68, rate: 0.225, deduction: 662.77 },
  { upTo: Infinity, rate: 0.275, deduction: 896.0 },
];

/**
 * Calculates monthly IRPF using progressive table.
 *
 * @param taxableBase Taxable income after deductions.
 * @returns IRPF amount (never negative).
 */
function calcIrpf(taxableBase: number): number {
  if (taxableBase <= 0) { return 0; }
  for (const { upTo, rate, deduction } of IRPF_BRACKETS) {
    if (taxableBase <= upTo) {
      return round2(Math.max(0, taxableBase * rate - deduction));
    }
  }
  return 0;
}

// ─── Activity types ───────────────────────────────────────────────────────────

/**
 * MEI activity types determining the DAS composition.
 */
export const MEI_ACTIVITY_TYPES = ["comercio", "servicos", "ambos"] as const;

/** Union type for MEI activity. */
export type MeiActivity = (typeof MEI_ACTIVITY_TYPES)[number];

// ─── Current situation types ──────────────────────────────────────────────────

/**
 * The user's current tax situation for comparison purposes.
 */
export type MeiCurrentSituation =
  | "pf_carne_leao"
  | "pf_autonomo_sem_registro"
  | "already_mei";

// ─── Benefits ─────────────────────────────────────────────────────────────────

/**
 * INSS benefits available to MEI after 12 consecutive DAS payments.
 * Note: aposentadoria is only by age — not by contribution time.
 */
export const MEI_BENEFITS = [
  "aposentadoria_por_idade",
  "auxilio_doenca",
  "salario_maternidade",
  "pensao_por_morte",
  "auxilio_reclusao",
] as const;

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the MEI calculator. */
export interface MeiFormState extends Record<string, unknown> {
  /** MEI activity type (determines DAS composition). */
  activity: MeiActivity;
  /** Monthly revenue in BRL. */
  monthlyRevenue: number | null;
  /** User's current tax situation (for comparison). */
  currentSituation: MeiCurrentSituation;
}

/**
 * Returns the default initial form state for the MEI calculator.
 *
 * @returns Default MeiFormState.
 */
export function createDefaultMeiFormState(): MeiFormState {
  return {
    activity: "servicos",
    monthlyRevenue: null,
    currentSituation: "pf_autonomo_sem_registro",
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** A validation error for the MEI form. */
export interface MeiValidationError {
  field: keyof MeiFormState;
  messageKey: string;
}

/**
 * Validates the MEI form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateMeiForm(form: MeiFormState): MeiValidationError[] {
  const errors: MeiValidationError[] = [];

  if (form.monthlyRevenue === null || form.monthlyRevenue <= 0) {
    errors.push({ field: "monthlyRevenue", messageKey: "errors.revenueRequired" });
  }

  return errors;
}

// ─── Calculation result ───────────────────────────────────────────────────────

/** PF autonomous taxation comparison. */
export interface MeiComparisonPF {
  /** Monthly INSS as autonomous worker (20% of revenue, capped). */
  inssMonthly: number;
  /** Monthly IRPF on revenue after INSS deduction. */
  irpfMonthly: number;
  /** Total monthly PF tax burden (INSS + IRPF). */
  totalTaxPF: number;
}

/** Result of the MEI calculation. */
export interface MeiResult {
  /** Monthly DAS amount for the selected activity. */
  dasMontly: number;
  /** Annual DAS cost (dasMontly × 12). */
  dasAnnual: number;
  /** True when monthly revenue is within the MEI monthly limit. */
  isWithinLimit: boolean;
  /** Projected annual revenue (monthlyRevenue × 12). */
  annualRevenueProjection: number;
  /** True when projected annual revenue exceeds MEI_ANNUAL_LIMIT. */
  limitWarning: boolean;
  /** List of INSS benefit names available after 12 consecutive payments. */
  benefitsAvailable: string[];
  /** PF autonomous tax comparison. */
  comparisonPF: MeiComparisonPF;
  /** Monthly savings: dasMontly vs totalTaxPF (positive = MEI is cheaper). */
  savingsVsPF: number;
  /** True when MEI DAS is lower than PF total tax. */
  meiIsMoreAdvantageous: boolean;
  /** Tax table reference year. */
  tableYear: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates MEI DAS, benefits, and compares with PF autonomous taxation.
 *
 * @param form Validated form state.
 * @returns Complete MEI calculation result.
 */
export function calculateMei(form: MeiFormState): MeiResult {
  const revenue = form.monthlyRevenue ?? 0;

  // ── DAS ───────────────────────────────────────────────────────────────────
  const dasMontly = MEI_DAS_BY_ACTIVITY[form.activity];
  const dasAnnual = round2(dasMontly * 12);

  // ── Revenue limits ─────────────────────────────────────────────────────────
  const isWithinLimit = revenue <= MEI_MONTHLY_LIMIT;
  const annualRevenueProjection = round2(revenue * 12);
  const limitWarning = annualRevenueProjection > MEI_ANNUAL_LIMIT;

  // ── Benefits ───────────────────────────────────────────────────────────────
  const benefitsAvailable = [...MEI_BENEFITS];

  // ── PF autonomous comparison ───────────────────────────────────────────────
  // INSS: 20% of revenue up to ceiling
  const inssMonthly = round2(Math.min(revenue * INSS_AUTONOMOUS_RATE, INSS_AUTONOMOUS_MAX));
  // IRPF: apply progressive table on (revenue - INSS)
  const irpfBase = revenue - inssMonthly;
  const irpfMonthly = calcIrpf(irpfBase);
  const totalTaxPF = round2(inssMonthly + irpfMonthly);

  // ── Savings comparison ─────────────────────────────────────────────────────
  const savingsVsPF = round2(totalTaxPF - dasMontly);
  const meiIsMoreAdvantageous = dasMontly < totalTaxPF;

  return {
    dasMontly,
    dasAnnual,
    isWithinLimit,
    annualRevenueProjection,
    limitWarning,
    benefitsAvailable,
    comparisonPF: { inssMonthly, irpfMonthly, totalTaxPF },
    savingsVsPF,
    meiIsMoreAdvantageous,
    tableYear: MEI_TABLE_YEAR,
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
