import axios, {
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

import { toApiError } from "@/core/http/api-error";
import {
  isStoredSessionExpired,
  resolveSessionInvalidationReason,
} from "@/core/session/session-policy";
import { useSessionStore } from "@/core/session/session-store";
import { createMockApiAdapter } from "@/shared/mocks/api/router";
import { appRuntimeConfig, normalizeBaseUrl } from "@/shared/config/runtime";

const readHeader = (
  headers:
    | InternalAxiosRequestConfig["headers"]
    | AxiosRequestHeaders
    | undefined,
  key: string,
): string | null => {
  if (!headers) {
    return null;
  }

  if ("get" in headers && typeof headers.get === "function") {
    const value = headers.get(key);
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  const record = headers as Record<string, unknown>;
  const directValue = record[key] ?? record[key.toLowerCase()];
  return typeof directValue === "string" && directValue.length > 0
    ? directValue
    : null;
};

const invalidateExpiredSessionIfNeeded = async (): Promise<void> => {
  const sessionState = useSessionStore.getState();
  if (
    !sessionState.isAuthenticated ||
    !sessionState.accessToken ||
    !isStoredSessionExpired({
      expiresAt: sessionState.expiresAt,
    })
  ) {
    return;
  }

  await sessionState.invalidateSession("expired");
};

const attachAuthHeaders = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  await invalidateExpiredSessionIfNeeded();

  const sessionState = useSessionStore.getState();
  const accessToken = sessionState.accessToken;

  if (accessToken) {
    if (config.headers && "set" in config.headers) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      const nextHeaders = Object.assign(
        {},
        (config.headers as Record<string, unknown> | undefined) ?? {},
      ) as AxiosRequestHeaders;
      nextHeaders.Authorization = `Bearer ${accessToken}`;
      config.headers = nextHeaders;
    }
  }

  if (
    (config.url ?? "").startsWith("/ops/") &&
    appRuntimeConfig.observabilityExportEnabled &&
    appRuntimeConfig.observabilityExportPublicKey
  ) {
    if (config.headers && "set" in config.headers) {
      config.headers.set(
        "X-Observability-Key",
        appRuntimeConfig.observabilityExportPublicKey,
      );
    } else {
      const nextHeaders = Object.assign(
        {},
        (config.headers as Record<string, unknown> | undefined) ?? {},
      ) as AxiosRequestHeaders;
      nextHeaders["X-Observability-Key"] =
        appRuntimeConfig.observabilityExportPublicKey;
      config.headers = nextHeaders;
    }
  }

  return config;
};

const handleRejectedResponse = async (error: unknown): Promise<never> => {
  if (isAxiosError(error)) {
    const reason = resolveSessionInvalidationReason(error.response?.status ?? 0);
    const authorizationHeader = readHeader(error.config?.headers, "Authorization");

    if (reason && authorizationHeader && useSessionStore.getState().isAuthenticated) {
      await useSessionStore.getState().invalidateSession(reason);
    }
  }

  return Promise.reject(toApiError(error));
};

export const createHttpClient = (baseUrl: string): AxiosInstance => {
  const client = axios.create({
    baseURL: normalizeBaseUrl(baseUrl),
    timeout: appRuntimeConfig.requestTimeoutMs,
    headers: {
      "X-API-Contract": appRuntimeConfig.apiContractVersion,
    },
    adapter:
      appRuntimeConfig.apiMode === "mock"
        ? createMockApiAdapter(appRuntimeConfig.mockLatencyMs)
        : undefined,
  });

  client.interceptors.request.use(attachAuthHeaders);
  client.interceptors.response.use(
    (response) => response,
    handleRejectedResponse,
  );

  return client;
};

export const httpClient = createHttpClient(appRuntimeConfig.apiBaseUrl);
