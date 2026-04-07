import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { AppKeyValueRow } from "./app-key-value-row";

describe("AppKeyValueRow", () => {
  it("renderiza label, value e helper text com nós textuais", () => {
    const { getByText } = render(
      <AppProviders>
        <AppKeyValueRow
          label="Plano"
          value="Premium anual"
          helperText="Renovacao automatica"
        />
      </AppProviders>,
    );

    expect(getByText("Plano")).toBeTruthy();
    expect(getByText("Premium anual")).toBeTruthy();
    expect(getByText("Renovacao automatica")).toBeTruthy();
  });

  it("preserva React nodes customizados no valor", () => {
    const { getByText } = render(
      <AppProviders>
        <AppKeyValueRow
          label="Saldo"
          value={<Text>R$ 12.450,00</Text>}
        />
      </AppProviders>,
    );

    expect(getByText("Saldo")).toBeTruthy();
    expect(getByText("R$ 12.450,00")).toBeTruthy();
  });
});
