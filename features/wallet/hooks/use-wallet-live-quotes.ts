import { useMemo } from "react";

import { useQueries } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type { BrapiCurrentQuote } from "@/features/wallet/brapi-contracts";
import type { WalletEntry } from "@/features/wallet/contracts";
import {
  brapiService as defaultBrapiService,
  type BrapiService,
} from "@/features/wallet/services/brapi-service";

const STALE_QUOTE_MS = 60 * 1000;

export interface WalletLiveQuoteEntry {
  readonly ticker: string;
  readonly quote: BrapiCurrentQuote | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export interface WalletLiveQuotes {
  readonly byTicker: ReadonlyMap<string, WalletLiveQuoteEntry>;
  readonly liveTotal: number | null;
  readonly hasAnyError: boolean;
  readonly isFetching: boolean;
  readonly refetch: () => Promise<void>;
}

const collectTickers = (entries: readonly WalletEntry[]): readonly string[] => {
  const set = new Set<string>();
  for (const entry of entries) {
    const ticker = entry.ticker?.trim().toUpperCase();
    if (ticker && ticker.length > 0) {
      set.add(ticker);
    }
  }
  return [...set];
};

const computeLiveValueForEntry = (
  entry: WalletEntry,
  quote: BrapiCurrentQuote | null,
): number | null => {
  if (!quote || typeof entry.quantity !== "number" || entry.quantity <= 0) {
    return null;
  }
  return quote.price * entry.quantity;
};

interface QuoteAggregateResult {
  readonly byTicker: Map<string, WalletLiveQuoteEntry>;
  readonly hasError: boolean;
  readonly isFetching: boolean;
}

const aggregateQuotes = (
  tickers: readonly string[],
  results: readonly {
    readonly data?: BrapiCurrentQuote | null;
    readonly isLoading: boolean;
    readonly isError: boolean;
    readonly isFetching: boolean;
  }[],
): QuoteAggregateResult => {
  const byTicker = new Map<string, WalletLiveQuoteEntry>();
  let hasError = false;
  let isFetching = false;
  results.forEach((result, index) => {
    const ticker = tickers[index];
    if (!ticker) {
      return;
    }
    byTicker.set(ticker, {
      ticker,
      quote: result.data ?? null,
      isLoading: result.isLoading,
      isError: result.isError,
    });
    if (result.isError) {
      hasError = true;
    }
    if (result.isFetching) {
      isFetching = true;
    }
  });
  return { byTicker, hasError, isFetching };
};

interface LiveTotalSummary {
  readonly liveTotal: number;
  readonly coverageMissing: boolean;
}

const computeLiveTotal = (
  entries: readonly WalletEntry[],
  byTicker: ReadonlyMap<string, WalletLiveQuoteEntry>,
): LiveTotalSummary => {
  let liveTotal = 0;
  let coverageMissing = false;
  for (const entry of entries) {
    const ticker = entry.ticker?.trim().toUpperCase();
    const fallback = entry.value ?? 0;
    const liveValue = ticker
      ? computeLiveValueForEntry(entry, byTicker.get(ticker)?.quote ?? null)
      : null;
    if (liveValue !== null) {
      liveTotal += liveValue;
      continue;
    }
    if (ticker && (entry.quantity ?? 0) > 0) {
      coverageMissing = true;
    }
    liveTotal += fallback;
  }
  return { liveTotal, coverageMissing };
};

interface UseWalletLiveQuotesOptions {
  readonly service?: BrapiService;
}

export const useWalletLiveQuotes = (
  entries: readonly WalletEntry[],
  options: UseWalletLiveQuotesOptions = {},
): WalletLiveQuotes => {
  const service = options.service ?? defaultBrapiService;
  const tickers = useMemo(() => collectTickers(entries), [entries]);

  const queryResults = useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: queryKeys.brapi.currentQuote(ticker),
      queryFn: () => service.getCurrentQuote(ticker),
      staleTime: STALE_QUOTE_MS,
      enabled: ticker.length > 0,
    })),
  });

  return useMemo<WalletLiveQuotes>(() => {
    const aggregate = aggregateQuotes(tickers, queryResults);
    const totals = computeLiveTotal(entries, aggregate.byTicker);
    return {
      byTicker: aggregate.byTicker,
      liveTotal: totals.coverageMissing && aggregate.hasError ? null : totals.liveTotal,
      hasAnyError: aggregate.hasError,
      isFetching: aggregate.isFetching,
      refetch: async () => {
        await Promise.all(queryResults.map((result) => result.refetch()));
      },
    };
  }, [entries, queryResults, tickers]);
};
