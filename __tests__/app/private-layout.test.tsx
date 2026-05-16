import type { ReactNode } from "react";

import { render } from "@testing-library/react-native";

import PrivateLayout from "@/app/(private)/_layout";
import { usePrivateRouteGuard } from "@/core/navigation/use-route-guards";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";

const mockTabsScreens: {
  name: string;
  options?: Record<string, unknown>;
}[] = [];

jest.mock("expo-router", () => {
  function MockTabs({ children }: { readonly children: ReactNode }): ReactNode {
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

const mockedUsePrivateRouteGuard = jest.mocked(usePrivateRouteGuard);
const mockedUseWeeklyInsight = jest.mocked(useWeeklyInsight);

const buildInsightState = (isNew: boolean): ReturnType<typeof useWeeklyInsight> =>
  ({
    insight: null,
    isLoading: false,
    isNew,
    fetchLatest: jest.fn(),
    markAsRead: jest.fn(),
    query: {},
  }) as unknown as ReturnType<typeof useWeeklyInsight>;

describe("PrivateLayout", () => {
  beforeEach(() => {
    mockTabsScreens.length = 0;
    mockedUsePrivateRouteGuard.mockReturnValue({ ready: true, redirectTo: null });
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(false));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("exibe badge no tab do dashboard quando existe insight novo", () => {
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(true));

    render(<PrivateLayout />);

    const dashboardScreen = mockTabsScreens.find((screen) => screen.name === "dashboard");
    expect(dashboardScreen?.options?.tabBarBadge).toBe("1");
  });

  it("omite badge no tab do dashboard quando o insight ja foi lido", () => {
    mockedUseWeeklyInsight.mockReturnValue(buildInsightState(false));

    render(<PrivateLayout />);

    const dashboardScreen = mockTabsScreens.find((screen) => screen.name === "dashboard");
    expect(dashboardScreen?.options?.tabBarBadge).toBeUndefined();
  });
});
