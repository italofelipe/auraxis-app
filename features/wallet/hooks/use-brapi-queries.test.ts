import { queryKeys } from "@/core/query/query-keys";
import type {
  BrapiCurrencyQuote,
  BrapiCurrentQuote,
  BrapiFiiQuote,
  BrapiHistoricalSeries,
  BrapiTickerSearchResult,
} from "@/features/wallet/brapi-contracts";
import {
  useBrapiCurrenciesQuery,
  useBrapiCurrentQuoteQuery,
  useBrapiFiiQuoteQuery,
  useBrapiHistoricalPriceQuery,
  useBrapiTickerSearchQuery,
} from "@/features/wallet/hooks/use-brapi-queries";
import type { BrapiService } from "@/features/wallet/services/brapi-service";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: readonly unknown[]) => mockUseQuery(...args),
}));

const buildServiceStub = (
  overrides: Partial<BrapiService> = {},
): BrapiService => ({
  searchTickers: jest.fn(),
  getCurrentQuote: jest.fn(),
  getHistoricalPrices: jest.fn(),
  getFiiQuote: jest.fn(),
  getCurrencies: jest.fn(),
  ...overrides,
});

interface QueryShape<T> {
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<T>;
  readonly enabled: boolean;
  readonly staleTime: number;
}

describe("brapi react query hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockImplementation((options) => options);
  });

  describe("useBrapiTickerSearchQuery", () => {
    it("trims input and disables query for queries shorter than 2 chars", () => {
      const service = buildServiceStub();

      const result = useBrapiTickerSearchQuery("a", { service }) as unknown as QueryShape<BrapiTickerSearchResult[]>;

      expect(result.enabled).toBe(false);
      expect(result.queryKey).toEqual(queryKeys.brapi.tickerSearch("a"));
      expect(result.staleTime).toBe(5 * 60 * 1000);
    });

    it("enables and forwards trimmed query to service", async () => {
      const stub: BrapiTickerSearchResult[] = [
        {
          stock: "PETR4",
          name: "Petroleo",
          close: null,
          change: null,
          volume: null,
          marketCapBasic: null,
          logo: null,
          sector: null,
        },
      ];
      const service = buildServiceStub({
        searchTickers: jest.fn().mockResolvedValue(stub),
      });

      const result = useBrapiTickerSearchQuery("  petr  ", { service }) as unknown as QueryShape<BrapiTickerSearchResult[]>;

      expect(result.enabled).toBe(true);
      expect(result.queryKey).toEqual(queryKeys.brapi.tickerSearch("petr"));
      await expect(result.queryFn()).resolves.toEqual(stub);
      expect(service.searchTickers).toHaveBeenCalledWith("petr");
    });
  });

  describe("useBrapiCurrentQuoteQuery", () => {
    it("disables when ticker is empty", () => {
      const service = buildServiceStub();
      const result = useBrapiCurrentQuoteQuery("", { service }) as unknown as QueryShape<BrapiCurrentQuote | null>;
      expect(result.enabled).toBe(false);
    });

    it("enables and forwards ticker to service with 60s stale time", async () => {
      const quote: BrapiCurrentQuote = {
        ticker: "PETR4",
        shortName: "PETR",
        price: 38,
        change: 0.5,
        changePercent: 1.3,
        currency: "BRL",
        logo: null,
      };
      const service = buildServiceStub({
        getCurrentQuote: jest.fn().mockResolvedValue(quote),
      });

      const result = useBrapiCurrentQuoteQuery(" PETR4 ", { service }) as unknown as QueryShape<BrapiCurrentQuote | null>;

      expect(result.enabled).toBe(true);
      expect(result.queryKey).toEqual(queryKeys.brapi.currentQuote("PETR4"));
      expect(result.staleTime).toBe(60 * 1000);
      await expect(result.queryFn()).resolves.toEqual(quote);
      expect(service.getCurrentQuote).toHaveBeenCalledWith("PETR4");
    });
  });

  describe("useBrapiHistoricalPriceQuery", () => {
    it("registers queryKey with ticker and range", async () => {
      const series: BrapiHistoricalSeries = {
        ticker: "PETR4",
        currency: "BRL",
        range: "1mo",
        points: [],
      };
      const service = buildServiceStub({
        getHistoricalPrices: jest.fn().mockResolvedValue(series),
      });

      const result = useBrapiHistoricalPriceQuery("petr4", "1mo", { service }) as unknown as QueryShape<BrapiHistoricalSeries>;

      expect(result.enabled).toBe(true);
      expect(result.queryKey).toEqual(queryKeys.brapi.historicalPrices("petr4", "1mo"));
      expect(result.staleTime).toBe(5 * 60 * 1000);
      await expect(result.queryFn()).resolves.toEqual(series);
      expect(service.getHistoricalPrices).toHaveBeenCalledWith("petr4", "1mo");
    });

    it("disables when ticker is empty", () => {
      const service = buildServiceStub();
      const result = useBrapiHistoricalPriceQuery("   ", "1y", { service }) as unknown as QueryShape<BrapiHistoricalSeries>;
      expect(result.enabled).toBe(false);
    });
  });

  describe("useBrapiFiiQuoteQuery", () => {
    it("forwards ticker and uses fii queryKey", async () => {
      const quote: BrapiFiiQuote = {
        ticker: "MXRF11",
        shortName: "MAXI RENDA",
        price: 10,
        changePercent: 0,
        currency: "BRL",
        dividends: [],
        lastDividend: null,
      };
      const service = buildServiceStub({
        getFiiQuote: jest.fn().mockResolvedValue(quote),
      });

      const result = useBrapiFiiQuoteQuery("mxrf11", { service }) as unknown as QueryShape<BrapiFiiQuote | null>;

      expect(result.queryKey).toEqual(queryKeys.brapi.fiiQuote("mxrf11"));
      expect(result.enabled).toBe(true);
      expect(result.staleTime).toBe(60 * 1000);
      await expect(result.queryFn()).resolves.toEqual(quote);
    });
  });

  describe("useBrapiCurrenciesQuery", () => {
    it("disables when no pairs are provided", () => {
      const service = buildServiceStub();
      const result = useBrapiCurrenciesQuery([], { service }) as unknown as QueryShape<BrapiCurrencyQuote[]>;
      expect(result.enabled).toBe(false);
    });

    it("sorts pairs deterministically in queryKey and forwards to service", async () => {
      const quotes: BrapiCurrencyQuote[] = [
        {
          fromCurrency: "USD",
          toCurrency: "BRL",
          name: "USD/BRL",
          bid: 5,
          ask: 5.05,
          high: 5.1,
          low: 4.9,
          pctChange: 1,
          description: "",
        },
      ];
      const service = buildServiceStub({
        getCurrencies: jest.fn().mockResolvedValue(quotes),
      });

      const result = useBrapiCurrenciesQuery(["USD-BRL", "EUR-BRL"], { service }) as unknown as QueryShape<BrapiCurrencyQuote[]>;

      expect(result.queryKey).toEqual(queryKeys.brapi.currencies(["EUR-BRL", "USD-BRL"]));
      expect(result.enabled).toBe(true);
      expect(result.staleTime).toBe(60 * 1000);
      await expect(result.queryFn()).resolves.toEqual(quotes);
      expect(service.getCurrencies).toHaveBeenCalledWith(["EUR-BRL", "USD-BRL"]);
    });
  });
});
