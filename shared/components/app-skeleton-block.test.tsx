import { render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { AppSkeletonBlock } from "./app-skeleton-block";

describe("AppSkeletonBlock", () => {
  it("renderiza copy e semantica de progresso para estados de loading", () => {
    const { getByLabelText, getByText } = render(
      <TestProviders>
        <AppSkeletonBlock
          title="Carregando painel"
          description="Preparando as informacoes financeiras."
          lines={4}
        />
      </TestProviders>,
    );

    expect(getByLabelText("Carregando painel")).toBeTruthy();
    expect(getByText("Carregando painel")).toBeTruthy();
    expect(getByText("Preparando as informacoes financeiras.")).toBeTruthy();
  });
});
