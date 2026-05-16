import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AppProviders } from "@/core/providers/app-providers";
import { FocusScreen } from "@/features/focus/screens/focus-screen";
import { useFocusScreenController } from "@/features/focus/hooks/use-focus-screen-controller";

jest.mock("@/features/focus/hooks/use-focus-screen-controller", () => ({
  useFocusScreenController: jest.fn(),
}));

jest.mock("@/features/entitlements/components/paywall-gate", () => {
  const ReactInner = jest.requireActual("react");
  const ReactNative = jest.requireActual("react-native");

  return {
    PaywallGate: ({
      featureKey,
      children,
    }: {
      readonly featureKey: string;
      readonly children: ReactNode;
    }) =>
      ReactInner.createElement(
        ReactNative.View,
        { testID: `paywall-${featureKey}` },
        children,
      ),
  };
});

const mockedUseController = jest.mocked(useFocusScreenController);

const buildController = (
  overrides: Partial<ReturnType<typeof useFocusScreenController>> = {},
) =>
  ({
    overviewQuery: {
      data: null,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    },
    trendsQuery: {
      data: null,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    },
    metricIds: ["freeBalanceAfterFixed"],
    selectedMetricId: "freeBalanceAfterFixed",
    metric: {
      id: "freeBalanceAfterFixed",
      label: "Saldo livre",
      caption: "Depois dos fixos",
      value: 1250,
      unit: "currency",
      trend: null,
      unavailable: false,
    },
    handleSelectMetric: jest.fn(),
    ...overrides,
  }) as never;

const renderWithProviders = (
  controller: ReturnType<typeof buildController>,
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue(controller);
  return render(
    <AppProviders>
      <FocusScreen />
    </AppProviders>,
  );
};

describe("FocusScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("protege a tela com entitlement focus_mode", () => {
    const { getByTestId, getByText } = renderWithProviders(buildController());

    expect(getByTestId("paywall-focus_mode")).toBeTruthy();
    expect(getByText("O numero que importa")).toBeTruthy();
  });
});
