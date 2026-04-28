import axios, { type AxiosInstance } from "axios";

import { appRuntimeConfig } from "@/shared/config/runtime";
import {
  BrapiKeyNotConfiguredError,
  type BrapiCurrencyQuote,
  type BrapiCurrentQuote,
  type BrapiDividendEntry,
  type BrapiFiiQuote,
  type BrapiHistoricalRange,
  type BrapiHistoricalSeries,
  type BrapiPricePoint,
  type BrapiTickerSearchResult,
} from "@/features/wallet/brapi-contracts";

interface BrapiServiceOptions {
  readonly httpClient?: AxiosInstance;
  readonly token?: string;
  readonly baseUrl?: string;
}

interface QuoteListResponse {
  readonly stocks?: readonly {
    readonly stock?: string;
    readonly name?: string;
    readonly close?: number | null;
    readonly change?: number | null;
    readonly volume?: number | null;
    readonly market_cap_basic?: number | null;
    readonly logo?: string | null;
    readonly sector?: string | null;
  }[];
}

interface QuoteApiResult {
  readonly symbol?: string;
  readonly shortName?: string | null;
  readonly longName?: string | null;
  readonly regularMarketPrice?: number;
  readonly regularMarketChange?: number;
  readonly regularMarketChangePercent?: number;
  readonly currency?: string | null;
  readonly logourl?: string | null;
  readonly historicalDataPrice?: readonly {
    readonly date?: number;
    readonly open?: number;
    readonly high?: number;
    readonly low?: number;
    readonly close?: number;
    readonly volume?: number;
    readonly adjustedClose?: number;
  }[];
  readonly dividendsData?: {
    readonly cashDividends?: readonly {
      readonly paymentDate?: string;
      readonly adjustedValue?: number;
      readonly type?: string;
    }[];
  };
}

interface QuoteResponse {
  readonly results?: readonly QuoteApiResult[];
}

interface CurrencyResponse {
  readonly currency?: readonly {
    readonly fromCurrency?: string;
    readonly toCurrency?: string;
    readonly name?: string;
    readonly bid?: number | string;
    readonly ask?: number | string;
    readonly high?: number | string;
    readonly low?: number | string;
    readonly pctChange?: number | string;
    readonly description?: string;
  }[];
}

const DEFAULT_TIMEOUT_MS = 10_000;

const RANGE_TO_INTERVAL: Readonly<Record<BrapiHistoricalRange, string>> = {
  "1d": "5m",
  "5d": "30m",
  "1mo": "1d",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1d",
  "5y": "1wk",
  max: "1mo",
};

const toNumber = (value: number | string | null | undefined, fallback = 0): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const formatTimestamp = (timestamp: number | undefined): string => {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return "";
  }
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
};

const mapTickerSearchResult = (
  raw: NonNullable<QuoteListResponse["stocks"]>[number],
): BrapiTickerSearchResult => ({
  stock: raw.stock ?? "",
  name: raw.name ?? "",
  close: typeof raw.close === "number" ? raw.close : null,
  change: typeof raw.change === "number" ? raw.change : null,
  volume: typeof raw.volume === "number" ? raw.volume : null,
  marketCapBasic: typeof raw.market_cap_basic === "number" ? raw.market_cap_basic : null,
  logo: raw.logo ?? null,
  sector: raw.sector ?? null,
});

const mapPricePoint = (
  raw: NonNullable<QuoteApiResult["historicalDataPrice"]>[number],
): BrapiPricePoint => {
  const timestamp = typeof raw.date === "number" ? raw.date : 0;
  return {
    timestamp,
    date: formatTimestamp(timestamp),
    open: toNumber(raw.open),
    high: toNumber(raw.high),
    low: toNumber(raw.low),
    close: toNumber(raw.close),
    volume: toNumber(raw.volume),
    adjustedClose: toNumber(raw.adjustedClose ?? raw.close),
  };
};

const mapDividend = (
  raw: NonNullable<NonNullable<QuoteApiResult["dividendsData"]>["cashDividends"]>[number],
): BrapiDividendEntry => ({
  paymentDate: raw.paymentDate ?? "",
  adjustedValue: toNumber(raw.adjustedValue),
  type: raw.type ?? "",
});

const sortDividendsDesc = (entries: BrapiDividendEntry[]): BrapiDividendEntry[] => {
  return [...entries].sort((a, b) => {
    if (a.paymentDate < b.paymentDate) {
      return 1;
    }
    if (a.paymentDate > b.paymentDate) {
      return -1;
    }
    return 0;
  });
};

const buildClient = (options: BrapiServiceOptions): AxiosInstance => {
  if (options.httpClient) {
    return options.httpClient;
  }
  return axios.create({
    baseURL: options.baseUrl ?? appRuntimeConfig.brapiBaseUrl,
    timeout: DEFAULT_TIMEOUT_MS,
  });
};

const requireToken = (token: string): string => {
  if (token.length === 0) {
    throw new BrapiKeyNotConfiguredError();
  }
  return token;
};

export interface BrapiService {
  searchTickers(query: string): Promise<BrapiTickerSearchResult[]>;
  getCurrentQuote(ticker: string): Promise<BrapiCurrentQuote | null>;
  getHistoricalPrices(
    ticker: string,
    range: BrapiHistoricalRange,
  ): Promise<BrapiHistoricalSeries>;
  getFiiQuote(ticker: string): Promise<BrapiFiiQuote | null>;
  getCurrencies(pairs: readonly string[]): Promise<BrapiCurrencyQuote[]>;
}

const buildSearchTickers = (
  client: AxiosInstance,
  token: string,
) => async (query: string): Promise<BrapiTickerSearchResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const response = await client.get<QuoteListResponse>("/quote/list", {
    params: { search: trimmed, token, limit: 10 },
  });
  return (response.data.stocks ?? []).map(mapTickerSearchResult);
};

const buildGetCurrentQuote = (
  client: AxiosInstance,
  token: string,
) => async (ticker: string): Promise<BrapiCurrentQuote | null> => {
  const safeToken = requireToken(token);
  const response = await client.get<QuoteResponse>(`/quote/${ticker}`, {
    params: { token: safeToken, interval: "1d" },
  });
  const result = response.data.results?.[0];
  if (!result) {
    return null;
  }
  return {
    ticker: result.symbol ?? ticker,
    shortName: result.shortName ?? result.longName ?? ticker,
    price: toNumber(result.regularMarketPrice),
    change: toNumber(result.regularMarketChange),
    changePercent: toNumber(result.regularMarketChangePercent),
    currency: result.currency ?? "BRL",
    logo: result.logourl ?? null,
  };
};

const buildGetHistoricalPrices = (
  client: AxiosInstance,
  token: string,
) => async (
  ticker: string,
  range: BrapiHistoricalRange,
): Promise<BrapiHistoricalSeries> => {
  const safeToken = requireToken(token);
  const response = await client.get<QuoteResponse>(`/quote/${ticker}`, {
    params: { token: safeToken, range, interval: RANGE_TO_INTERVAL[range] },
  });
  const result = response.data.results?.[0];
  if (!result) {
    return { ticker, currency: "BRL", range, points: [] };
  }
  return {
    ticker: result.symbol ?? ticker,
    currency: result.currency ?? "BRL",
    range,
    points: (result.historicalDataPrice ?? []).map(mapPricePoint),
  };
};

const buildGetFiiQuote = (
  client: AxiosInstance,
  token: string,
) => async (ticker: string): Promise<BrapiFiiQuote | null> => {
  const safeToken = requireToken(token);
  const response = await client.get<QuoteResponse>(`/quote/${ticker}`, {
    params: { token: safeToken, fundamental: "true", interval: "1d" },
  });
  const result = response.data.results?.[0];
  if (!result) {
    return null;
  }
  const dividends = sortDividendsDesc(
    (result.dividendsData?.cashDividends ?? []).map(mapDividend),
  );
  return {
    ticker: result.symbol ?? ticker,
    shortName: result.shortName ?? result.longName ?? ticker,
    price: toNumber(result.regularMarketPrice),
    changePercent: toNumber(result.regularMarketChangePercent),
    currency: result.currency ?? "BRL",
    dividends,
    lastDividend: dividends[0] ?? null,
  };
};

const mapCurrencyEntry = (
  raw: NonNullable<CurrencyResponse["currency"]>[number],
): BrapiCurrencyQuote => ({
  fromCurrency: raw.fromCurrency ?? "",
  toCurrency: raw.toCurrency ?? "",
  name: raw.name ?? "",
  bid: toNumber(raw.bid),
  ask: toNumber(raw.ask),
  high: toNumber(raw.high),
  low: toNumber(raw.low),
  pctChange: toNumber(raw.pctChange),
  description: raw.description ?? "",
});

const buildGetCurrencies = (
  client: AxiosInstance,
  token: string,
) => async (pairs: readonly string[]): Promise<BrapiCurrencyQuote[]> => {
  if (pairs.length === 0) {
    return [];
  }
  const safeToken = requireToken(token);
  const response = await client.get<CurrencyResponse>("/v2/currency", {
    params: { currency: pairs.join(","), token: safeToken },
  });
  return (response.data.currency ?? []).map(mapCurrencyEntry);
};

export const createBrapiService = (options: BrapiServiceOptions = {}): BrapiService => {
  const client = buildClient(options);
  const token = options.token ?? appRuntimeConfig.brapiToken ?? "";
  return {
    searchTickers: buildSearchTickers(client, token),
    getCurrentQuote: buildGetCurrentQuote(client, token),
    getHistoricalPrices: buildGetHistoricalPrices(client, token),
    getFiiQuote: buildGetFiiQuote(client, token),
    getCurrencies: buildGetCurrencies(client, token),
  };
};

export const brapiService: BrapiService = createBrapiService();
