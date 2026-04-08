import { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { createHttpClient, httpClient } from "@/core/http/http-client";
import { useSessionStore } from "@/core/session/session-store";

jest.mock("@/core/session/session-storage", () => ({
  loadStoredSession: jest.fn(),
  persistStoredSession: jest.fn(),
  clearStoredSession: jest.fn().mockResolvedValue(undefined),
}));

const resetSessionStore = (): void => {
  useSessionStore.setState((state) => ({
    ...state,
    accessToken: null,
    refreshToken: null,
    user: null,
    userEmail: null,
    authenticatedAt: null,
    expiresAt: null,
    authFailureReason: null,
    lastValidatedAt: null,
    lastInvalidatedAt: null,
    hydrated: true,
    isAuthenticated: false,
  }));
};

const readAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
): string | undefined => {
  if (config.headers && "get" in config.headers) {
    const value = config.headers.get("Authorization");
    return typeof value === "string" ? value : undefined;
  }

  const headers = config.headers as Record<string, unknown> | undefined;
  const value = headers?.Authorization;
  return typeof value === "string" ? value : undefined;
};

describe("httpClient", () => {
  beforeEach(() => {
    resetSessionStore();
  });

  it("normaliza o baseURL sem barras duplicadas", () => {
    expect(httpClient.defaults.baseURL?.endsWith("/")).toBe(false);
  });

  it("envia o header canônico de contrato por padrão", () => {
    expect(httpClient.defaults.headers["X-API-Contract"]).toBeDefined();
  });

  it("invalida a sessao local quando o token ja expirou antes do request", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      accessToken: "token",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        name: "Italo",
        email: "italo@auraxis.dev",
        emailConfirmed: true,
      },
      userEmail: "italo@auraxis.dev",
      authenticatedAt: "2026-04-08T10:00:00.000Z",
      expiresAt: "2026-04-08T09:00:00.000Z",
      hydrated: true,
      isAuthenticated: true,
    }));

    const client = createHttpClient("https://api.auraxis.dev/");
    client.defaults.adapter = async (config) => ({
      data: {
        authorization: readAuthorizationHeader(config),
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    const response = await client.get("/dashboard");

    expect(response.data.authorization).toBeUndefined();
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: "expired",
    });
  });

  it("derruba a sessao quando a API responde 401 em request autenticado", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      accessToken: "token",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        name: "Italo",
        email: "italo@auraxis.dev",
        emailConfirmed: true,
      },
      userEmail: "italo@auraxis.dev",
      authenticatedAt: "2026-04-08T10:00:00.000Z",
      expiresAt: null,
      hydrated: true,
      isAuthenticated: true,
    }));

    const client = createHttpClient("https://api.auraxis.dev/");
    client.defaults.adapter = async (config) => {
      throw new AxiosError(
        "Sessao expirada.",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          data: {
            message: "Sessao expirada.",
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

    await expect(client.get("/dashboard")).rejects.toMatchObject({
      status: 401,
    });
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: "unauthorized",
    });
  });

  it("anexa o bearer token no interceptor de request para sessao válida", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      accessToken: "token",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        name: "Italo",
        email: "italo@auraxis.dev",
        emailConfirmed: true,
      },
      userEmail: "italo@auraxis.dev",
      authenticatedAt: "2026-04-08T10:00:00.000Z",
      expiresAt: "2099-04-08T09:00:00.000Z",
      hydrated: true,
      isAuthenticated: true,
    }));

    const client = createHttpClient("https://api.auraxis.dev/");
    const requestHandler = (
      client.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (
            config: InternalAxiosRequestConfig,
          ) => Promise<InternalAxiosRequestConfig>;
        }>;
      }
    ).handlers[0].fulfilled;

    const nextConfig = await requestHandler({
      url: "/dashboard",
      headers: {},
    } as InternalAxiosRequestConfig);

    expect((nextConfig.headers as Record<string, string>).Authorization).toBe(
      "Bearer token",
    );
  });

  it("anexa a chave pública de observabilidade em rotas /ops", async () => {
    jest.resetModules();
    let isolatedClient: ReturnType<typeof createHttpClient> | null = null;

    jest.isolateModules(() => {
      jest.doMock("@/shared/config/runtime", () => {
        const actual = jest.requireActual("@/shared/config/runtime");

        return {
          ...actual,
          appRuntimeConfig: {
            ...actual.appRuntimeConfig,
            observabilityExportEnabled: true,
            observabilityExportPublicKey: "public-ops-key",
          },
        };
      });

      const {
        createHttpClient: createIsolatedHttpClient,
      } = require("@/core/http/http-client") as {
        createHttpClient: typeof createHttpClient;
      };

      isolatedClient = createIsolatedHttpClient("https://api.auraxis.dev/");
    });

    expect(isolatedClient).not.toBeNull();

    const requestHandler = (
      isolatedClient!.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (
            config: InternalAxiosRequestConfig,
          ) => Promise<InternalAxiosRequestConfig>;
        }>;
      }
    ).handlers[0].fulfilled;

    const nextConfig = await requestHandler({
      url: "/ops/metrics",
      headers: {},
    } as InternalAxiosRequestConfig);

    expect(
      (nextConfig.headers as Record<string, string>)["X-Observability-Key"],
    ).toBe("public-ops-key");

    jest.dontMock("@/shared/config/runtime");
  });

  it("derruba a sessao com motivo forbidden quando a API responde 403", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      accessToken: "token",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        name: "Italo",
        email: "italo@auraxis.dev",
        emailConfirmed: true,
      },
      userEmail: "italo@auraxis.dev",
      authenticatedAt: "2026-04-08T10:00:00.000Z",
      expiresAt: null,
      hydrated: true,
      isAuthenticated: true,
    }));

    const client = createHttpClient("https://api.auraxis.dev/");
    const rejectedHandler = (
      client.interceptors.response as unknown as {
        handlers: Array<{
          rejected: (error: unknown) => Promise<never>;
        }>;
      }
    ).handlers[0].rejected;

    await expect(
      rejectedHandler(
        new AxiosError(
          "Forbidden",
          "ERR_BAD_REQUEST",
          {
            headers: {
              Authorization: "Bearer token",
            },
            method: "get",
            url: "/dashboard",
          } as InternalAxiosRequestConfig,
          undefined,
          {
            data: {
              message: "Forbidden",
            },
            status: 403,
            statusText: "Forbidden",
            headers: {},
            config: {
              headers: {
                Authorization: "Bearer token",
              },
              method: "get",
              url: "/dashboard",
            } as InternalAxiosRequestConfig,
          },
        ),
      ),
    ).rejects.toMatchObject({
      status: 403,
    });

    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: "forbidden",
    });
  });

  it("nao invalida a sessao quando o 401 chega sem header de autorizacao", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      accessToken: "token",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        name: "Italo",
        email: "italo@auraxis.dev",
        emailConfirmed: true,
      },
      userEmail: "italo@auraxis.dev",
      authenticatedAt: "2026-04-08T10:00:00.000Z",
      expiresAt: null,
      hydrated: true,
      isAuthenticated: true,
    }));

    const client = createHttpClient("https://api.auraxis.dev/");
    const rejectedHandler = (
      client.interceptors.response as unknown as {
        handlers: Array<{
          rejected: (error: unknown) => Promise<never>;
        }>;
      }
    ).handlers[0].rejected;

    await expect(
      rejectedHandler(
        new AxiosError(
          "Unauthorized",
          "ERR_BAD_REQUEST",
          {
            headers: {},
            method: "get",
            url: "/dashboard",
          } as InternalAxiosRequestConfig,
          undefined,
          {
            data: {
              message: "Unauthorized",
            },
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config: {
              headers: {},
              method: "get",
              url: "/dashboard",
            } as InternalAxiosRequestConfig,
          },
        ),
      ),
    ).rejects.toMatchObject({
      status: 401,
    });

    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: true,
      authFailureReason: null,
    });
  });
});
