import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { PaywallGate } from "./paywall-gate";
import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";

jest.mock("@/features/entitlements/hooks/use-feature-access", () => ({
  useFeatureAccess: jest.fn(),
}));

const mockedUseFeatureAccess = jest.mocked(useFeatureAccess);

describe("PaywallGate", () => {
  beforeEach(() => {
    mockedUseFeatureAccess.mockReset();
  });

  it("nao renderiza nada enquanto o acesso esta carregando", () => {
    mockedUseFeatureAccess.mockReturnValue({
      hasAccess: false,
      isLoading: true,
    });

    const { queryByText } = render(
      <AppProviders>
        <PaywallGate featureKey="wallet_read">
          <Text>Conteudo protegido</Text>
        </PaywallGate>
      </AppProviders>,
    );

    expect(queryByText("Conteudo protegido")).toBeNull();
    expect(queryByText("Recurso Premium")).toBeNull();
  });

  it("renderiza o upgrade quando o usuario nao possui acesso", () => {
    mockedUseFeatureAccess.mockReturnValue({
      hasAccess: false,
      isLoading: false,
    });

    const { getByText, queryByText } = render(
      <AppProviders>
        <PaywallGate featureKey="wallet_read">
          <Text>Conteudo protegido</Text>
        </PaywallGate>
      </AppProviders>,
    );

    expect(getByText("Recurso Premium")).toBeTruthy();
    expect(queryByText("Conteudo protegido")).toBeNull();
  });

  it("libera o conteudo quando o usuario possui entitlement", () => {
    mockedUseFeatureAccess.mockReturnValue({
      hasAccess: true,
      isLoading: false,
    });

    const { getByText, queryByText } = render(
      <AppProviders>
        <PaywallGate featureKey="wallet_read">
          <Text>Conteudo protegido</Text>
        </PaywallGate>
      </AppProviders>,
    );

    expect(getByText("Conteudo protegido")).toBeTruthy();
    expect(queryByText("Recurso Premium")).toBeNull();
  });
});
