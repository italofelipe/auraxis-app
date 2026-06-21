import { fireEvent, render } from "@testing-library/react-native";

import { InsightsMasthead } from "@/features/insights/fluida/components/insights-masthead";
import type {
  InsightCadenceOption,
  InsightDimensionTab,
} from "@/features/insights/hooks/use-insights-fluida-screen-controller";
import { TestProviders } from "@/shared/testing/test-providers";

const cadenceOptions: readonly InsightCadenceOption[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
];

const dimensionTabs: readonly InsightDimensionTab[] = [
  { value: "general", label: "Visao geral" },
  { value: "transactions", label: "Transacoes" },
  { value: "goals", label: "Metas" },
];

const renderMasthead = (
  overrides: Partial<React.ComponentProps<typeof InsightsMasthead>> = {},
) => {
  const onSelectCadence = jest.fn();
  const onSelectDimension = jest.fn();
  const onToggleTheme = jest.fn();
  const utils = render(
    <TestProviders>
      <InsightsMasthead
        cadence="daily"
        dimension="general"
        cadenceOptions={cadenceOptions}
        dimensionTabs={dimensionTabs}
        isDark={false}
        onSelectCadence={onSelectCadence}
        onSelectDimension={onSelectDimension}
        onToggleTheme={onToggleTheme}
        {...overrides}
      />
    </TestProviders>,
  );
  return { ...utils, onSelectCadence, onSelectDimension, onToggleTheme };
};

describe("InsightsMasthead", () => {
  it("shows 'Leitura diária' for the daily cadence", () => {
    const { getByText } = renderMasthead();
    expect(getByText("Leitura diária")).toBeTruthy();
  });

  it("shows 'Leitura semanal' for the weekly cadence", () => {
    const { getByText } = renderMasthead({ cadence: "weekly" });
    expect(getByText("Leitura semanal")).toBeTruthy();
  });

  it("forwards the chosen cadence to the handler", () => {
    const { getByTestId, onSelectCadence } = renderMasthead();
    fireEvent.press(getByTestId("insights-cadence-weekly"));
    expect(onSelectCadence).toHaveBeenCalledWith("weekly");
  });

  it("forwards the chosen dimension to the handler", () => {
    const { getByTestId, onSelectDimension } = renderMasthead();
    fireEvent.press(getByTestId("insights-theme-tab-transactions"));
    expect(onSelectDimension).toHaveBeenCalledWith("transactions");
  });

  it("forwards theme-mode taps to the toggle handler", () => {
    const { getByTestId, onToggleTheme } = renderMasthead();
    fireEvent.press(getByTestId("insights-theme-mode-toggle"));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
