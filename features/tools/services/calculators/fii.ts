/**
 * Domain model for the Calculadora de FII (Real Estate Investment Trust) calculator.
 *
 * Computes Dividend Yield (DY), Yield on Cost (YoC) and monthly/annual income
 * from FII dividend history fetched via BRAPI.
 *
 * Calculation basis:
 *   - DY  = (avgDividend12m * 12 / currentPrice) * 100
 *   - YoC = avgPurchasePrice ? (avgDividend12m * 12 / avgPurchasePrice) * 100 : null
 *   - monthlyIncome = shares * avgDividend12m  (if shares > 0)
 *   - annualIncome  = monthlyIncome * 12
 *   - vsCdiPremium  = dividendYield - cdiRatePct
 *
 * Regulatory disclaimer:
 *   Rentabilidade passada não garante rentabilidade futura.
 *   Não constitui recomendação de investimento.
 *   FIIs são investimentos de renda variável (CVM).
 */

import type { BrapiFiiQuote } from "@/features/wallet/brapi-contracts";

/** Default CDI rate in percentage points (Selic approximation). */
export const DEFAULT_CDI_RATE_PCT = 10.65;

/** Default number of months of dividend history to average. */
export const DEFAULT_HISTORY_MONTHS = 12;

/** Form state for the FII calculator. */
export interface FiiFormState extends Record<string, unknown> {
  /** FII ticker symbol (e.g. "MXRF11"). */
  ticker: string;
  /** Number of shares owned. Null when not entered. */
  shares: number | null;
  /** Average purchase price per share. Null if not provided (skips YoC). */
  avgPurchasePrice: number | null;
  /** CDI rate percentage for premium comparison. Default 10.65%. */
  cdiRatePct: number;
  /** Number of months of dividend history to average (1–24). Default 12. */
  historyMonths: number;
}

/** Result of FII dividend yield calculation. */
export interface FiiResult {
  /** Current market price per share. */
  currentPrice: number;
  /** Most recent dividend payment per share. */
  lastDividend: number;
  /** Average dividend per share over the selected history period. */
  avgDividend12m: number;
  /** Annualized Dividend Yield as a percentage (based on avgDividend12m). */
  dividendYield: number;
  /** Yield on Cost percentage (based on avgPurchasePrice, or null if not provided). */
  yieldOnCost: number | null;
  /** Monthly passive income (shares * avgDividend12m, or null if shares not provided). */
  monthlyIncome: number | null;
  /** Annual passive income (monthlyIncome * 12, or null if not applicable). */
  annualIncome: number | null;
  /** Dividend Yield premium over CDI (dividendYield - cdiRatePct). */
  vsCdiPremium: number;
  /** True when dividendYield exceeds cdiRatePct. */
  isAboveCdi: boolean;
  /** Number of dividend records found in the data. */
  dividendCount: number;
}

/** Validation error for the FII form. */
export interface FiiValidationError {
  field: string;
  messageKey: string;
}

/**
 * Creates the default initial state for the FII calculator form.
 *
 * @returns Default FiiFormState.
 */
export const createDefaultFiiFormState = (): FiiFormState => ({
  ticker: "",
  shares: null,
  avgPurchasePrice: null,
  cdiRatePct: DEFAULT_CDI_RATE_PCT,
  historyMonths: DEFAULT_HISTORY_MONTHS,
});

/**
 * Validates the FII calculator form state.
 *
 * @param form - The current form state.
 * @returns Array of validation errors (empty if valid).
 */
export const validateFiiForm = (form: FiiFormState): FiiValidationError[] => {
  const errors: FiiValidationError[] = [];

  if (!form.ticker || form.ticker.trim().length < 4) {
    errors.push({ field: "ticker", messageKey: "errors.tickerRequired" });
  }

  if (form.historyMonths < 1 || form.historyMonths > 24) {
    errors.push({ field: "historyMonths", messageKey: "errors.historyMonthsOutOfRange" });
  }

  return errors;
};

/**
 * Filters dividend entries to the last N months relative to today.
 *
 * @param dividends - All dividend entries sorted by paymentDate descending.
 * @param historyMonths - Number of months to look back.
 * @returns Filtered dividend entries within the period.
 */
const filterDividendsByPeriod = (
  dividends: BrapiFiiQuote["dividends"],
  historyMonths: number,
): BrapiFiiQuote["dividends"] => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - historyMonths);
  return dividends.filter((d) => new Date(d.paymentDate) >= cutoff);
};

/**
 * Computes the average of an array of numbers.
 *
 * @param values - Array of numeric values.
 * @returns Average, or 0 if the array is empty.
 */
const average = (values: number[]): number => {
  if (values.length === 0) { return 0; }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/**
 * Performs the FII Dividend Yield calculation.
 *
 * This is a pure function — it performs no async operations.
 * The caller is responsible for passing the fetched BRAPI quote.
 *
 * @param form - The validated form state.
 * @param quote - The BRAPI FII quote with dividend history.
 * @returns Calculated FII result.
 */
export const calculateFii = (form: FiiFormState, quote: BrapiFiiQuote): FiiResult => {
  const currentPrice = quote.price;
  const filtered = filterDividendsByPeriod(quote.dividends, form.historyMonths);

  const dividendValues = filtered.map((d) => d.adjustedValue);
  const avgDividend = average(dividendValues);
  const lastDividend = dividendValues[0] ?? 0;

  const dividendYield = currentPrice > 0 ? (avgDividend * 12 / currentPrice) * 100 : 0;

  const yieldOnCost = (form.avgPurchasePrice && form.avgPurchasePrice > 0)
    ? (avgDividend * 12 / form.avgPurchasePrice) * 100
    : null;

  const hasShares = form.shares !== null && form.shares > 0;
  const monthlyIncome = hasShares ? (form.shares as number) * avgDividend : null;
  const annualIncome = monthlyIncome !== null ? monthlyIncome * 12 : null;

  const vsCdiPremium = dividendYield - form.cdiRatePct;

  return {
    currentPrice,
    lastDividend,
    avgDividend12m: avgDividend,
    dividendYield,
    yieldOnCost,
    monthlyIncome,
    annualIncome,
    vsCdiPremium,
    isAboveCdi: vsCdiPremium > 0,
    dividendCount: filtered.length,
  };
};
