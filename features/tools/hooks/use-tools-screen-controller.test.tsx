import { act, renderHook } from "@testing-library/react-native";

import type { AnalyticsClient } from "@/core/observability/analytics-types";
import { useAnalytics } from "@/core/observability/use-analytics";
import { useToolsCatalogQuery } from "@/features/tools/hooks/use-tools-catalog-query";
import { useToolsScreenController } from "@/features/tools/hooks/use-tools-screen-controller";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: jest.fn(),
}));
jest.mock("@/features/tools/hooks/use-tools-catalog-query", () => ({
  useToolsCatalogQuery: jest.fn(),
}));

const mockedUseAnalytics = jest.mocked(useAnalytics);
const mockedUseToolsCatalogQuery = jest.mocked(useToolsCatalogQuery);

const analyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  screen: jest.fn(),
};

describe("useToolsScreenController analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAnalytics.mockReturnValue(analyticsClient);
    mockedUseToolsCatalogQuery.mockReturnValue({
      data: { tools: [] },
    } as never);
  });

  it("captures tool.used before routing to an enabled tool", () => {
    const { result } = renderHook(() => useToolsScreenController());

    act(() => {
      result.current.handleOpenTool({
        id: "fire",
        slug: "fire",
        name: "FIRE",
        description: "Independencia financeira",
        category: "investments",
        enabled: true,
        route: "/fire",
      });
    });

    expect(analyticsClient.capture).toHaveBeenCalledWith("tool.used", {
      slug: "fire",
    });
    expect(mockPush).toHaveBeenCalledWith("/fire");
  });

  it("does not capture disabled tools", () => {
    const { result } = renderHook(() => useToolsScreenController());

    act(() => {
      result.current.handleOpenTool({
        id: "future",
        slug: "future",
        name: "Future",
        description: "Em breve",
        category: "investments",
        enabled: false,
      });
    });

    expect(analyticsClient.capture).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
