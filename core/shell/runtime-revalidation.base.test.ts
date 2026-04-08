import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { createRuntimeRevalidationService } from "@/core/shell/runtime-revalidation";
import { useSessionStore } from "@/core/session/session-store";

const createQueryClientMock = (): QueryClient => {
  return {
    fetchQuery: jest.fn(),
    invalidateQueries: jest.fn(),
    removeQueries: jest.fn(),
  } as unknown as QueryClient;
};

const resetUnauthenticatedSession = (): void => {
  useSessionStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    userEmail: null,
    hydrated: true,
    isAuthenticated: false,
  });
};

const setAuthenticatedSession = (): void => {
  useSessionStore.setState({
    accessToken: "token",
    refreshToken: "refresh",
    user: {
      id: "user-1",
      name: "Italo",
      email: "italo@auraxis.dev",
      emailConfirmed: true,
    },
    userEmail: "italo@auraxis.dev",
    hydrated: true,
    isAuthenticated: true,
  });
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
    resetUnauthenticatedSession();
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
    setAuthenticatedSession();

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
});
