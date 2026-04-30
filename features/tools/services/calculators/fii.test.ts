import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import {
  DEFAULT_CDI_RATE_PCT,
  DEFAULT_HISTORY_MONTHS,
  calculateFii,
  createDefaultFiiFormState,
  validateFiiForm,
  type FiiFormState,
} from "./fii";
import type { BrapiFiiQuote } from "@/features/wallet/brapi-contracts";

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Builds a mock FII quote with specified dividends.
 *
 * @param price - Current market price.
 * @param dividends - Dividend entries.
 * @returns Mock BrapiFiiQuote.
 */
function buildQuote(
  price: number,
  dividends: { paymentDate: string; adjustedValue: number; type?: string }[],
): BrapiFiiQuote {
  return {
    ticker: "MXRF11",
    shortName: "MAXI RENDA",
    price,
    changePercent: 0.2,
    currency: "BRL",
    dividends: dividends.map((d) => ({
      paymentDate: d.paymentDate,
      adjustedValue: d.adjustedValue,
      type: d.type ?? "Rendimento",
    })),
    lastDividend: null,
  };
}

/**
 * Returns a date string N months ago from today in YYYY-MM-DD format.
 *
 * @param n - Number of months to go back.
 * @returns ISO date string.
 */
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

// ─── createDefaultFiiFormState ────────────────────────────────────────────────

describe("createDefaultFiiFormState", () => {
  it("returns empty ticker", () => {
    expect(createDefaultFiiFormState().ticker).toBe("");
  });

  it("returns shares as null", () => {
    expect(createDefaultFiiFormState().shares).toBeNull();
  });

  it("returns avgPurchasePrice as null", () => {
    expect(createDefaultFiiFormState().avgPurchasePrice).toBeNull();
  });

  it("returns default CDI rate", () => {
    expect(createDefaultFiiFormState().cdiRatePct).toBe(DEFAULT_CDI_RATE_PCT);
  });

  it("returns default history months", () => {
    expect(createDefaultFiiFormState().historyMonths).toBe(DEFAULT_HISTORY_MONTHS);
  });
});

// ─── validateFiiForm ──────────────────────────────────────────────────────────

describe("validateFiiForm", () => {
  it("returns no errors for a valid form", () => {
    const form: FiiFormState = {
      ticker: "MXRF11",
      shares: 100,
      avgPurchasePrice: 10.50,
      cdiRatePct: 10.65,
      historyMonths: 12,
    };
    expect(validateFiiForm(form)).toHaveLength(0);
  });

  it("returns error when ticker is empty", () => {
    const form = { ...createDefaultFiiFormState() };
    const errors = validateFiiForm(form);
    expect(errors.some((e) => e.field === "ticker")).toBe(true);
  });

  it("returns error when ticker has fewer than 4 characters", () => {
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXR",
    };
    const errors = validateFiiForm(form);
    expect(errors.some((e) => e.field === "ticker")).toBe(true);
  });

  it("returns no error for a 4-character ticker", () => {
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF",
    };
    expect(validateFiiForm(form)).toHaveLength(0);
  });

  it("returns error when historyMonths is 0", () => {
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF11",
      historyMonths: 0,
    };
    const errors = validateFiiForm(form);
    expect(errors.some((e) => e.field === "historyMonths")).toBe(true);
  });

  it("returns error when historyMonths exceeds 24", () => {
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF11",
      historyMonths: 25,
    };
    const errors = validateFiiForm(form);
    expect(errors.some((e) => e.field === "historyMonths")).toBe(true);
  });

  it("accepts historyMonths of 1", () => {
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF11",
      historyMonths: 1,
    };
    expect(validateFiiForm(form)).toHaveLength(0);
  });

  it("accepts historyMonths of 24", () => {
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF11",
      historyMonths: 24,
    };
    expect(validateFiiForm(form)).toHaveLength(0);
  });
});

// ─── calculateFii — dividend filtering ───────────────────────────────────────

describe("calculateFii — dividend filtering", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-03-01"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("filters dividends to the last historyMonths months", () => {
    const quote = buildQuote(10.50, [
      { paymentDate: "2025-02-15", adjustedValue: 0.09 },  // ~1 month ago
      { paymentDate: "2025-01-15", adjustedValue: 0.09 },  // ~2 months ago
      { paymentDate: "2024-03-15", adjustedValue: 0.09 },  // ~12 months ago
      { paymentDate: "2024-01-15", adjustedValue: 0.09 },  // ~14 months ago — excluded with 12m
    ]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF11",
      historyMonths: 12,
    };
    const result = calculateFii(form, quote);
    // The entry from 14 months ago should be excluded
    expect(result.dividendCount).toBe(3);
  });

  it("returns dividendCount 0 when no dividends in period", () => {
    const quote = buildQuote(10.50, [
      { paymentDate: "2020-01-15", adjustedValue: 0.09 },  // very old
    ]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(),
      ticker: "MXRF11",
      historyMonths: 12,
    };
    const result = calculateFii(form, quote);
    expect(result.dividendCount).toBe(0);
  });
});

// ─── calculateFii — yield computations ───────────────────────────────────────

describe("calculateFii — yield computations", () => {
  it("computes avgDividend12m as the average of filtered dividends", () => {
    const recentDate = monthsAgo(1);
    const quote = buildQuote(10.00, [
      { paymentDate: recentDate, adjustedValue: 0.10 },
      { paymentDate: monthsAgo(2), adjustedValue: 0.08 },
    ]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11", historyMonths: 12 };
    const result = calculateFii(form, quote);
    expect(result.avgDividend12m).toBeCloseTo(0.09, 5);
  });

  it("computes dividendYield as annualized percentage", () => {
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.10 }]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11" };
    const result = calculateFii(form, quote);
    // DY = (0.10 * 12 / 10.00) * 100 = 12%
    expect(result.dividendYield).toBeCloseTo(12, 2);
  });

  it("computes yieldOnCost when avgPurchasePrice is provided", () => {
    const quote = buildQuote(12.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.10 }]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(), ticker: "MXRF11", avgPurchasePrice: 10.00,
    };
    const result = calculateFii(form, quote);
    // YoC = (0.10 * 12 / 10.00) * 100 = 12%
    expect(result.yieldOnCost).toBeCloseTo(12, 2);
  });

  it("returns yieldOnCost as null when avgPurchasePrice is null", () => {
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.10 }]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(), ticker: "MXRF11", avgPurchasePrice: null,
    };
    expect(calculateFii(form, quote).yieldOnCost).toBeNull();
  });

  it("returns dividendYield 0 when currentPrice is 0", () => {
    const quote = buildQuote(0, [{ paymentDate: monthsAgo(1), adjustedValue: 0.09 }]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11" };
    expect(calculateFii(form, quote).dividendYield).toBe(0);
  });
});

// ─── calculateFii — income and CDI ───────────────────────────────────────────

describe("calculateFii — income and CDI", () => {
  it("computes monthly and annual income when shares > 0", () => {
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.09 }]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11", shares: 100 };
    const result = calculateFii(form, quote);
    expect(result.monthlyIncome).toBeCloseTo(9.00, 4);
    expect(result.annualIncome).toBeCloseTo(108.00, 4);
  });

  it("returns monthlyIncome and annualIncome as null when shares is null", () => {
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.09 }]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11", shares: null };
    const result = calculateFii(form, quote);
    expect(result.monthlyIncome).toBeNull();
    expect(result.annualIncome).toBeNull();
  });

  it("computes vsCdiPremium as dividendYield minus cdiRatePct", () => {
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.10 }]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(), ticker: "MXRF11", cdiRatePct: 10.65,
    };
    const result = calculateFii(form, quote);
    expect(result.vsCdiPremium).toBeCloseTo(result.dividendYield - 10.65, 5);
  });

  it("sets isAboveCdi true when dividendYield > cdiRatePct", () => {
    // DY = (0.12 * 12 / 10) * 100 = 14.4% > 10.65%
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.12 }]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(), ticker: "MXRF11", cdiRatePct: 10.65,
    };
    expect(calculateFii(form, quote).isAboveCdi).toBe(true);
  });

  it("sets isAboveCdi false when dividendYield < cdiRatePct", () => {
    // DY = (0.07 * 12 / 10) * 100 = 8.4% < 10.65%
    const quote = buildQuote(10.00, [{ paymentDate: monthsAgo(1), adjustedValue: 0.07 }]);
    const form: FiiFormState = {
      ...createDefaultFiiFormState(), ticker: "MXRF11", cdiRatePct: 10.65,
    };
    expect(calculateFii(form, quote).isAboveCdi).toBe(false);
  });

  it("returns avgDividend12m 0 and all nulls when no dividends in period", () => {
    const quote = buildQuote(10.00, []);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11" };
    const result = calculateFii(form, quote);
    expect(result.avgDividend12m).toBe(0);
    expect(result.monthlyIncome).toBeNull();
    expect(result.annualIncome).toBeNull();
  });

  it("reports the currentPrice from the quote", () => {
    const quote = buildQuote(11.25, [{ paymentDate: monthsAgo(1), adjustedValue: 0.09 }]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11" };
    expect(calculateFii(form, quote).currentPrice).toBe(11.25);
  });

  it("reports lastDividend as the most recent dividend value", () => {
    const quote = buildQuote(10.00, [
      { paymentDate: monthsAgo(1), adjustedValue: 0.10 },
      { paymentDate: monthsAgo(2), adjustedValue: 0.08 },
    ]);
    const form: FiiFormState = { ...createDefaultFiiFormState(), ticker: "MXRF11" };
    expect(calculateFii(form, quote).lastDividend).toBe(0.10);
  });
});
