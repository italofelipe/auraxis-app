import { render } from "@testing-library/react-native";

import CreditCardsRoute from "@/app/(private)/cartoes";
import InsightsRoute from "@/app/(private)/insights";
import { AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY } from "@/features/insights/insights-config";
import { isFeatureEnabled } from "@/shared/feature-flags";

const mockInsightsFluidaScreen = jest.fn(() => null);
const mockCreditCardsScreen = jest.fn(() => null);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
}));

jest.mock("@/features/insights/screens/ai-insights-screen", () => ({
  AiInsightsScreen: () => null,
}));

jest.mock("@/features/insights/screens/insights-fluida-screen", () => ({
  InsightsFluidaScreen: () => mockInsightsFluidaScreen(),
}));

jest.mock("@/features/credit-cards/screens/credit-cards-screen", () => ({
  CreditCardsScreen: () => mockCreditCardsScreen(),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

describe("critical private tab routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsFeatureEnabled.mockReturnValue(true);
  });

  it("mounts the production Insights route without throwing", () => {
    expect(() => render(<InsightsRoute />)).not.toThrow();

    expect(mockedIsFeatureEnabled).toHaveBeenCalledWith(
      AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY,
    );
    expect(mockInsightsFluidaScreen).toHaveBeenCalledTimes(1);
  });

  it("mounts the Cards route without throwing", () => {
    expect(() => render(<CreditCardsRoute />)).not.toThrow();

    expect(mockCreditCardsScreen).toHaveBeenCalledTimes(1);
  });
});
