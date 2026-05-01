import { act, renderHook } from "@testing-library/react-native";

import {
  useBrapiCurrentQuoteQuery,
  useBrapiFiiQuoteQuery,
  useBrapiHistoricalPriceQuery,
} from "@/features/wallet/hooks/use-brapi-queries";
import {
  isFiiTicker,
  useTickerDetailScreenController,
} from "@/features/wallet/hooks/use-ticker-detail-screen-controller";
import { useWalletOperationsPositionQuery } from "@/features/wallet/hooks/use-wallet-operations-query";
import { useWalletEntriesQuery } from "@/features/wallet/hooks/use-wallet-query";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn();
 
let mockRouteParams: Record<string, string | string[] | undefined> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    canGoBack: mockCanGoBack,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("@/features/wallet/hooks/use-wallet-query", () => ({
  useWalletEntriesQuery: jest.fn(),
}));
jest.mock("@/features/wallet/hooks/use-wallet-operations-query", () => ({
  useWalletOperationsPositionQuery: jest.fn(),
}));
jest.mock("@/features/wallet/hooks/use-brapi-queries", () => ({
  useBrapiCurrentQuoteQuery: jest.fn(),
  useBrapiHistoricalPriceQuery: jest.fn(),
  useBrapiFiiQuoteQuery: jest.fn(),
}));

const mockedUseWallet = jest.mocked(useWalletEntriesQuery);
const mockedUsePosition = jest.mocked(useWalletOperationsPositionQuery);
const mockedUseCurrentQuote = jest.mocked(useBrapiCurrentQuoteQuery);
const mockedUseHistorical = jest.mocked(useBrapiHistoricalPriceQuery);
const mockedUseFii = jest.mocked(useBrapiFiiQuoteQuery);

const buildQuoteStub = <T,>(overrides: Partial<{ data: T; isLoading: boolean; error: unknown }> = {}) => ({
  data: undefined,
  isLoading: false,
  error: null,
  ...overrides,
});

const buildEntry = (override: Record<string, unknown> = {}) => ({
  id: "w-1",
  name: "Petrobras",
  value: 1000,
  estimatedValueOnCreateDate: null,
  ticker: "PETR4",
  quantity: 100,
  assetClass: "stocks",
  annualRate: null,
  targetWithdrawDate: null,
  registerDate: "2026-01-01",
  shouldBeOnWallet: true,
  ...override,
});

beforeEach(() => {
  mockRouteParams = { ticker: "petr4" };
  mockReplace.mockReset();
  mockBack.mockReset();
  mockPush.mockReset();
  mockCanGoBack.mockReset().mockReturnValue(false);
  mockedUseWallet.mockReturnValue({
    data: { items: [buildEntry()], total: 1000 },
  } as never);
  mockedUsePosition.mockReturnValue(buildQuoteStub() as never);
  mockedUseCurrentQuote.mockReturnValue(buildQuoteStub() as never);
  mockedUseHistorical.mockReturnValue(buildQuoteStub() as never);
  mockedUseFii.mockReturnValue(buildQuoteStub() as never);
});

describe("isFiiTicker", () => {
  it("identifica pattern de FII (4 letras + 11)", () => {
    expect(isFiiTicker("HGLG11")).toBe(true);
    expect(isFiiTicker("xpml11")).toBe(true);
  });
  it("rejeita tickers que nao sao FII", () => {
    expect(isFiiTicker("PETR4")).toBe(false);
    expect(isFiiTicker("VALE3")).toBe(false);
    expect(isFiiTicker("")).toBe(false);
  });
});

describe("useTickerDetailScreenController", () => {
  it("normaliza o ticker para uppercase", () => {
    mockRouteParams = { ticker: "petr4" };
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.ticker).toBe("PETR4");
  });

  it("recupera ticker do array param", () => {
    mockRouteParams = { ticker: ["petr4", "ignored"] };
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.ticker).toBe("PETR4");
  });

  it("encontra entry da carteira pelo ticker (case-insensitive)", () => {
    mockedUseWallet.mockReturnValue({
      data: { items: [buildEntry({ ticker: "petr4" })], total: 0 },
    } as never);
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.entry?.id).toBe("w-1");
    expect(result.current.hasMatchingEntry).toBe(true);
  });

  it("retorna entry null quando nenhum ativo bate com o ticker", () => {
    mockedUseWallet.mockReturnValue({
      data: { items: [buildEntry({ ticker: "VALE3" })], total: 0 },
    } as never);
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.entry).toBeNull();
    expect(result.current.hasMatchingEntry).toBe(false);
  });

  it("range padrao e 1mo e troca via handleSelectRange", () => {
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.selectedRange).toBe("1mo");
    act(() => {
      result.current.handleSelectRange("1y");
    });
    expect(result.current.selectedRange).toBe("1y");
  });

  it("expoe FII flag e habilita query de FII apenas quando padrao bate", () => {
    mockRouteParams = { ticker: "HGLG11" };
    mockedUseWallet.mockReturnValue({
      data: { items: [buildEntry({ ticker: "HGLG11" })], total: 0 },
    } as never);
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.isFii).toBe(true);
    expect(mockedUseFii).toHaveBeenCalledWith("HGLG11");
  });

  it("nao chama FII query para acoes nao-FII", () => {
    mockRouteParams = { ticker: "PETR4" };
    renderHook(() => useTickerDetailScreenController());
    expect(mockedUseFii).toHaveBeenCalledWith("");
  });

  it("buy/sell empurram para a tela de operacoes com entryId e intent", () => {
    const { result } = renderHook(() => useTickerDetailScreenController());
    act(() => {
      result.current.handleOpenBuy();
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/carteira-operacoes",
      params: { entryId: "w-1", intent: "buy" },
    });
    act(() => {
      result.current.handleOpenSell();
    });
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/carteira-operacoes",
      params: { entryId: "w-1", intent: "sell" },
    });
  });

  it("buy/sell nao navegam quando entry nao foi encontrada", () => {
    mockedUseWallet.mockReturnValue({
      data: { items: [], total: 0 },
    } as never);
    const { result } = renderHook(() => useTickerDetailScreenController());
    act(() => {
      result.current.handleOpenBuy();
      result.current.handleOpenSell();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handleBack volta quando ha historico de navegacao", () => {
    mockCanGoBack.mockReturnValue(true);
    const { result } = renderHook(() => useTickerDetailScreenController());
    act(() => {
      result.current.handleBack();
    });
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("handleBack faz replace para a carteira quando nao pode voltar", () => {
    mockCanGoBack.mockReturnValue(false);
    const { result } = renderHook(() => useTickerDetailScreenController());
    act(() => {
      result.current.handleBack();
    });
    expect(mockReplace).toHaveBeenCalledWith("/carteira");
  });

  it("expoe loading e errors das queries de cotacao", () => {
    const apiError = new Error("offline");
    mockedUseCurrentQuote.mockReturnValue(
      buildQuoteStub({ isLoading: true, error: apiError }) as never,
    );
    mockedUseHistorical.mockReturnValue(
      buildQuoteStub({ isLoading: false, error: apiError }) as never,
    );
    mockedUsePosition.mockReturnValue(
      buildQuoteStub({ isLoading: true, error: null }) as never,
    );
    const { result } = renderHook(() => useTickerDetailScreenController());
    expect(result.current.isCurrentQuoteLoading).toBe(true);
    expect(result.current.currentQuoteError).toBe(apiError);
    expect(result.current.historicalError).toBe(apiError);
    expect(result.current.isPositionLoading).toBe(true);
  });
});
