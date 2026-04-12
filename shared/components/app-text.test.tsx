import { render } from "@testing-library/react-native";

import { AppText } from "@/shared/components/app-text";
import { TestProviders } from "@/shared/testing/test-providers";

describe("AppText", () => {
  it("renderiza o texto no estilo default", () => {
    const { getByText } = render(
      <TestProviders>
        <AppText>Texto base</AppText>
      </TestProviders>,
    );

    expect(getByText("Texto base")).toBeTruthy();
  });

  it("renderiza variacoes de tamanho e tom", () => {
    const { getByText } = render(
      <TestProviders>
        <>
          <AppText size="caption" tone="muted">
            Texto auxiliar
          </AppText>
          <AppText size="bodySm" tone="primary">
            Texto destaque
          </AppText>
        </>
      </TestProviders>,
    );

    expect(getByText("Texto auxiliar")).toBeTruthy();
    expect(getByText("Texto destaque")).toBeTruthy();
  });
});
