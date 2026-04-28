/**
 * Domain contracts for BRAPI market data, mirrored from `auraxis-web`
 * (`features/wallet/services/brapi.client.ts` and
 * `features/tools/services/brapi-tools.client.ts`).
 *
 * Names and shapes are aligned with the web client so that future contract
 * generation can replace this file without touching consumers.
 */

export const BRAPI_HISTORICAL_RANGES = [
  "1d",
  "5d",
  "1mo",
  "3mo",
  "6mo",
  "1y",
  "5y",
  "max",
] as const;

export type BrapiHistoricalRange = (typeof BRAPI_HISTORICAL_RANGES)[number];

export interface BrapiTickerSearchResult {
  readonly stock: string;
  readonly name: string;
  readonly close: number | null;
  readonly change: number | null;
  readonly volume: number | null;
  readonly marketCapBasic: number | null;
  readonly logo: string | null;
  readonly sector: string | null;
}

export interface BrapiCurrentQuote {
  readonly ticker: string;
  readonly shortName: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly currency: string;
  readonly logo: string | null;
}

export interface BrapiPricePoint {
  readonly timestamp: number;
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly adjustedClose: number;
}

export interface BrapiHistoricalSeries {
  readonly ticker: string;
  readonly currency: string;
  readonly range: BrapiHistoricalRange;
  readonly points: readonly BrapiPricePoint[];
}

export interface BrapiDividendEntry {
  readonly paymentDate: string;
  readonly adjustedValue: number;
  readonly type: string;
}

export interface BrapiFiiQuote {
  readonly ticker: string;
  readonly shortName: string;
  readonly price: number;
  readonly changePercent: number;
  readonly currency: string;
  readonly dividends: readonly BrapiDividendEntry[];
  readonly lastDividend: BrapiDividendEntry | null;
}

export interface BrapiCurrencyQuote {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly name: string;
  readonly bid: number;
  readonly ask: number;
  readonly high: number;
  readonly low: number;
  readonly pctChange: number;
  readonly description: string;
}

export const BRAPI_KEY_NOT_CONFIGURED_ERROR = "BRAPI_API_KEY_NOT_CONFIGURED" as const;

export class BrapiKeyNotConfiguredError extends Error {
  constructor() {
    super(BRAPI_KEY_NOT_CONFIGURED_ERROR);
    this.name = "BrapiKeyNotConfiguredError";
  }
}
