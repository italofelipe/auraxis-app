import type { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/core/http/api-error";
import { queryKeys } from "@/core/query/query-keys";
import { createRuntimeRevalidationService } from "@/core/shell/runtime-revalidation";
import {
  makeSessionState,
  makeSessionUser,
  resetRuntimeStores,
} from "@/shared/testing/runtime-fixtures";

const createQueryClientMock = (): QueryClient => {
  return {
    cancelQueries: jest.fn().mockResolvedValue(undefined),
    fetchQuery: jest.fn(),
    invalidateQueries: jest.fn(),
    removeQueries: jest.fn(),
  } as unknown as QueryClient;
};

describe("runtime revalidation service - error handling", () => {
  it("derruba a sessao quando a revalidacao encontra erro de autorizacao", async () => {
    resetRuntimeStores({
      session: makeSessionState({
        accessToken: "token",
        refreshToken: "refresh",
        user: makeSessionUser(),
        userEmail: "italo@auraxis.dev",
        hydrated: true,
        isAuthenticated: true,
      }),
    });

    const queryClient = createQueryClientMock();
    const signOut = jest.fn().mockResolvedValue(undefined);
    const setEntitlementsVersion = jest.fn();
    const recordForegroundSync = jest.fn();

    (queryClient.fetchQuery as jest.Mock).mockRejectedValue(
      new ApiError({
        message: "Sessao expirada.",
        status: 401,
      }),
    );

    const service = createRuntimeRevalidationService({
      queryClient,
      bootstrapService: {
        getBootstrap: jest.fn(),
      },
      subscriptionService: {
        getSubscription: jest.fn(),
      },
      signOut,
      setEntitlementsVersion,
      recordForegroundSync,
      markSessionValidated: jest.fn(),
    });

    const result = await service.revalidate("checkout-return");

    expect(result).toEqual({
      revalidated: false,
      signedOut: true,
      entitlementsVersion: null,
    });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setEntitlementsVersion).toHaveBeenCalledWith(null);
    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.bootstrap.root,
    });
    expect(queryClient.cancelQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.bootstrap.root,
    });
    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.subscription.root,
    });
    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.entitlements.root,
    });
  });

  it("propaga erros que nao sao de autorizacao", async () => {
    resetRuntimeStores({
      session: makeSessionState({
        accessToken: "token",
        refreshToken: "refresh",
        user: makeSessionUser(),
        userEmail: "italo@auraxis.dev",
        hydrated: true,
        isAuthenticated: true,
      }),
    });

    const queryClient = createQueryClientMock();
    const service = createRuntimeRevalidationService({
      queryClient,
      bootstrapService: {
        getBootstrap: jest.fn(),
      },
      subscriptionService: {
        getSubscription: jest.fn(),
      },
      signOut: jest.fn().mockResolvedValue(undefined),
      setEntitlementsVersion: jest.fn(),
      recordForegroundSync: jest.fn(),
      markSessionValidated: jest.fn(),
    });

    (queryClient.fetchQuery as jest.Mock).mockRejectedValue(
      new Error("Gateway timeout"),
    );

    await expect(service.revalidate("foreground")).rejects.toThrow(
      "Gateway timeout",
    );
  });
});
