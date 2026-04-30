/**
 * Domain model for the Aluguel vs Compra (Rent vs Buy) calculator.
 *
 * Compares the financial outcome of buying versus renting a property over
 * a user-defined analysis horizon, accounting for opportunity cost of the
 * down payment, mortgage payments, property appreciation, and rent inflation.
 *
 * Disclaimer: Simulação educacional com premissas simplificadas.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single year data point for the net worth comparison chart.
 */
export interface AluguelVsCompraYearPoint {
  /** Year of the analysis (1-based). */
  year: number;
  /** Net worth under the buy scenario at this year. */
  buyNetWorth: number;
  /** Net worth under the rent scenario at this year. */
  rentNetWorth: number;
}

/**
 * Form state for the Aluguel vs Compra calculator.
 */
export interface AluguelVsCompraFormState extends Record<string, unknown> {
  /** Property value in BRL. */
  propertyValue: number | null;
  /** Monthly rent in BRL. */
  monthlyRent: number | null;
  /** Available down payment in BRL. */
  downPaymentAvailable: number | null;
  /** Annual investment return percentage for the rent scenario (default: 10.0). */
  annualInvestmentReturnPct: number;
  /** Annual property valorization percentage (default: 5.0). */
  annualPropertyValorizationPct: number;
  /** Analysis horizon in years (default: 20). */
  analysisYears: number;
  /** Transaction costs as percentage of property value (default: 9.0). */
  transactionCostsPct: number;
  /** Monthly IPTU + condo fees in BRL (default: 0). */
  monthlyIptuCondominio: number;
  /** Annual IPCA inflation percentage for rent correction (default: 4.5). */
  annualIpcaPct: number;
  /** Annual mortgage interest rate percentage (default: 12.0). */
  mortgageAnnualRatePct: number;
}

/**
 * Aggregated result for the Aluguel vs Compra calculator.
 */
export interface AluguelVsCompraResult {
  /** Total rent paid over the analysis period (IPCA-adjusted). */
  totalRentCost: number;
  /**
   * Total buy-side cost over the period:
   * transaction costs + total mortgage payments + IPTU/condo + maintenance.
   */
  totalBuyCost: number;
  /**
   * Opportunity cost: what the down payment grows to if invested instead.
   * Equals downPaymentAvailable × (1 + investmentReturn)^analysisYears.
   */
  opportunityCost: number;
  /** First year at which buyNetWorth exceeds rentNetWorth; null if buy never wins. */
  breakEvenYear: number | null;
  /** True when buyNetWorth > rentNetWorth at the end of the analysis period. */
  buyIsBetter: boolean;
  /** Net worth under buy scenario at end of period (propertyValue_t − remainingBalance_t). */
  finalBuyNetWorth: number;
  /** Net worth under rent scenario at end of period (invested capital). */
  finalRentNetWorth: number;
  /** Chart data points for buy vs rent net worth over each year. */
  chartData: AluguelVsCompraYearPoint[];
  /** Property value at the end of the analysis period after valorization. */
  propertyValueAtEnd: number;
  /** Down payment value if invested over the full period. */
  downPaymentInvested: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validation error descriptor.
 */
export interface AluguelVsCompraValidationError {
  /** Form field that failed validation. */
  field: keyof AluguelVsCompraFormState;
  /** i18n message key (relative to aluguelVsCompra namespace). */
  messageKey: string;
}

/**
 * Validates the Aluguel vs Compra form state.
 *
 * @param form Current form state.
 * @returns Array of validation errors (empty when valid).
 */
export function validateAluguelVsCompraForm(
  form: AluguelVsCompraFormState,
): AluguelVsCompraValidationError[] {
  const errors: AluguelVsCompraValidationError[] = [];

  if (form.propertyValue === null || form.propertyValue <= 0) {
    errors.push({ field: "propertyValue", messageKey: "errors.propertyValueRequired" });
  }

  if (form.monthlyRent === null || form.monthlyRent <= 0) {
    errors.push({ field: "monthlyRent", messageKey: "errors.monthlyRentRequired" });
  }

  if (form.downPaymentAvailable === null || form.downPaymentAvailable < 0) {
    errors.push({ field: "downPaymentAvailable", messageKey: "errors.downPaymentRequired" });
  }

  return errors;
}

// ─── Default state ────────────────────────────────────────────────────────────

/**
 * Creates the default form state for the Aluguel vs Compra calculator.
 *
 * @returns Fresh form state with sensible defaults.
 */
export function createDefaultAluguelVsCompraFormState(): AluguelVsCompraFormState {
  return {
    propertyValue: null,
    monthlyRent: null,
    downPaymentAvailable: null,
    annualInvestmentReturnPct: 10.0,
    annualPropertyValorizationPct: 5.0,
    analysisYears: 20,
    transactionCostsPct: 9.0,
    monthlyIptuCondominio: 0,
    annualIpcaPct: 4.5,
    mortgageAnnualRatePct: 12.0,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Calculates the PRICE constant monthly mortgage payment.
 *
 * @param loanAmount Principal to finance.
 * @param monthlyRate Monthly interest rate (decimal).
 * @param totalMonths Total term in months.
 * @returns Monthly PMT, or 0 when loanAmount ≤ 0.
 */
function calcMortgagePmt(
  loanAmount: number,
  monthlyRate: number,
  totalMonths: number,
): number {
  if (loanAmount <= 0) { return 0; }
  if (monthlyRate === 0) { return loanAmount / totalMonths; }
  return loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths));
}

/**
 * Options for remaining balance calculation.
 */
interface RemainingBalanceOpts {
  /** Initial principal. */
  loanAmount: number;
  /** Monthly interest rate (decimal). */
  monthlyRate: number;
  /** Monthly payment. */
  pmt: number;
  /** Number of payments already made. */
  paidMonths: number;
}

/**
 * Returns the outstanding mortgage balance after a number of payments.
 *
 * Uses the standard remaining balance formula:
 *   B_k = PV × (1+r)^k − PMT × ((1+r)^k − 1) / r
 *
 * @param opts Remaining balance calculation options.
 * @returns Remaining balance (≥ 0).
 */
function remainingBalance(opts: RemainingBalanceOpts): number {
  const { loanAmount, monthlyRate, pmt, paidMonths } = opts;
  if (loanAmount <= 0) { return 0; }
  if (monthlyRate === 0) {
    return Math.max(0, loanAmount - pmt * paidMonths);
  }
  const balance =
    loanAmount * Math.pow(1 + monthlyRate, paidMonths) -
    pmt * (Math.pow(1 + monthlyRate, paidMonths) - 1) / monthlyRate;
  return Math.max(0, balance);
}

/**
 * Computes rent invested capital at end of a single year, including monthly savings.
 *
 * @param capital Starting invested capital for the year.
 * @param monthlyInvestRate Monthly investment rate (decimal).
 * @param monthlySaving Difference (buyCost − rentCost) per month; invest when positive.
 * @returns Updated invested capital at end of year.
 */
function growRentCapital(
  capital: number,
  monthlyInvestRate: number,
  monthlySaving: number,
): number {
  let updated = capital * Math.pow(1 + monthlyInvestRate, 12);
  if (monthlySaving > 0) {
    for (let m = 1; m <= 12; m++) {
      updated += monthlySaving * Math.pow(1 + monthlyInvestRate, 12 - m);
    }
  }
  return updated;
}

/**
 * Pre-computed scenario constants extracted from the form.
 */
interface ScenarioConsts {
  propertyValue: number;
  monthlyRent: number;
  downPayment: number;
  annualVal: number;
  annualIpca: number;
  monthlyInvestRate: number;
  transactionCosts: number;
  loanAmount: number;
  totalMortgageMonths: number;
  monthlyPmt: number;
  mortgageMonthlyRate: number;
  yearlyIptuCondo: number;
  annualMaintenance: number;
}

/**
 * Extracts and pre-computes all scenario constants from the validated form.
 *
 * @param form Validated form state.
 * @returns Pre-computed constants for the simulation loop.
 */
function buildScenarioConsts(form: AluguelVsCompraFormState): ScenarioConsts {
  const propertyValue = form.propertyValue as number;
  const downPayment = form.downPaymentAvailable as number;
  const n = form.analysisYears;

  const annualInvest = form.annualInvestmentReturnPct / 100;
  const mortgageMonthlyRate = Math.pow(1 + form.mortgageAnnualRatePct / 100, 1 / 12) - 1;
  const loanAmount = Math.max(0, propertyValue - downPayment);
  const totalMortgageMonths = n * 12;

  return {
    propertyValue,
    monthlyRent: form.monthlyRent as number,
    downPayment,
    annualVal: form.annualPropertyValorizationPct / 100,
    annualIpca: form.annualIpcaPct / 100,
    monthlyInvestRate: Math.pow(1 + annualInvest, 1 / 12) - 1,
    transactionCosts: propertyValue * (form.transactionCostsPct / 100),
    loanAmount,
    totalMortgageMonths,
    monthlyPmt: calcMortgagePmt(loanAmount, mortgageMonthlyRate, totalMortgageMonths),
    mortgageMonthlyRate,
    yearlyIptuCondo: form.monthlyIptuCondominio * 12,
    annualMaintenance: propertyValue * 0.005,
  };
}

// ─── Main calculation ─────────────────────────────────────────────────────────

/**
 * Accumulation state used while iterating over years.
 */
interface AccumulationState {
  totalRentCost: number;
  totalBuyCost: number;
  rentInvestedCapital: number;
  breakEvenYear: number | null;
  chartData: AluguelVsCompraYearPoint[];
}

/**
 * Processes a single year in the simulation loop, mutating the accumulation state.
 *
 * @param year Current simulation year (1-based).
 * @param c Pre-computed scenario constants.
 * @param state Mutable accumulation state.
 */
function processSimulationYear(
  year: number,
  c: ScenarioConsts,
  state: AccumulationState,
): void {
  const propValueT = c.propertyValue * Math.pow(1 + c.annualVal, year);
  const paidMonths = Math.min(year * 12, c.totalMortgageMonths);
  const remaining = remainingBalance({
    loanAmount: c.loanAmount,
    monthlyRate: c.mortgageMonthlyRate,
    pmt: c.monthlyPmt,
    paidMonths,
  });
  const buyNetWorth = propValueT - remaining;
  const yearlyBuyCost = c.monthlyPmt * 12 + c.yearlyIptuCondo + c.annualMaintenance;
  state.totalBuyCost += yearlyBuyCost;

  const yearlyRent = c.monthlyRent * 12 * Math.pow(1 + c.annualIpca, year - 1);
  state.totalRentCost += yearlyRent;

  const monthlyRentThisYear = c.monthlyRent * Math.pow(1 + c.annualIpca, year - 1);
  const monthlySaving = yearlyBuyCost / 12 - monthlyRentThisYear;
  state.rentInvestedCapital = growRentCapital(state.rentInvestedCapital, c.monthlyInvestRate, monthlySaving);

  const rentNetWorth = state.rentInvestedCapital;
  state.chartData.push({ year, buyNetWorth, rentNetWorth });

  if (state.breakEvenYear === null && buyNetWorth > rentNetWorth) {
    state.breakEvenYear = year;
  }
}

/**
 * Calculates the Aluguel vs Compra comparison over the analysis horizon.
 *
 * Assumes the form has already been validated (see validateAluguelVsCompraForm).
 *
 * @param form Validated form state.
 * @returns Complete comparison result including chart data and break-even year.
 */
export function calculateAluguelVsCompra(
  form: AluguelVsCompraFormState,
): AluguelVsCompraResult {
  const c = buildScenarioConsts(form);
  const n = form.analysisYears;

  const state: AccumulationState = {
    totalRentCost: 0,
    totalBuyCost: c.transactionCosts,
    rentInvestedCapital: c.downPayment,
    breakEvenYear: null,
    chartData: [],
  };

  for (let year = 1; year <= n; year++) {
    processSimulationYear(year, c, state);
  }

  const finalBuyNetWorth = state.chartData[n - 1]?.buyNetWorth ?? 0;
  const finalRentNetWorth = state.chartData[n - 1]?.rentNetWorth ?? 0;
  const propertyValueAtEnd = c.propertyValue * Math.pow(1 + c.annualVal, n);
  const downPaymentInvested = c.downPayment * Math.pow(1 + form.annualInvestmentReturnPct / 100, n);

  return {
    totalRentCost: state.totalRentCost,
    totalBuyCost: state.totalBuyCost,
    opportunityCost: downPaymentInvested,
    breakEvenYear: state.breakEvenYear,
    buyIsBetter: finalBuyNetWorth > finalRentNetWorth,
    finalBuyNetWorth,
    finalRentNetWorth,
    chartData: state.chartData,
    propertyValueAtEnd,
    downPaymentInvested,
  };
}
