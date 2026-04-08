import axios, {
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { toApiError } from "@/core/http/api-error";
import {
  isStoredSessionExpired,
  resolveSessionInvalidationReason,
} from "@/core/session/session-policy";
import { useSessionStore } from "@/core/session/session-store";
import { appLogger } from "@/core/telemetry/app-logger";
import { createMockApiAdapter } from "@/shared/mocks/api/router";
import { appRuntimeConfig, normalizeBaseUrl } from "@/shared/config/runtime";
import { sanitizeAppUrl } from "@/core/navigation/deep-linking";

interface RequestTelemetryMetadata {
  readonly startedAt: number;
  readonly method: string;
  readonly path: string;
}

type InstrumentedRequestConfig = InternalAxiosRequestConfig & {
  auraxisTelemetry?: RequestTelemetryMetadata;
};

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

const isMutatingMethod = (method: string): boolean => {
  return ["post", "put", "patch", "delete"].includes(method.toLowerCase());
};

const toSanitizedRequestPath = (url: string | undefined): string => {
  if (!url) {
    return "/";
  }

  try {
    const resolvedUrl = new URL(url, normalizeBaseUrl(appRuntimeConfig.apiBaseUrl));
    const sanitizedUrl = new URL(sanitizeAppUrl(resolvedUrl.toString()));
    return `${sanitizedUrl.pathname}${sanitizedUrl.search}`.replace(/\/+$/u, "") || "/";
  } catch {
    return url;
  }
};

const shouldLogSuccessfulRequest = (
  metadata: RequestTelemetryMetadata,
  durationMs: number,
): boolean => {
  return (
    isMutatingMethod(metadata.method) ||
    metadata.path.startsWith("/ops/") ||
    durationMs >= 1_000
  );
};

const attachAuthHeaders = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  await invalidateExpiredSessionIfNeeded();

  const instrumentedConfig = config as InstrumentedRequestConfig;
  const requestPath = toSanitizedRequestPath(config.url);
  const method = (config.method ?? "get").toUpperCase();
  instrumentedConfig.auraxisTelemetry = {
    startedAt: Date.now(),
    method,
    path: requestPath,
  };

  const sessionState = useSessionStore.getState();
  const accessToken = sessionState.accessToken;

  appLogger.debug({
    domain: "network",
    event: "network.request_started",
    context: {
      method,
      path: requestPath,
      authenticated: Boolean(accessToken),
    },
  });

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

const handleFulfilledResponse = (
  response: AxiosResponse,
): AxiosResponse => {
  const metadata = (response.config as InstrumentedRequestConfig).auraxisTelemetry;

  if (metadata) {
    const durationMs = Date.now() - metadata.startedAt;
    if (shouldLogSuccessfulRequest(metadata, durationMs)) {
      appLogger.info({
        domain: "network",
        event: "network.request_succeeded",
        context: {
          method: metadata.method,
          path: metadata.path,
          status: response.status,
          durationMs,
        },
      });
    }
  }

  return response;
};

const handleRejectedResponse = async (error: unknown): Promise<never> => {
  const apiError = toApiError(error);

  if (isAxiosError(error)) {
    const reason = resolveSessionInvalidationReason(error.response?.status ?? 0);
    const authorizationHeader = readHeader(error.config?.headers, "Authorization");
    const metadata = (error.config as InstrumentedRequestConfig | undefined)
      ?.auraxisTelemetry;

    if (reason && authorizationHeader && useSessionStore.getState().isAuthenticated) {
      await useSessionStore.getState().invalidateSession(reason);
    }

    appLogger[apiError.status >= 500 || apiError.status === 0 ? "error" : "warn"]({
      domain: "network",
      event: "network.request_failed",
      context: {
        method: metadata?.method ?? (error.config?.method ?? "get").toUpperCase(),
        path: metadata?.path ?? toSanitizedRequestPath(error.config?.url),
        status: apiError.status,
        code: apiError.code,
        durationMs:
          typeof metadata?.startedAt === "number"
            ? Date.now() - metadata.startedAt
            : 0,
        invalidationReason: reason,
      },
      error,
      captureInSentry: apiError.status >= 500 || apiError.status === 0,
    });
  } else {
    appLogger.error({
      domain: "network",
      event: "network.request_failed",
      context: {
        status: apiError.status,
        code: apiError.code,
      },
      error,
    });
  }

  return Promise.reject(apiError);
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
    handleFulfilledResponse,
    handleRejectedResponse,
  );

  return client;
};

export const httpClient = createHttpClient(appRuntimeConfig.apiBaseUrl);
