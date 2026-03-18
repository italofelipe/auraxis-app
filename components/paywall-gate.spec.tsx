import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { PaywallGate } from "@/components/paywall-gate";
import type { FeatureAccessResult } from "@/hooks/use-feature-access";

const mockUseFeatureAccess = jest.fn<FeatureAccessResult, [unknown]>();

jest.mock("@/hooks/use-feature-access", () => ({
  useFeatureAccess: (...args: readonly unknown[]) => mockUseFeatureAccess(args[0]),
}));

jest.mock("@/lib/web-urls", () => ({
  PLANS_URL: "https://app.auraxis.com.br/planos",
}));

describe("PaywallGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza filhos quando o acesso está liberado", () => {
    mockUseFeatureAccess.mockReturnValue({ hasAccess: true, isLoading: false });

    const { getByText } = render(
      <PaywallGate featureKey="advanced_simulations">
        <Text>Conteúdo premium</Text>
      </PaywallGate>,
    );

    expect(getByText("Conteúdo premium")).toBeTruthy();
  });

  it("renderiza UpgradeCTA quando o acesso não está liberado", () => {
    mockUseFeatureAccess.mockReturnValue({ hasAccess: false, isLoading: false });

    const { getByTestId, queryByText } = render(
      <PaywallGate featureKey="advanced_simulations">
        <Text>Conteúdo premium</Text>
      </PaywallGate>,
    );

    expect(getByTestId("upgrade-cta")).toBeTruthy();
    expect(queryByText("Conteúdo premium")).toBeNull();
  });
});
