import { render } from "@testing-library/react-native";

import { AppMetricCard } from "@/shared/components/app-metric-card";
import { TestProviders } from "@/shared/testing/test-providers";

describe("AppMetricCard", () => {
  it("renderiza label e valor", () => {
    const { getByText } = render(
      <TestProviders>
        <AppMetricCard label="Saldo" value="R$ 1.200,00" />
      </TestProviders>,
    );

    expect(getByText("Saldo")).toBeTruthy();
    expect(getByText("R$ 1.200,00")).toBeTruthy();
  });

  it("renderiza helper quando fornecido", () => {
    const { getByText } = render(
      <TestProviders>
        <AppMetricCard
          label="Economia"
          value="R$ 250,00"
          helper="Comparado ao mes anterior"
        />
      </TestProviders>,
    );

    expect(getByText("Comparado ao mes anterior")).toBeTruthy();
  });

  it("renderiza a tendência com seta direcional", () => {
    const { getByText } = render(
      <TestProviders>
        <AppMetricCard
          label="Saldo"
          value="R$ 10,00"
          trend={{ direction: "up", label: "+12%" }}
        />
      </TestProviders>,
    );

    expect(getByText("↑ +12%")).toBeTruthy();
  });
});
