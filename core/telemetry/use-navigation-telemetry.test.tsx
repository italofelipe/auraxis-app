import { renderHook } from "@testing-library/react-native";
import { usePathname } from "expo-router";
import { getAnalyticsClient } from "@/core/observability/analytics-runtime";
import {
  buildNavigationRouteLogEntry,
  useNavigationTelemetry,
} from "@/core/telemetry/use-navigation-telemetry";

jest.mock("expo-router", () => ({
  usePathname: jest.fn(() => "/"),
}));
jest.mock("@/core/observability/analytics-runtime", () => ({
  getAnalyticsClient: jest.fn(),
}));
jest.mock("@/core/telemetry/app-logger", () => ({
  appLogger: {
    info: jest.fn(),
  },
}));

const mockAnalyticsClient = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  screen: jest.fn(),
};
const mockedGetAnalyticsClient = jest.mocked(getAnalyticsClient);
const mockedUsePathname = jest.mocked(usePathname);
const { appLogger } = jest.requireMock("@/core/telemetry/app-logger") as {
  appLogger: {
    info: jest.Mock;
  };
};

describe("useNavigationTelemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePathname.mockReturnValue("/");
    mockedGetAnalyticsClient.mockReturnValue(mockAnalyticsClient);
  });

  it("resolve metadados canônicos de rota a partir do pathname", () => {
    expect(buildNavigationRouteLogEntry("/dashboard")).toEqual({
      domain: "navigation",
      event: "navigation.route_changed",
      context: {
        route: "/dashboard",
        routeKey: "dashboard",
        access: "private",
        tabVisible: true,
      },
    });
  });

  it("normaliza rotas sem barra inicial e aplica fallback unknown", () => {
    expect(buildNavigationRouteLogEntry("rota-desconhecida")).toEqual({
      domain: "navigation",
      event: "navigation.route_changed",
      context: {
        route: "/rota-desconhecida",
        routeKey: "unknown",
        access: "unknown",
        tabVisible: false,
      },
    });
  });

  it("normaliza a raiz e evita log duplicado para a mesma rota", () => {
    expect(buildNavigationRouteLogEntry("/")).toEqual({
      domain: "navigation",
      event: "navigation.route_changed",
      context: {
        route: "/",
        routeKey: "root",
        access: "root",
        tabVisible: false,
      },
    });

    const { rerender } = renderHook(() => useNavigationTelemetry());
    rerender({});

    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "navigation",
      event: "navigation.route_changed",
      context: {
        route: "/",
        routeKey: "root",
        access: "root",
        tabVisible: false,
      },
    });
    expect(mockAnalyticsClient.screen).toHaveBeenCalledWith("/", {
      access: "root",
      routeKey: "root",
      tabVisible: false,
    });
  });

  it("evita screen view duplicado quando pathnames diferentes normalizam para a mesma rota", () => {
    mockedUsePathname.mockReturnValueOnce("/").mockReturnValueOnce("///");

    const { rerender } = renderHook(() => useNavigationTelemetry());
    rerender({});

    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(mockAnalyticsClient.screen).toHaveBeenCalledTimes(1);
  });

  it("nao emite log nem screen view quando desabilitado", () => {
    renderHook(() => useNavigationTelemetry(false));

    expect(appLogger.info).not.toHaveBeenCalled();
    expect(mockAnalyticsClient.screen).not.toHaveBeenCalled();
  });
});
