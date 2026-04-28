import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { ApiError } from "@/core/http/api-error";
import { queryKeys } from "@/core/query/query-keys";
import {
  type BrapiCurrencyQuote,
  type BrapiCurrentQuote,
  type BrapiFiiQuote,
  type BrapiHistoricalRange,
  type BrapiHistoricalSeries,
  type BrapiTickerSearchResult,
} from "@/features/wallet/brapi-contracts";
import {
  brapiService as defaultBrapiService,
  type BrapiService,
} from "@/features/wallet/services/brapi-service";

const STALE_TICKER_SEARCH_MS = 5 * 60 * 1000;
const STALE_CURRENT_QUOTE_MS = 60 * 1000;
const STALE_HISTORICAL_MS = 5 * 60 * 1000;
const STALE_FII_QUOTE_MS = 60 * 1000;
const STALE_CURRENCIES_MS = 60 * 1000;

interface BrapiQueryDeps {
  readonly service?: BrapiService;
}

const resolveService = (deps?: BrapiQueryDeps): BrapiService =>
  deps?.service ?? defaultBrapiService;

export const useBrapiTickerSearchQuery = (
  query: string,
  deps?: BrapiQueryDeps,
): UseQueryResult<BrapiTickerSearchResult[], ApiError> => {
  const service = resolveService(deps);
  const trimmed = query.trim();
  return useQuery<BrapiTickerSearchResult[], ApiError>({
    queryKey: queryKeys.brapi.tickerSearch(trimmed),
    queryFn: () => service.searchTickers(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: STALE_TICKER_SEARCH_MS,
  });
};

export const useBrapiCurrentQuoteQuery = (
  ticker: string,
  deps?: BrapiQueryDeps,
): UseQueryResult<BrapiCurrentQuote | null, ApiError> => {
  const service = resolveService(deps);
  const normalized = ticker.trim();
  return useQuery<BrapiCurrentQuote | null, ApiError>({
    queryKey: queryKeys.brapi.currentQuote(normalized),
    queryFn: () => service.getCurrentQuote(normalized),
    enabled: normalized.length > 0,
    staleTime: STALE_CURRENT_QUOTE_MS,
  });
};

export const useBrapiHistoricalPriceQuery = (
  ticker: string,
  range: BrapiHistoricalRange,
  deps?: BrapiQueryDeps,
): UseQueryResult<BrapiHistoricalSeries, ApiError> => {
  const service = resolveService(deps);
  const normalized = ticker.trim();
  return useQuery<BrapiHistoricalSeries, ApiError>({
    queryKey: queryKeys.brapi.historicalPrices(normalized, range),
    queryFn: () => service.getHistoricalPrices(normalized, range),
    enabled: normalized.length > 0,
    staleTime: STALE_HISTORICAL_MS,
  });
};

export const useBrapiFiiQuoteQuery = (
  ticker: string,
  deps?: BrapiQueryDeps,
): UseQueryResult<BrapiFiiQuote | null, ApiError> => {
  const service = resolveService(deps);
  const normalized = ticker.trim();
  return useQuery<BrapiFiiQuote | null, ApiError>({
    queryKey: queryKeys.brapi.fiiQuote(normalized),
    queryFn: () => service.getFiiQuote(normalized),
    enabled: normalized.length > 0,
    staleTime: STALE_FII_QUOTE_MS,
  });
};

export const useBrapiCurrenciesQuery = (
  pairs: readonly string[],
  deps?: BrapiQueryDeps,
): UseQueryResult<BrapiCurrencyQuote[], ApiError> => {
  const service = resolveService(deps);
  const sortedPairs = [...pairs].sort((a, b) => a.localeCompare(b));
  return useQuery<BrapiCurrencyQuote[], ApiError>({
    queryKey: queryKeys.brapi.currencies(sortedPairs),
    queryFn: () => service.getCurrencies(sortedPairs),
    enabled: sortedPairs.length > 0,
    staleTime: STALE_CURRENCIES_MS,
  });
};
