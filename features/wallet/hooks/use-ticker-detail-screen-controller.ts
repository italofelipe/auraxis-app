import { useCallback, useMemo, useState } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import type { ApiError } from "@/core/http/api-error";
import { appRoutes } from "@/core/navigation/routes";
import {
  BRAPI_HISTORICAL_RANGES,
  type BrapiCurrentQuote,
  type BrapiFiiQuote,
  type BrapiHistoricalRange,
  type BrapiHistoricalSeries,
} from "@/features/wallet/brapi-contracts";
import type {
  WalletEntry,
  WalletOperationKind,
  WalletOperationsPosition,
} from "@/features/wallet/contracts";
import {
  useBrapiCurrentQuoteQuery,
  useBrapiFiiQuoteQuery,
  useBrapiHistoricalPriceQuery,
} from "@/features/wallet/hooks/use-brapi-queries";
import {
  useWalletOperationsPositionQuery,
} from "@/features/wallet/hooks/use-wallet-operations-query";
import { useWalletEntriesQuery } from "@/features/wallet/hooks/use-wallet-query";

const DEFAULT_RANGE: BrapiHistoricalRange = "1mo";
const FII_TICKER_PATTERN = /^[A-Z]{4}11$/;

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

export const isFiiTicker = (ticker: string): boolean => {
  return FII_TICKER_PATTERN.test(ticker.trim().toUpperCase());
};

export interface TickerDetailScreenController {
  readonly ticker: string;
  readonly entry: WalletEntry | null;
  readonly currentQuote: BrapiCurrentQuote | null;
  readonly historicalSeries: BrapiHistoricalSeries | null;
  readonly fiiQuote: BrapiFiiQuote | null;
  readonly position: WalletOperationsPosition | null;
  readonly selectedRange: BrapiHistoricalRange;
  readonly availableRanges: readonly BrapiHistoricalRange[];
  readonly isFii: boolean;
  readonly isCurrentQuoteLoading: boolean;
  readonly isHistoricalLoading: boolean;
  readonly isFiiLoading: boolean;
  readonly isPositionLoading: boolean;
  readonly currentQuoteError: ApiError | null;
  readonly historicalError: ApiError | null;
  readonly positionError: ApiError | null;
  readonly hasMatchingEntry: boolean;
  readonly handleSelectRange: (range: BrapiHistoricalRange) => void;
  readonly handleOpenBuy: () => void;
  readonly handleOpenSell: () => void;
  readonly handleBack: () => void;
}

const findEntryByTicker = (
  entries: readonly WalletEntry[],
  ticker: string,
): WalletEntry | null => {
  const normalized = ticker.trim().toUpperCase();
  if (normalized.length === 0) {
    return null;
  }
  return (
    entries.find(
      (entry) => entry.ticker?.trim().toUpperCase() === normalized,
    ) ?? null
  );
};

/**
 * Controller for the ticker detail screen.
 *
 * Reads the URL ticker param, resolves it against the wallet entries
 * cache to surface a position card, and orchestrates the BRAPI quote +
 * historical-prices + FII queries together with a local range selector.
 *
 * Buy and Sell CTAs delegate to the existing wallet operations route
 * since the canonical form already lives there; we just route in with
 * the entry id pre-selected and an `intent` query param the operations
 * screen can read in a later iteration.
 */
export function useTickerDetailScreenController(): TickerDetailScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticker?: string | string[] }>();
  const ticker = resolveStringParam(params.ticker).trim().toUpperCase();

  const walletQuery = useWalletEntriesQuery();
  const entry = useMemo(
    () => findEntryByTicker(walletQuery.data?.items ?? [], ticker),
    [walletQuery.data?.items, ticker],
  );

  const positionQuery = useWalletOperationsPositionQuery(entry?.id ?? null);

  const [selectedRange, setSelectedRange] =
    useState<BrapiHistoricalRange>(DEFAULT_RANGE);
  const isFii = useMemo(() => isFiiTicker(ticker), [ticker]);

  const currentQuoteQuery = useBrapiCurrentQuoteQuery(ticker);
  const historicalQuery = useBrapiHistoricalPriceQuery(ticker, selectedRange);
  const fiiQuery = useBrapiFiiQuoteQuery(isFii ? ticker : "");

  const handleSelectRange = useCallback(
    (range: BrapiHistoricalRange): void => {
      setSelectedRange(range);
    },
    [],
  );

  const handleNavigateToOperations = useCallback(
    (intent: WalletOperationKind): void => {
      if (entry === null) {
        return;
      }
      router.push({
        pathname: appRoutes.private.walletOperations,
        params: { entryId: entry.id, intent },
      });
    },
    [entry, router],
  );

  const handleOpenBuy = useCallback((): void => {
    handleNavigateToOperations("buy");
  }, [handleNavigateToOperations]);

  const handleOpenSell = useCallback((): void => {
    handleNavigateToOperations("sell");
  }, [handleNavigateToOperations]);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(appRoutes.private.wallet);
  }, [router]);

  return {
    ticker,
    entry,
    currentQuote: currentQuoteQuery.data ?? null,
    historicalSeries: historicalQuery.data ?? null,
    fiiQuote: fiiQuery.data ?? null,
    position: positionQuery.data ?? null,
    selectedRange,
    availableRanges: BRAPI_HISTORICAL_RANGES,
    isFii,
    isCurrentQuoteLoading: currentQuoteQuery.isLoading,
    isHistoricalLoading: historicalQuery.isLoading,
    isFiiLoading: fiiQuery.isLoading,
    isPositionLoading: positionQuery.isLoading,
    currentQuoteError: currentQuoteQuery.error ?? null,
    historicalError: historicalQuery.error ?? null,
    positionError: positionQuery.error ?? null,
    hasMatchingEntry: entry !== null,
    handleSelectRange,
    handleOpenBuy,
    handleOpenSell,
    handleBack,
  };
}
