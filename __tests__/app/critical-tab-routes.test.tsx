import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import CreditCardsRoute from "@/app/(private)/cartoes";
import InsightsRoute from "@/app/(private)/insights";
import type { CardsHomeController } from "@/features/credit-cards/hooks/use-cards-home-controller";
import type { CreditCardsScreenController } from "@/features/credit-cards/hooks/use-credit-cards-screen-controller";
import { AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY } from "@/features/insights/insights-config";
import { TourAnchorProvider } from "@/shared/coach-marks/tour-anchor-context";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/features/credit-cards/cards-tour/cards-tour", () => ({
  CardsTour: () => null,
}));

jest.mock("@/features/credit-cards/hooks/use-cards-home-controller", () => ({
  useCardsHomeController: (): Partial<CardsHomeController> => ({
    cardsQuery: {
      data: { creditCards: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: jest.fn(),
    } as never,
    selectCard: jest.fn(),
    setView: jest.fn(),
  }),
}));

jest.mock("@/features/credit-cards/hooks/use-credit-cards-screen-controller", () => ({
  useCreditCardsScreenController: (): Partial<CreditCardsScreenController> => ({
    creditCards: [],
    dismissSubmitError: jest.fn(),
    formMode: { kind: "closed" },
    handleCloseForm: jest.fn(),
    handleDelete: jest.fn(),
    handleOpenCreate: jest.fn(),
    handleOpenEdit: jest.fn(),
    handleSubmit: jest.fn(),
    isSubmitting: false,
    submitError: null,
  }),
}));

jest.mock("@/features/insights/hooks/use-insight-section", () => ({
  useInsightSection: () => null,
}));

jest.mock("@/features/insights/hooks/use-weekly-insight-query", () => ({
  useWeeklyInsight: () => ({
    fetchLatest: jest.fn(),
    insight: null,
    isLoading: false,
    isNew: false,
    markAsRead: jest.fn(),
    query: {},
  }),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

const renderRoute = (route: ReactElement) => {
  return render(
    <TestProviders>
      <TourAnchorProvider>{route}</TourAnchorProvider>
    </TestProviders>,
  );
};

describe("critical private tab routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsFeatureEnabled.mockReturnValue(true);
  });

  it("mounts the complete production Insights composition", () => {
    const { getByTestId } = renderRoute(<InsightsRoute />);

    expect(mockedIsFeatureEnabled).toHaveBeenCalledWith(
      AI_INSIGHTS_FLUIDA_FEATURE_FLAG_KEY,
    );
    expect(getByTestId("insights-fluida-screen")).toBeTruthy();
    expect(getByTestId("insights-chart-beat")).toBeTruthy();
  });

  it("mounts the complete Cards composition with its real screen tree", () => {
    const { getByTestId } = renderRoute(<CreditCardsRoute />);

    expect(getByTestId("credit-cards-screen")).toBeTruthy();
  });
});
