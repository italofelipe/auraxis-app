import { act, renderHook } from "@testing-library/react-native";

import type { BrapiCurrentQuote } from "@/features/wallet/brapi-contracts";
import type { WalletEntry } from "@/features/wallet/contracts";
import { useWalletLiveQuotes } from "@/features/wallet/hooks/use-wallet-live-quotes";
import type { BrapiService } from "@/features/wallet/services/brapi-service";

interface QueryConfig {
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<BrapiCurrentQuote | null>;
  readonly enabled: boolean;
  readonly staleTime: number;
}

const mockUseQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQueries: (...args: readonly unknown[]) => mockUseQueries(...args),
}));

const buildEntry = (overrides: Partial<WalletEntry>): WalletEntry => ({
  id: overrides.id ?? "entry-1",
  name: overrides.name ?? "Acoes",
  value: overrides.value ?? 100,
  estimatedValueOnCreateDate: overrides.estimatedValueOnCreateDate ?? null,
  ticker: overrides.ticker ?? null,
  quantity: overrides.quantity ?? null,
  assetClass: overrides.assetClass ?? "stocks",
  annualRate: overrides.annualRate ?? null,
  targetWithdrawDate: overrides.targetWithdrawDate ?? null,
  registerDate: overrides.registerDate ?? "2026-01-01",
  shouldBeOnWallet: overrides.shouldBeOnWallet ?? true,
});

const buildQuote = (overrides: Partial<BrapiCurrentQuote>): BrapiCurrentQuote => ({
  ticker: overrides.ticker ?? "PETR4",
  shortName: overrides.shortName ?? "PETR",
  price: overrides.price ?? 38.5,
  change: overrides.change ?? 0,
  changePercent: overrides.changePercent ?? 0,
  currency: overrides.currency ?? "BRL",
  logo: overrides.logo ?? null,
});

const buildService = (
  overrides: Partial<BrapiService> = {},
): BrapiService => ({
  searchTickers: jest.fn(),
  getCurrentQuote: jest.fn(),
  getHistoricalPrices: jest.fn(),
  getFiiQuote: jest.fn(),
  getCurrencies: jest.fn(),
  ...overrides,
});

describe("useWalletLiveQuotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueries.mockImplementation(({ queries }: { queries: readonly QueryConfig[] }) =>
      queries.map(() => ({
        data: undefined,
        isLoading: true,
        isError: false,
        isFetching: true,
        refetch: jest.fn().mockResolvedValue({ data: undefined }),
      })),
    );
  });

  it("collects unique uppercased tickers across entries", () => {
    const service = buildService();
    const entries = [
      buildEntry({ id: "1", ticker: "petr4", quantity: 10 }),
      buildEntry({ id: "2", ticker: "PETR4", quantity: 20 }),
      buildEntry({ id: "3", ticker: null, value: 50 }),
      buildEntry({ id: "4", ticker: " itub4 ", quantity: 5 }),
    ];

    renderHook(() => useWalletLiveQuotes(entries, { service }));

    const queries = (mockUseQueries.mock.calls[0]?.[0] as { queries: QueryConfig[] }).queries;
    expect(queries.map((q) => q.queryKey)).toEqual([
      ["brapi", "quote", "current", "PETR4"],
      ["brapi", "quote", "current", "ITUB4"],
    ]);
    expect(queries.every((q) => q.staleTime === 60_000)).toBe(true);
  });

  it("sums live total using quoted price * quantity, falling back to entry.value when no ticker", () => {
    const service = buildService();
    mockUseQueries.mockImplementation(() => [
      {
        data: buildQuote({ ticker: "PETR4", price: 40 }),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: jest.fn(),
      },
    ]);

    const entries = [
      buildEntry({ id: "1", ticker: "PETR4", quantity: 10, value: 200 }),
      buildEntry({ id: "2", ticker: null, value: 75 }),
    ];

    const { result } = renderHook(() => useWalletLiveQuotes(entries, { service }));

    expect(result.current.liveTotal).toBe(40 * 10 + 75);
    expect(result.current.byTicker.get("PETR4")?.quote?.price).toBe(40);
    expect(result.current.hasAnyError).toBe(false);
  });

  it("falls back to entry.value when ticker is set but quote is missing", () => {
    const service = buildService();
    mockUseQueries.mockImplementation(() => [
      { data: null, isLoading: false, isError: false, isFetching: false, refetch: jest.fn() },
    ]);

    const entries = [
      buildEntry({ id: "1", ticker: "PETR4", quantity: 10, value: 200 }),
    ];

    const { result } = renderHook(() => useWalletLiveQuotes(entries, { service }));

    expect(result.current.liveTotal).toBe(200);
    expect(result.current.hasAnyError).toBe(false);
  });

  it("returns null liveTotal when there are quote errors with active tickers", () => {
    const service = buildService();
    mockUseQueries.mockImplementation(() => [
      { data: null, isLoading: false, isError: true, isFetching: false, refetch: jest.fn() },
    ]);

    const entries = [
      buildEntry({ id: "1", ticker: "PETR4", quantity: 10, value: 200 }),
    ];

    const { result } = renderHook(() => useWalletLiveQuotes(entries, { service }));

    expect(result.current.hasAnyError).toBe(true);
    expect(result.current.liveTotal).toBeNull();
  });

  it("refetch invokes refetch on every active query", async () => {
    const service = buildService();
    const refetch1 = jest.fn().mockResolvedValue({ data: null });
    const refetch2 = jest.fn().mockResolvedValue({ data: null });

    mockUseQueries.mockImplementation(() => [
      { data: null, isLoading: false, isError: false, isFetching: false, refetch: refetch1 },
      { data: null, isLoading: false, isError: false, isFetching: false, refetch: refetch2 },
    ]);

    const entries = [
      buildEntry({ id: "1", ticker: "PETR4", quantity: 10 }),
      buildEntry({ id: "2", ticker: "ITUB4", quantity: 5 }),
    ];

    const { result } = renderHook(() => useWalletLiveQuotes(entries, { service }));

    await act(async () => {
      await result.current.refetch();
    });

    expect(refetch1).toHaveBeenCalledTimes(1);
    expect(refetch2).toHaveBeenCalledTimes(1);
  });
});
