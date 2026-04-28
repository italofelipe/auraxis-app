import type { AxiosInstance, AxiosResponse } from "axios";

import {
  BRAPI_KEY_NOT_CONFIGURED_ERROR,
  BrapiKeyNotConfiguredError,
} from "@/features/wallet/brapi-contracts";
import { createBrapiService } from "@/features/wallet/services/brapi-service";

interface RecordedRequest {
  readonly url: string;
  readonly params: Record<string, unknown> | undefined;
}

const buildAxios = (
  responder: (request: RecordedRequest) => unknown,
): { readonly client: AxiosInstance; readonly requests: RecordedRequest[] } => {
  const requests: RecordedRequest[] = [];
  const get = jest.fn(async (url: string, config?: { params?: Record<string, unknown> }) => {
    const recorded = { url, params: config?.params };
    requests.push(recorded);
    const data = responder(recorded);
    return { data, status: 200, statusText: "OK", headers: {}, config: {} } as AxiosResponse;
  });
  return {
    client: { get } as unknown as AxiosInstance,
    requests,
  };
};

const TOKEN = "tok_test_123";

describe("brapi-service searchTickers", () => {
    it("returns empty array when query is whitespace only", async () => {
      const { client, requests } = buildAxios(() => ({ stocks: [] }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const results = await service.searchTickers("   ");

      expect(results).toEqual([]);
      expect(requests).toHaveLength(0);
    });

    it("hits /quote/list with trimmed query, token and limit", async () => {
      const { client, requests } = buildAxios(() => ({
        stocks: [
          {
            stock: "PETR4",
            name: "Petroleo Brasileiro SA",
            close: 38.5,
            change: 0.42,
            volume: 1000,
            market_cap_basic: 5000,
            logo: "https://logo.example/petr4.png",
            sector: "Energy",
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const results = await service.searchTickers("  petr  ");

      expect(requests).toHaveLength(1);
      expect(requests[0]?.url).toBe("/quote/list");
      expect(requests[0]?.params).toEqual({ search: "petr", token: TOKEN, limit: 10 });
      expect(results).toEqual([
        {
          stock: "PETR4",
          name: "Petroleo Brasileiro SA",
          close: 38.5,
          change: 0.42,
          volume: 1000,
          marketCapBasic: 5000,
          logo: "https://logo.example/petr4.png",
          sector: "Energy",
        },
      ]);
    });

    it("returns empty array when API returns no stocks key", async () => {
      const { client } = buildAxios(() => ({}));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const results = await service.searchTickers("xyz");

      expect(results).toEqual([]);
    });
});

describe("brapi-service getCurrentQuote", () => {
    it("requires a token and throws BrapiKeyNotConfiguredError when missing", async () => {
      const { client, requests } = buildAxios(() => ({ results: [] }));
      const service = createBrapiService({ httpClient: client, token: "" });

      await expect(service.getCurrentQuote("PETR4")).rejects.toBeInstanceOf(
        BrapiKeyNotConfiguredError,
      );
      await expect(service.getCurrentQuote("PETR4")).rejects.toMatchObject({
        message: BRAPI_KEY_NOT_CONFIGURED_ERROR,
      });
      expect(requests).toHaveLength(0);
    });

    it("returns mapped quote with logo when result is present", async () => {
      const { client, requests } = buildAxios(() => ({
        results: [
          {
            symbol: "PETR4",
            shortName: "PETROBRAS PN",
            longName: "Petroleo Brasileiro PN",
            regularMarketPrice: 38.5,
            regularMarketChange: 0.42,
            regularMarketChangePercent: 1.1,
            currency: "BRL",
            logourl: "https://logo.example/petr4.png",
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quote = await service.getCurrentQuote("PETR4");

      expect(requests[0]?.url).toBe("/quote/PETR4");
      expect(requests[0]?.params).toEqual({ token: TOKEN, interval: "1d" });
      expect(quote).toEqual({
        ticker: "PETR4",
        shortName: "PETROBRAS PN",
        price: 38.5,
        change: 0.42,
        changePercent: 1.1,
        currency: "BRL",
        logo: "https://logo.example/petr4.png",
      });
    });

    it("returns null when results array is empty", async () => {
      const { client } = buildAxios(() => ({ results: [] }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quote = await service.getCurrentQuote("UNKNOWN");

      expect(quote).toBeNull();
    });

    it("falls back to ticker when symbol and longName are absent", async () => {
      const { client } = buildAxios(() => ({
        results: [
          {
            shortName: null,
            longName: null,
            regularMarketPrice: 10,
            regularMarketChange: 0,
            regularMarketChangePercent: 0,
            currency: null,
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quote = await service.getCurrentQuote("ABC11");

      expect(quote).toEqual({
        ticker: "ABC11",
        shortName: "ABC11",
        price: 10,
        change: 0,
        changePercent: 0,
        currency: "BRL",
        logo: null,
      });
    });
});

describe("brapi-service getHistoricalPrices", () => {
    it("requires a token and throws when missing", async () => {
      const { client, requests } = buildAxios(() => ({ results: [] }));
      const service = createBrapiService({ httpClient: client, token: "" });

      await expect(service.getHistoricalPrices("PETR4", "1mo")).rejects.toBeInstanceOf(
        BrapiKeyNotConfiguredError,
      );
      expect(requests).toHaveLength(0);
    });

    it("hits /quote/{ticker} with the correct range and interval per range", async () => {
      const { client, requests } = buildAxios(() => ({
        results: [
          {
            symbol: "PETR4",
            currency: "BRL",
            historicalDataPrice: [
              {
                date: 1714435200,
                open: 38.0,
                high: 39.0,
                low: 37.5,
                close: 38.5,
                volume: 1_000_000,
                adjustedClose: 38.5,
              },
            ],
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const series = await service.getHistoricalPrices("PETR4", "1y");

      expect(requests[0]?.url).toBe("/quote/PETR4");
      expect(requests[0]?.params).toEqual({
        token: TOKEN,
        range: "1y",
        interval: "1d",
      });
      expect(series.ticker).toBe("PETR4");
      expect(series.currency).toBe("BRL");
      expect(series.range).toBe("1y");
      expect(series.points).toHaveLength(1);
      const [point] = series.points;
      expect(point?.date).toBe("2024-04-30");
      expect(point?.close).toBe(38.5);
    });

    it("uses 5m interval for 1d range and 30m for 5d", async () => {
      const { client, requests } = buildAxios(() => ({
        results: [{ symbol: "X", currency: "BRL", historicalDataPrice: [] }],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      await service.getHistoricalPrices("X", "1d");
      await service.getHistoricalPrices("X", "5d");

      expect(requests[0]?.params).toMatchObject({ range: "1d", interval: "5m" });
      expect(requests[1]?.params).toMatchObject({ range: "5d", interval: "30m" });
    });

    it("returns empty series when results are empty", async () => {
      const { client } = buildAxios(() => ({ results: [] }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const series = await service.getHistoricalPrices("XYZ", "1mo");

      expect(series).toEqual({
        ticker: "XYZ",
        currency: "BRL",
        range: "1mo",
        points: [],
      });
    });
});

describe("brapi-service getFiiQuote", () => {
    it("returns mapped FII quote with sorted dividends and lastDividend", async () => {
      const { client, requests } = buildAxios(() => ({
        results: [
          {
            symbol: "MXRF11",
            shortName: "MAXI RENDA FII",
            regularMarketPrice: 10.2,
            regularMarketChangePercent: 0.5,
            currency: "BRL",
            dividendsData: {
              cashDividends: [
                { paymentDate: "2026-01-15", adjustedValue: 0.1, type: "Rendimento" },
                { paymentDate: "2026-03-15", adjustedValue: 0.12, type: "Rendimento" },
                { paymentDate: "2026-02-15", adjustedValue: 0.11, type: "Rendimento" },
              ],
            },
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quote = await service.getFiiQuote("MXRF11");

      expect(requests[0]?.url).toBe("/quote/MXRF11");
      expect(requests[0]?.params).toEqual({
        token: TOKEN,
        fundamental: "true",
        interval: "1d",
      });
      expect(quote).not.toBeNull();
      expect(quote?.ticker).toBe("MXRF11");
      expect(quote?.shortName).toBe("MAXI RENDA FII");
      expect(quote?.dividends).toHaveLength(3);
      expect(quote?.dividends[0]?.paymentDate).toBe("2026-03-15");
      expect(quote?.lastDividend?.paymentDate).toBe("2026-03-15");
    });

    it("returns null when results are empty", async () => {
      const { client } = buildAxios(() => ({ results: [] }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quote = await service.getFiiQuote("XX99");

      expect(quote).toBeNull();
    });

    it("returns lastDividend null when there are no dividends", async () => {
      const { client } = buildAxios(() => ({
        results: [
          {
            symbol: "ABCD3",
            shortName: "ABCD",
            regularMarketPrice: 10,
            regularMarketChangePercent: 0,
            currency: "BRL",
            dividendsData: { cashDividends: [] },
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quote = await service.getFiiQuote("ABCD3");

      expect(quote?.dividends).toEqual([]);
      expect(quote?.lastDividend).toBeNull();
    });
});

describe("brapi-service getCurrencies", () => {
    it("hits /v2/currency with joined pairs", async () => {
      const { client, requests } = buildAxios(() => ({
        currency: [
          {
            fromCurrency: "USD",
            toCurrency: "BRL",
            name: "Dolar Americano/Real",
            bid: 5.1,
            ask: 5.12,
            high: 5.2,
            low: 5.0,
            pctChange: 0.5,
            description: "Dolar",
          },
        ],
      }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quotes = await service.getCurrencies(["USD-BRL", "EUR-BRL"]);

      expect(requests[0]?.url).toBe("/v2/currency");
      expect(requests[0]?.params).toEqual({
        currency: "USD-BRL,EUR-BRL",
        token: TOKEN,
      });
      expect(quotes).toHaveLength(1);
      expect(quotes[0]?.bid).toBe(5.1);
    });

    it("returns empty array when currency key absent", async () => {
      const { client } = buildAxios(() => ({}));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quotes = await service.getCurrencies(["USD-BRL"]);

      expect(quotes).toEqual([]);
    });

    it("returns empty array when pairs is empty without hitting the network", async () => {
      const { client, requests } = buildAxios(() => ({ currency: [] }));
      const service = createBrapiService({ httpClient: client, token: TOKEN });

      const quotes = await service.getCurrencies([]);

      expect(quotes).toEqual([]);
      expect(requests).toHaveLength(0);
    });
});
