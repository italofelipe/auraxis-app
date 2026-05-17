import { renderHook } from "@testing-library/react-native";

import {
  ANALYTICS_EVENT_NAMES,
  resetAnalyticsRuntimeForTesting,
  setAnalyticsClient,
  setAnalyticsCollectionEnabled,
} from "@/core/observability/analytics-runtime";
import { useAnalytics } from "@/core/observability/use-analytics";
import type { AnalyticsClient } from "@/core/observability/analytics-types";

const makeAnalyticsClient = (): jest.Mocked<AnalyticsClient> => {
  return {
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    screen: jest.fn(),
    setCollectionEnabled: jest.fn(),
  };
};

describe("useAnalytics", () => {
  beforeEach(() => {
    resetAnalyticsRuntimeForTesting();
  });

  it("expoe um cliente noop seguro quando nenhum provider esta configurado", () => {
    const { result } = renderHook(() => useAnalytics());

    expect(() => {
      result.current.capture("auth.login.success", {
        method: "password",
      });
      result.current.identify("user-123");
      result.current.screen("/dashboard");
      result.current.reset();
    }).not.toThrow();
  });

  it("mantem catalogo tipado para os eventos-chave do epic de observabilidade", () => {
    expect(ANALYTICS_EVENT_NAMES).toEqual([
      "auth.login.success",
      "auth.register.completed",
      "auth.logout",
      "transaction.created",
      "transaction.deleted",
      "transaction.restored",
      "goal.created",
      "goal.simulated",
      "tool.used",
      "subscription.checkout.opened",
      "subscription.checkout.completed",
      "dashboard.period.changed",
    ]);
  });

  it("encaminha eventos e traits sanitizados quando a coleta esta habilitada", () => {
    const analyticsClient = makeAnalyticsClient();
    setAnalyticsClient(analyticsClient);
    setAnalyticsCollectionEnabled(true);

    const { result } = renderHook(() => useAnalytics());

    result.current.capture("auth.login.success", {
      method: "password",
      email: "person@example.com",
      nested: {
        apiKey: "secret-key",
      },
    });
    result.current.identify("user-123", {
      plan: "premium",
      email: "person@example.com",
    });
    result.current.screen("/dashboard", {
      email: "person@example.com",
      routeKey: "dashboard",
    });
    result.current.reset();

    expect(analyticsClient.capture).toHaveBeenCalledWith(
      "auth.login.success",
      {
        method: "password",
        email: "<redacted>",
        nested: {
          apiKey: "<redacted>",
        },
      },
    );
    expect(analyticsClient.identify).toHaveBeenCalledWith("user-123", {
      plan: "premium",
      email: "<redacted>",
    });
    expect(analyticsClient.screen).toHaveBeenCalledWith("/dashboard", {
      email: "<redacted>",
      routeKey: "dashboard",
    });
    expect(analyticsClient.reset).toHaveBeenCalledTimes(1);
  });

  it("bloqueia capture e identify quando a coleta esta desabilitada", () => {
    const analyticsClient = makeAnalyticsClient();
    setAnalyticsClient(analyticsClient);
    setAnalyticsCollectionEnabled(false);

    const { result } = renderHook(() => useAnalytics());

    result.current.capture("tool.used", {
      slug: "salary-raise-calculator",
    });
    result.current.identify("user-123", {
      plan: "premium",
    });
    result.current.screen("/dashboard");
    result.current.reset();

    expect(analyticsClient.capture).not.toHaveBeenCalled();
    expect(analyticsClient.identify).not.toHaveBeenCalled();
    expect(analyticsClient.screen).not.toHaveBeenCalled();
    expect(analyticsClient.reset).toHaveBeenCalledTimes(1);
  });

  it("forwards collection preference changes to providers", () => {
    const analyticsClient = makeAnalyticsClient();
    setAnalyticsClient(analyticsClient);

    setAnalyticsCollectionEnabled(false);
    setAnalyticsCollectionEnabled(true);

    expect(analyticsClient.setCollectionEnabled).toHaveBeenNthCalledWith(1, false);
    expect(analyticsClient.setCollectionEnabled).toHaveBeenNthCalledWith(2, true);
  });
});
