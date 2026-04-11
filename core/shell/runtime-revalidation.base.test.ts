import type { QueryClient } from "@tanstack/react-query";

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

const createService = (queryClient: QueryClient) => {
  return createRuntimeRevalidationService({
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
};

describe("runtime revalidation service - base flow", () => {
  beforeEach(() => {
    resetRuntimeStores({
      session: makeSessionState({
        hydrated: true,
        isAuthenticated: false,
      }),
    });
  });

  it("nao sincroniza dados protegidos quando a sessao nao esta autenticada", async () => {
    const queryClient = createQueryClientMock();
    const service = createService(queryClient);

    const result = await service.revalidate("foreground");

    expect(result).toEqual({
      revalidated: false,
      signedOut: false,
      entitlementsVersion: null,
    });
    expect(queryClient.fetchQuery).not.toHaveBeenCalled();
  });

  it("sincroniza bootstrap e assinatura quando o app volta ao foreground", async () => {
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
    (queryClient.fetchQuery as jest.Mock)
      .mockResolvedValueOnce({
        user: {
          productContext: {
            entitlementsVersion: 9,
          },
        },
      })
      .mockResolvedValueOnce({
        status: "active",
      });

    const service = createService(queryClient);
    const result = await service.revalidate("foreground");

    expect(result).toEqual({
      revalidated: true,
      signedOut: false,
      entitlementsVersion: 9,
    });
    expect(queryClient.fetchQuery).toHaveBeenCalledTimes(2);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.entitlements.root,
    });
  });

  it("deduplica revalidacoes concorrentes para evitar excesso de fetch", async () => {
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
    (queryClient.fetchQuery as jest.Mock)
      .mockResolvedValueOnce({
        user: {
          productContext: {
            entitlementsVersion: 11,
          },
        },
      })
      .mockResolvedValueOnce({
        status: "active",
      });

    const service = createService(queryClient);
    const [first, second] = await Promise.all([
      service.revalidate("foreground"),
      service.revalidate("checkout-return"),
    ]);

    expect(first).toEqual(second);
    expect(queryClient.fetchQuery).toHaveBeenCalledTimes(2);
  });
});
