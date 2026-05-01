import { fireEvent, render } from "@testing-library/react-native";

import {
  useTickerDetailScreenController,
  type TickerDetailScreenController,
} from "@/features/wallet/hooks/use-ticker-detail-screen-controller";
import { TickerDetailScreen } from "@/features/wallet/screens/ticker-detail-screen";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/wallet/hooks/use-ticker-detail-screen-controller", () => ({
  useTickerDetailScreenController: jest.fn(),
}));

const mockedController = jest.mocked(useTickerDetailScreenController);

const buildController = (
  overrides: Partial<TickerDetailScreenController> = {},
): TickerDetailScreenController => ({
  ticker: "PETR4",
  entry: null,
  currentQuote: null,
  historicalSeries: null,
  fiiQuote: null,
  position: null,
  selectedRange: "1mo",
  availableRanges: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"],
  isFii: false,
  isCurrentQuoteLoading: false,
  isHistoricalLoading: false,
  isFiiLoading: false,
  isPositionLoading: false,
  currentQuoteError: null,
  historicalError: null,
  positionError: null,
  hasMatchingEntry: false,
  handleSelectRange: jest.fn(),
  handleOpenBuy: jest.fn(),
  handleOpenSell: jest.fn(),
  handleBack: jest.fn(),
  ...overrides,
});

const wrap = (ui: React.ReactElement) => <TestProviders>{ui}</TestProviders>;

describe("TickerDetailScreen", () => {
  it("renderiza o ticker no header", () => {
    mockedController.mockReturnValue(buildController());
    const { getByText } = render(wrap(<TickerDetailScreen />));
    expect(getByText("PETR4")).toBeTruthy();
  });

  it("mostra preco e variacao quando ha cotacao", () => {
    mockedController.mockReturnValue(
      buildController({
        currentQuote: {
          ticker: "PETR4",
          shortName: "PETR",
          price: 41.5,
          change: 1,
          changePercent: 2.5,
          currency: "BRL",
          logo: null,
        },
      }),
    );
    const { getByText } = render(wrap(<TickerDetailScreen />));
    expect(getByText(/41,50/)).toBeTruthy();
    expect(getByText(/\+2\.50%/)).toBeTruthy();
  });

  it("mostra estado de loading quando cotacao esta carregando sem dado", () => {
    mockedController.mockReturnValue(
      buildController({ isCurrentQuoteLoading: true }),
    );
    const { getByText } = render(wrap(<TickerDetailScreen />));
    expect(getByText(/Carregando cotacao/)).toBeTruthy();
  });

  it("renderiza notice de erro quando cotacao falha", () => {
    mockedController.mockReturnValue(
      buildController({
        currentQuoteError: { message: "boom" } as never,
      }),
    );
    const { getByText } = render(wrap(<TickerDetailScreen />));
    expect(getByText(/Nao foi possivel carregar a cotacao/)).toBeTruthy();
  });

  it("disparar Voltar chama handleBack do controller", () => {
    const handleBack = jest.fn();
    mockedController.mockReturnValue(buildController({ handleBack }));
    const { getByText } = render(wrap(<TickerDetailScreen />));
    fireEvent.press(getByText("Voltar"));
    expect(handleBack).toHaveBeenCalled();
  });

  it("renderiza card de FII apenas quando ticker e FII", () => {
    mockedController.mockReturnValue(
      buildController({
        ticker: "HGLG11",
        isFii: true,
        fiiQuote: {
          ticker: "HGLG11",
          shortName: "HGLG",
          price: 100,
          changePercent: 0,
          currency: "BRL",
          dividends: [],
          lastDividend: {
            paymentDate: "2026-01-10",
            adjustedValue: 0.95,
            type: "Rendimento",
          },
        },
      }),
    );
    const { getByText } = render(wrap(<TickerDetailScreen />));
    expect(getByText("Ultimo provento")).toBeTruthy();
    expect(getByText(/0,95/)).toBeTruthy();
  });

  it("nao renderiza card de FII para acoes normais", () => {
    mockedController.mockReturnValue(buildController({ isFii: false }));
    const { queryByText } = render(wrap(<TickerDetailScreen />));
    expect(queryByText("Ultimo provento")).toBeNull();
  });

  it("Comprar dispara handleOpenBuy", () => {
    const handleOpenBuy = jest.fn();
    mockedController.mockReturnValue(
      buildController({
        position: {
          entryId: "w-1",
          currentQuantity: 100,
          averagePrice: 30,
          investedAmount: 3000,
          realizedProfit: 0,
        },
        handleOpenBuy,
      }),
    );
    const { getByText } = render(wrap(<TickerDetailScreen />));
    fireEvent.press(getByText("Comprar"));
    expect(handleOpenBuy).toHaveBeenCalled();
  });

  it("mostra mensagem quando ticker nao esta na carteira", () => {
    mockedController.mockReturnValue(
      buildController({ position: null, hasMatchingEntry: false }),
    );
    const { getByText } = render(wrap(<TickerDetailScreen />));
    expect(getByText(/Adicione este ticker a carteira/)).toBeTruthy();
  });
});
