import type { ReactNode } from "react";

import { render } from "@testing-library/react-native";

import PrivateLayout from "@/app/(private)/_layout";
import { usePrivateRouteGuard } from "@/core/navigation/use-route-guards";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { TestProviders } from "@/shared/testing/test-providers";

const mockTabsScreens: {
  name: string;
  options?: Record<string, unknown>;
}[] = [];
let mockTabsScreenOptions: Record<string, unknown> | undefined;

jest.mock("expo-router", () => {
  function MockTabs({
    children,
    screenOptions,
  }: {
    readonly children: ReactNode;
    readonly screenOptions?: Record<string, unknown>;
  }): ReactNode {
    mockTabsScreenOptions = screenOptions;
    return children;
  }

  function MockTabsScreen(props: {
    readonly name: string;
    readonly options?: Record<string, unknown>;
  }): null {
    mockTabsScreens.push({ name: props.name, options: props.options });
    return null;
  }

  function MockRedirect(): null {
    return null;
  }

  const Tabs = Object.assign(MockTabs, { Screen: MockTabsScreen });

  return {
    Redirect: MockRedirect,
    Tabs,
  };
});

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

jest.mock("@/core/navigation/use-route-guards", () => ({
  usePrivateRouteGuard: jest.fn(),
}));

jest.mock("@/features/entitlements/hooks/use-entitlements-foreground-refresh", () => ({
  useEntitlementsForegroundRefresh: jest.fn(),
}));

jest.mock("@/features/insights/hooks/use-weekly-insight-query", () => ({
  useWeeklyInsight: jest.fn(),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedUsePrivateRouteGuard = jest.mocked(usePrivateRouteGuard);
const mockedUseWeeklyInsight = jest.mocked(useWeeklyInsight);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

const buildInsightState = (isNew: boolean): ReturnType<typeof useWeeklyInsight> =>
  ({
    insight: null,
    isLoading: false,
    isNew,
    fetchLatest: jest.fn(),
    markAsRead: jest.fn(),
    query: {},
  }) as unknown as ReturnType<typeof useWeeklyInsight>;

const renderPrivateLayout = () => {
  return render(
    <TestProviders>
      <PrivateLayout />
    </TestProviders>,
  );
};

describe("PrivateLayout", () => {
  beforeEach(() => {
    mockTabsScreens.length = 0;
    mockTabsScreenOptions = undefined;
    mockedUsePrivateRouteGuard.mockReturnValue({ ready: true, redirectTo: null });
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(false));
    mockedIsFeatureEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("exibe badge no tab do dashboard quando existe insight novo", () => {
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(true));

    renderPrivateLayout();

    const dashboardScreen = mockTabsScreens.find((screen) => screen.name === "dashboard");
    expect(dashboardScreen?.options?.tabBarBadge).toBe("1");
  });

  it("omite badge no tab do dashboard quando o insight ja foi lido", () => {
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(false));

    renderPrivateLayout();

    const dashboardScreen = mockTabsScreens.find((screen) => screen.name === "dashboard");
    expect(dashboardScreen?.options?.tabBarBadge).toBeUndefined();
  });

  it("desativa query e badge do insight semanal quando a feature flag esta desligada", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(true));

    renderPrivateLayout();

    const dashboardScreen = mockTabsScreens.find((screen) => screen.name === "dashboard");
    expect(mockedUseWeeklyInsight).toHaveBeenCalledWith({ enabled: false });
    expect(dashboardScreen?.options?.tabBarBadge).toBeUndefined();
  });

  it("configura a tab bar com tokens semanticos do tema ativo", () => {
    renderPrivateLayout();

    expect(mockTabsScreenOptions).toMatchObject({
      headerShown: false,
      tabBarActiveTintColor: "#087FA7",
      tabBarInactiveTintColor: "#7A8BA3",
      tabBarStyle: {
        backgroundColor: "#ffffff",
        borderTopColor: "#D8E3EF",
      },
    });
  });
});
