import { fireEvent, render } from "@testing-library/react-native";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { InsightsFluidaScreen } from "@/features/insights/screens/insights-fluida-screen";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/core/shell/use-resolved-theme", () => ({
  useResolvedTheme: jest.fn(),
}));

const mockedUseResolvedTheme = jest.mocked(useResolvedTheme);

beforeEach(() => {
  mockedUseResolvedTheme.mockReturnValue("auraxis_light");
});

describe("InsightsFluidaScreen", () => {
  it("renders the masthead and the general · daily lead by default", () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <InsightsFluidaScreen />
      </TestProviders>,
    );

    expect(getByTestId("insights-masthead")).toBeTruthy();
    expect(getByTestId("insight-lead")).toBeTruthy();
    expect(getByText("Ontem em foco: muita saída, nenhuma entrada")).toBeTruthy();
  });

  it("swaps the lead when another theme tab is selected", () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <InsightsFluidaScreen />
      </TestProviders>,
    );

    fireEvent.press(getByTestId("insights-theme-tab-transactions"));

    expect(getByText("Dia leve, mas dentro de um mês concentrado")).toBeTruthy();
  });

  it("swaps the lead when the cadence switches to weekly", () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <InsightsFluidaScreen />
      </TestProviders>,
    );

    fireEvent.press(getByTestId("insights-cadence-weekly"));

    expect(getByText("A semana puxada pela fatura em atraso")).toBeTruthy();
  });

  it("renders the comparative, chart and pull-stat beats on the general dimension", () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <InsightsFluidaScreen />
      </TestProviders>,
    );

    expect(getByTestId("insights-compare-beat")).toBeTruthy();
    expect(getByText("Como se compara")).toBeTruthy();
    expect(getByTestId("insights-chart-beat")).toBeTruthy();
    expect(getByText("Saídas · últimos 7 dias")).toBeTruthy();
    expect(getByTestId("insights-pull-stat")).toBeTruthy();
  });

  it("hides the comparative beat on a non-general dimension but keeps the chart", () => {
    const { getByTestId, queryByTestId } = render(
      <TestProviders>
        <InsightsFluidaScreen />
      </TestProviders>,
    );

    fireEvent.press(getByTestId("insights-theme-tab-transactions"));

    expect(queryByTestId("insights-compare-beat")).toBeNull();
    expect(getByTestId("insights-chart-beat")).toBeTruthy();
    expect(getByTestId("insights-pull-stat")).toBeTruthy();
  });
});
