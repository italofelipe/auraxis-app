import { render } from "@testing-library/react-native";

import type { InsightSeries } from "@/features/insights/fluida/contracts";
import { ChartBeat } from "@/features/insights/fluida/components/chart-beat";
import { SERIES_LABELS } from "@/features/insights/fluida/series";
import { formatCurrency } from "@/shared/utils/formatters";
import { TestProviders } from "@/shared/testing/test-providers";

const series: InsightSeries = {
  daily: [1200, 0, 250, 0, 2650, 0, 11950],
  weekly: [4200, 980, 3100, 1400, 9800, 13650],
};

describe("ChartBeat", () => {
  it("renders the daily title and all 7 day labels for the daily cadence", () => {
    const { getByText } = render(
      <TestProviders>
        <ChartBeat series={series} cadence="daily" />
      </TestProviders>,
    );

    expect(getByText("Saídas · últimos 7 dias")).toBeTruthy();
    SERIES_LABELS.daily.forEach((label) => {
      expect(getByText(label)).toBeTruthy();
    });
  });

  it("renders the weekly title and all 6 week labels for the weekly cadence", () => {
    const { getByText } = render(
      <TestProviders>
        <ChartBeat series={series} cadence="weekly" />
      </TestProviders>,
    );

    expect(getByText("Saídas · últimas 6 semanas")).toBeTruthy();
    SERIES_LABELS.weekly.forEach((label) => {
      expect(getByText(label)).toBeTruthy();
    });
  });

  it("shows the peak value formatted as BRL in the legend", () => {
    const { getByText } = render(
      <TestProviders>
        <ChartBeat series={series} cadence="daily" />
      </TestProviders>,
    );

    expect(getByText(`pico: ${formatCurrency(11950)}`)).toBeTruthy();
  });

  it("draws one bar rect per series value", () => {
    const { UNSAFE_getAllByType } = render(
      <TestProviders>
        <ChartBeat series={series} cadence="weekly" />
      </TestProviders>,
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Rect } = require("react-native-svg");
    expect(UNSAFE_getAllByType(Rect)).toHaveLength(series.weekly.length);
  });
});
