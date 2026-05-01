import { render } from "@testing-library/react-native";

import type { BrapiPricePoint } from "@/features/wallet/brapi-contracts";
import { TickerPriceChart } from "@/features/wallet/components/ticker-price-chart";
import { TestProviders } from "@/shared/testing/test-providers";

const wrap = (ui: React.ReactElement) => <TestProviders>{ui}</TestProviders>;

const buildPoint = (override: Partial<BrapiPricePoint>): BrapiPricePoint => ({
  timestamp: 1_700_000_000,
  date: "2026-01-01",
  open: 10,
  high: 12,
  low: 9,
  close: 11,
  volume: 100,
  adjustedClose: 11,
  ...override,
});

describe("TickerPriceChart", () => {
  it("renderiza estado vazio quando nao ha pontos", () => {
    const { getByTestId, queryByTestId } = render(
      wrap(<TickerPriceChart points={[]} />),
    );
    expect(getByTestId("ticker-price-chart-empty")).toBeTruthy();
    expect(queryByTestId("ticker-price-chart-canvas")).toBeNull();
  });

  it("renderiza canvas quando ha pontos", () => {
    const points: BrapiPricePoint[] = [
      buildPoint({ close: 10, timestamp: 1 }),
      buildPoint({ close: 12, timestamp: 2 }),
      buildPoint({ close: 11, timestamp: 3 }),
    ];
    const { getByTestId, getByText } = render(
      wrap(<TickerPriceChart points={points} />),
    );
    expect(getByTestId("ticker-price-chart-canvas")).toBeTruthy();
    expect(getByText("3 pontos")).toBeTruthy();
  });

  it("calcula maxima e minima corretamente", () => {
    const points: BrapiPricePoint[] = [
      buildPoint({ close: 50, timestamp: 1 }),
      buildPoint({ close: 80, timestamp: 2 }),
      buildPoint({ close: 60, timestamp: 3 }),
    ];
    const { getByText } = render(wrap(<TickerPriceChart points={points} />));
    expect(getByText(/Maxima:.*80/)).toBeTruthy();
    expect(getByText(/Minima:.*50/)).toBeTruthy();
  });

  it("amostra pontos quando serie e muito longa", () => {
    const points: BrapiPricePoint[] = Array.from({ length: 200 }, (_, index) =>
      buildPoint({ close: 100 + index, timestamp: index }),
    );
    const { getByText } = render(wrap(<TickerPriceChart points={points} />));
    expect(getByText("200 pontos")).toBeTruthy();
  });

  it("mostra variacao com sinal positivo quando ultimo close e maior", () => {
    const points: BrapiPricePoint[] = [
      buildPoint({ close: 100, timestamp: 1 }),
      buildPoint({ close: 110, timestamp: 2 }),
    ];
    const { getByText } = render(wrap(<TickerPriceChart points={points} />));
    expect(getByText("+10.00%")).toBeTruthy();
  });

  it("mostra variacao negativa quando ultimo close e menor", () => {
    const points: BrapiPricePoint[] = [
      buildPoint({ close: 100, timestamp: 1 }),
      buildPoint({ close: 90, timestamp: 2 }),
    ];
    const { getByText } = render(wrap(<TickerPriceChart points={points} />));
    expect(getByText("-10.00%")).toBeTruthy();
  });
});
