import { renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppState } from "react-native";

import { useEntitlementsForegroundRefresh } from "@/features/entitlements/hooks/use-entitlements-foreground-refresh";

const wrapper = (client: QueryClient) => {
  const Provider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Provider.displayName = "TestQueryClientProvider";
  return Provider;
};

describe("useEntitlementsForegroundRefresh", () => {
  let client: QueryClient;
  let listeners: ((state: string) => void)[];
  let removeMock: jest.Mock;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    listeners = [];
    removeMock = jest.fn();
    jest.spyOn(AppState, "addEventListener").mockImplementation(
      ((event: string, callback: (state: string) => void) => {
        if (event === "change") {
          listeners.push(callback);
        }
        return { remove: removeMock } as never;
      }) as never,
    );
    Object.defineProperty(AppState, "currentState", {
      get: () => "active",
      configurable: true,
    });
  });

  it("invalida subscription e entitlements ao voltar para foreground", () => {
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    renderHook(() => useEntitlementsForegroundRefresh(), {
      wrapper: wrapper(client),
    });

    listeners[0]?.("background");
    listeners[0]?.("active");

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["subscription"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["entitlements"] }),
    );
  });

  it("nao invalida quando o app ja esta em foreground", () => {
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    renderHook(() => useEntitlementsForegroundRefresh(), {
      wrapper: wrapper(client),
    });

    listeners[0]?.("active");

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("remove o listener no unmount", () => {
    const { unmount } = renderHook(() => useEntitlementsForegroundRefresh(), {
      wrapper: wrapper(client),
    });

    unmount();
    expect(removeMock).toHaveBeenCalled();
  });
});
