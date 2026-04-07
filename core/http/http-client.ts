import axios, {
  type AxiosInstance,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

import { toApiError } from "@/core/http/api-error";
import { useSessionStore } from "@/core/session/session-store";
import { createMockApiAdapter } from "@/shared/mocks/api/router";
import { appRuntimeConfig, normalizeBaseUrl } from "@/shared/config/runtime";

const attachAuthHeaders = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
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

  if ((config.url ?? "").startsWith("/ops/") && appRuntimeConfig.observabilityExportToken) {
    if (config.headers && "set" in config.headers) {
      config.headers.set(
        "X-Observability-Key",
        appRuntimeConfig.observabilityExportToken,
      );
    } else {
      const nextHeaders = Object.assign(
        {},
        (config.headers as Record<string, unknown> | undefined) ?? {},
      ) as AxiosRequestHeaders;
      nextHeaders["X-Observability-Key"] =
        appRuntimeConfig.observabilityExportToken;
      config.headers = nextHeaders;
    }
  }

  return config;
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
    (error: unknown) => Promise.reject(toApiError(error)),
  );

  return client;
};

export const httpClient = createHttpClient(appRuntimeConfig.apiBaseUrl);
