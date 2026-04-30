/**
 * Domain model for the CLT vs PJ calculator.
 *
 * Compares the real net income between CLT employment and PJ (MEI, Simples
 * Nacional or Lucro Presumido) and determines the break-even invoice.
 *
 * Regulatory basis (2025):
 *   - CLT: INSS progressive table (Portaria MPS/MF nº 3 — Jan 2025),
 *          IRRF progressive table (2025), FGTS 8% (employer cost).
 *   - Simples Nacional Anexo III (services): up to R$180k → 6.0%,
 *     up to R$360k → 11.2%, up to R$720k → 13.5%, up to R$1.44M → 16.0%,
 *     up to R$3.6M → 21.0%.
 *   - Lucro Presumido (services): ~14.53% effective on revenue (IRPJ 15%
 *     on 32% presumed base + CSLL 9% + ISS 3% + PIS 0.65% + COFINS 3%).
 *   - MEI limit: R$81,000/year (R$6,750/month). Fixed DAS ~R$75.90/month.
 *   - Prolabore minimum for PJ/Simples: one minimum wage = R$1,518 (2025).
 *   - Prolabore INSS: 11% on declared prolabore.
 *   - FGTS for CLT: 8% of gross (employer cost, informational).
 */

import {
  BR_TAX_TABLE_YEAR,
  calcInss,
  calcIrrfFromGross,
} from "./br-tax-tables";

export { BR_TAX_TABLE_YEAR };

/** Year of the PJ regulatory table used in this model. */
export const PJ_TABLE_YEAR = 2025;

/** MEI monthly revenue limit (2025). */
export const MEI_MONTHLY_LIMIT = 6750;

/** MEI annual revenue limit (2025). */
export const MEI_ANNUAL_LIMIT = 81_000;

/** MEI fixed monthly DAS for services (2025). */
export const MEI_DAS_SERVICOS = 75.9;

/** Minimum prolabore for PJ (one minimum wage, 2025). */
export const MIN_PROLABORE = 1_518;

/** INSS rate on prolabore (autonomous quota, 2025). */
export const PROLABORE_INSS_RATE = 0.11;

/** Effective tax rate for Lucro Presumido on services revenue. */
export const LUCRO_PRESUMIDO_EFFECTIVE_RATE = 0.1453;

// ─── PJ regimes ───────────────────────────────────────────────────────────────

/**
 * PJ taxation regimes supported by this calculator.
 */
export const PJ_REGIMES = ["mei", "simples", "lucro_presumido"] as const;

/** Union type for the supported PJ regimes. */
export type PjRegime = (typeof PJ_REGIMES)[number];

// ─── Simples Nacional Anexo III brackets (services) ──────────────────────────

interface SimplesNacionalBracket {
  /** Annual revenue ceiling (BRL) for this bracket. */
  upToAnnual: number;
  /** Effective tax rate on revenue. */
  rate: number;
}

/**
 * Simples Nacional Anexo III brackets for service companies (2025).
 * Rate applies to the full monthly revenue when annual revenue falls in bracket.
 */
const SIMPLES_BRACKETS: readonly SimplesNacionalBracket[] = [
  { upToAnnual: 180_000, rate: 0.06 },
  { upToAnnual: 360_000, rate: 0.112 },
  { upToAnnual: 720_000, rate: 0.135 },
  { upToAnnual: 1_440_000, rate: 0.16 },
  { upToAnnual: 3_600_000, rate: 0.21 },
];

/**
 * Returns the Simples Nacional Anexo III rate for a given monthly invoice.
 * Assumes annual revenue = monthlyInvoice × 12.
 *
 * @param monthlyInvoice Monthly invoice in BRL.
 * @returns Applicable Simples Nacional rate.
 */
export function getSimplasRate(monthlyInvoice: number): number {
  const annualRevenue = monthlyInvoice * 12;
  for (const { upToAnnual, rate } of SIMPLES_BRACKETS) {
    if (annualRevenue <= upToAnnual) {
      return rate;
    }
  }
  // Above R$3.6M/year: not eligible for Simples; return last bracket rate
  return SIMPLES_BRACKETS[SIMPLES_BRACKETS.length - 1]!.rate;
}

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the CLT vs PJ calculator. */
export interface CltVsPjFormState extends Record<string, unknown> {
  // CLT fields
  /** Monthly gross salary in BRL (CLT). */
  cltGrossSalary: number | null;
  /** Monthly transportation voucher value (VT — benefit to worker). */
  cltVT: number;
  /** Monthly meal voucher value (VR — benefit to worker). */
  cltVR: number;
  /** Monthly employer-paid health plan value (benefit to worker). */
  cltHealthPlan: number;
  /** Annual PLR (profit sharing) divided by 12 for monthly comparison. */
  cltPLR: number;
  /** Number of IRRF-eligible dependents. */
  dependents: number;

  // PJ fields
  /** Monthly invoice amount in BRL (PJ gross revenue). */
  pjMonthlyInvoice: number | null;
  /** PJ taxation regime. */
  pjRegime: PjRegime;
  /** Monthly fixed operating costs (accountant, software, etc.). */
  pjFixedCosts: number;
  /** Monthly personal health plan cost (not employer-paid). */
  pjHealthPlan: number;
  /** Monthly personal pension contribution (previdência privada/PGBL). */
  pjPensao: number;
}

/**
 * Returns the default initial form state for the CLT vs PJ calculator.
 *
 * @returns Default CltVsPjFormState.
 */
export function createDefaultCltVsPjFormState(): CltVsPjFormState {
  return {
    cltGrossSalary: null,
    cltVT: 0,
    cltVR: 0,
    cltHealthPlan: 0,
    cltPLR: 0,
    dependents: 0,
    pjMonthlyInvoice: null,
    pjRegime: "simples",
    pjFixedCosts: 0,
    pjHealthPlan: 0,
    pjPensao: 0,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** A validation error for the CLT vs PJ form. */
export interface CltVsPjValidationError {
  field: keyof CltVsPjFormState;
  messageKey: string;
}

/**
 * Validates the CLT vs PJ form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateCltVsPjForm(
  form: CltVsPjFormState,
): CltVsPjValidationError[] {
  const errors: CltVsPjValidationError[] = [];

  if (form.cltGrossSalary === null || form.cltGrossSalary <= 0) {
    errors.push({
      field: "cltGrossSalary",
      messageKey: "errors.cltGrossSalaryRequired",
    });
  }
  if (form.pjMonthlyInvoice === null || form.pjMonthlyInvoice <= 0) {
    errors.push({
      field: "pjMonthlyInvoice",
      messageKey: "errors.pjMonthlyInvoiceRequired",
    });
  }
  if (
    form.pjRegime === "mei" &&
    form.pjMonthlyInvoice !== null &&
    form.pjMonthlyInvoice > MEI_MONTHLY_LIMIT
  ) {
    errors.push({
      field: "pjMonthlyInvoice",
      messageKey: "errors.meiLimitExceeded",
    });
  }

  return errors;
}

// ─── Calculation result ───────────────────────────────────────────────────────

/** Result of the CLT vs PJ comparison. */
export interface CltVsPjResult {
  /** Net monthly income from CLT (after INSS + IRRF, plus benefit values). */
  cltNetMonthly: number;
  /** Total employer cost for CLT (gross + FGTS 8% + INSS employer 20%). */
  cltEmployerTotalCost: number;
  /** Net monthly income from PJ (after taxes, fixed costs, benefits, INSS on prolabore). */
  pjNetMonthly: number;
  /** Total tax amount on PJ invoice. */
  pjTaxAmount: number;
  /** INSS on minimum prolabore (PJ owner contribution). */
  pjInssProLabore: number;
  /**
   * The monthly invoice value at which PJ net equals CLT net.
   * Only meaningful for Simples and Lucro Presumido (proportional taxes).
   */
  breakEvenInvoice: number;
  /** True when PJ net monthly income exceeds CLT net monthly income. */
  pjIsMoreProfitable: boolean;
  /** Absolute difference between PJ and CLT net monthly income. */
  monthlyDifference: number;
  /** Active PJ regime. */
  regime: PjRegime;
  /** Tax table reference year. */
  tableYear: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/** Intermediate PJ calculation result used inside the main function. */
interface PjCalcResult {
  pjTaxAmount: number;
  pjNetMonthly: number;
  breakEvenInvoice: number;
}

/** Parameters for the per-regime PJ calculation. */
interface PjRegimeParams {
  /** PJ taxation regime. */
  regime: PjRegime;
  /** Monthly invoice in BRL. */
  invoice: number;
  /** Fixed monthly PJ costs (accounting, prolabore INSS, health plan, etc.). */
  commonCosts: number;
  /** CLT net monthly income used for break-even calculation. */
  cltNetMonthly: number;
}

/**
 * Calculates PJ net income, taxes, and break-even for the selected regime.
 *
 * @param params Regime calculation parameters.
 * @returns Tax amount, net income, and break-even invoice.
 */
function calcPjByRegime(params: PjRegimeParams): PjCalcResult {
  const { regime, invoice, commonCosts, cltNetMonthly } = params;
  if (regime === "mei") {
    return {
      pjTaxAmount: MEI_DAS_SERVICOS,
      pjNetMonthly: round2(invoice - MEI_DAS_SERVICOS - commonCosts),
      breakEvenInvoice: round2(cltNetMonthly + MEI_DAS_SERVICOS + commonCosts),
    };
  }
  const taxRate =
    regime === "simples" ? getSimplasRate(invoice) : LUCRO_PRESUMIDO_EFFECTIVE_RATE;
  return {
    pjTaxAmount: round2(invoice * taxRate),
    pjNetMonthly: round2(invoice * (1 - taxRate) - commonCosts),
    // Solve: invoice * (1 - taxRate) - commonCosts = cltNetMonthly
    // → invoice = (cltNetMonthly + commonCosts) / (1 - taxRate)
    breakEvenInvoice: round2((cltNetMonthly + commonCosts) / (1 - taxRate)),
  };
}

/**
 * Compares CLT net income with PJ net income and computes break-even.
 *
 * CLT net = gross - INSS - IRRF + VT + VR + healthPlan + PLR/12
 * (Benefits are included because they represent real income components.)
 *
 * @param form Validated form state.
 * @returns Complete CLT vs PJ comparison result.
 */
export function calculateCltVsPj(form: CltVsPjFormState): CltVsPjResult {
  const gross = form.cltGrossSalary ?? 0;
  const invoice = form.pjMonthlyInvoice ?? 0;

  // ── CLT ───────────────────────────────────────────────────────────────────
  const cltInss = calcInss(gross);
  const cltIrrf = calcIrrfFromGross(gross, cltInss, form.dependents);
  const cltNetMonthly = round2(
    gross - cltInss - cltIrrf + form.cltVT + form.cltVR + form.cltHealthPlan + form.cltPLR / 12,
  );
  const cltEmployerTotalCost = round2(gross * (1 + 0.08 + 0.2));

  // ── PJ ────────────────────────────────────────────────────────────────────
  const pjInssProLabore = round2(MIN_PROLABORE * PROLABORE_INSS_RATE);
  const pjCommonCosts = form.pjFixedCosts + form.pjHealthPlan + form.pjPensao + pjInssProLabore;
  const { pjTaxAmount, pjNetMonthly, breakEvenInvoice } = calcPjByRegime({
    regime: form.pjRegime,
    invoice,
    commonCosts: pjCommonCosts,
    cltNetMonthly,
  });

  return {
    cltNetMonthly,
    cltEmployerTotalCost,
    pjNetMonthly,
    pjTaxAmount,
    pjInssProLabore,
    breakEvenInvoice,
    pjIsMoreProfitable: pjNetMonthly > cltNetMonthly,
    monthlyDifference: round2(Math.abs(pjNetMonthly - cltNetMonthly)),
    regime: form.pjRegime,
    tableYear: Math.max(BR_TAX_TABLE_YEAR, PJ_TABLE_YEAR),
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
