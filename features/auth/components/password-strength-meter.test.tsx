import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { PasswordStrengthMeter } from "./password-strength-meter";

describe("PasswordStrengthMeter", () => {
  it("anuncia o nivel da senha para leitores de tela", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <PasswordStrengthMeter password="" />
      </AppProviders>,
    );

    expect(getByLabelText(/Forca da senha/i)).toBeTruthy();
  });

  it("nao mostra criterios faltantes quando senha e forte", () => {
    const { queryByText } = render(
      <AppProviders>
        <PasswordStrengthMeter password="Senha!Forte01" />
      </AppProviders>,
    );

    expect(queryByText(/Pelo menos/i)).toBeNull();
    expect(queryByText(/Senha forte/i)).toBeTruthy();
  });

  it("lista criterios faltantes quando senha e parcial", () => {
    const { getByText } = render(
      <AppProviders>
        <PasswordStrengthMeter password="abcdefghij" />
      </AppProviders>,
    );

    expect(getByText(/letra maiuscula/i)).toBeTruthy();
    expect(getByText(/numero/i)).toBeTruthy();
  });
});
