import axios, {
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestHeaders,
  type AxiosResponse,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from "axios";

import { toApiError } from "@/core/http/api-error";
import { sanitizeAppUrl } from "@/core/navigation/deep-linking";
import { verifyCanonicalRequest } from "@/core/security/ssl-pinning";
import {
  isStoredSessionExpired,
  resolveSessionInvalidationReason,
} from "@/core/session/session-policy";
import { useSessionStore } from "@/core/session/session-store";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { networkLogger } from "@/core/telemetry/domain-loggers";
import { appRuntimeConfig, normalizeBaseUrl } from "@/shared/config/runtime";
import { createMockApiAdapter } from "@/shared/mocks/api/router";

interface RequestTelemetryMetadata {
  readonly startedAt: number;
  readonly method: string;
  readonly path: string;
}

type InstrumentedRequestConfig = InternalAxiosRequestConfig & {
  auraxisTelemetry?: RequestTelemetryMetadata;
};

const LIVE_API_ADAPTER_PRIORITY: NonNullable<
  CreateAxiosDefaults["adapter"]
> = ["xhr", "http"];

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

const setHeaderValue = (
  config: InternalAxiosRequestConfig,
  headerName: string,
  headerValue: string,
): void => {
  if (config.headers && "set" in config.headers) {
    config.headers.set(headerName, headerValue);
    return;
  }

  const nextHeaders = Object.assign(
    {},
    (config.headers as Record<string, unknown> | undefined) ?? {},
  ) as AxiosRequestHeaders;
  nextHeaders[headerName] = headerValue;
  config.headers = nextHeaders;
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

const markConnectivityOnline = (): void => {
  const shellState = useAppShellStore.getState();
  if (shellState.connectivityStatus !== "offline") {
    return;
  }

  shellState.setConnectivityStatus("online");
  if (shellState.runtimeDegradedReason === "offline") {
    shellState.setRuntimeDegradedReason(null);
  }
};

const markConnectivityOffline = (): void => {
  const shellState = useAppShellStore.getState();
  if (shellState.connectivityStatus === "offline") {
    return;
  }

  shellState.setConnectivityStatus("offline");
  shellState.setRuntimeDegradedReason("offline");
};

const isMutatingMethod = (method: string): boolean => {
  return ["post", "put", "patch", "delete"].includes(method.toLowerCase());
};

const trimTrailingSlashes = (value: string): string => {
  let end = value.length;

  while (end > 1 && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(0, end);
};

const toSanitizedRequestPath = (url: string | undefined): string => {
  if (!url) {
    return "/";
  }

  try {
    const resolvedUrl = new URL(url, normalizeBaseUrl(appRuntimeConfig.apiBaseUrl));
    const sanitizedUrl = new URL(sanitizeAppUrl(resolvedUrl.toString()));
    return trimTrailingSlashes(
      `${sanitizedUrl.pathname}${sanitizedUrl.search}`,
    ) || "/";
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

const reportCanonicalRequestViolation = (
  config: InternalAxiosRequestConfig,
  reason: string,
): void => {
  // Defensive layer: pinning nativo (iOS NSPinnedDomains / Android
  // network-security-config) é a barreira real durante o TLS handshake.
  // Aqui apenas observamos quando o JS ousa originar um request fora do
  // envelope canonico — sinal de bug em config (apiBaseUrl errado) ou
  // de dependencia chamando host arbitrario. Nao bloqueamos para evitar
  // breakage em mock mode / dev local; nativo decide a real-rede.
  if (appRuntimeConfig.apiMode === "mock") {
    return;
  }
  networkLogger.log("network.canonical_request_violation", {
    level: "warn",
    context: {
      method: (config.method ?? "get").toUpperCase(),
      reason,
    },
  });
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

  try {
    const fullUrl = new URL(
      config.url ?? "",
      normalizeBaseUrl(appRuntimeConfig.apiBaseUrl),
    ).toString();
    const verdict = verifyCanonicalRequest(fullUrl);
    if (verdict.kind === "blocked") {
      reportCanonicalRequestViolation(config, verdict.reason);
    }
  } catch {
    // URL composition failed (e.g., empty url + invalid baseURL). Native
    // adapter will surface the real error; nothing to report here.
  }

  const sessionState = useSessionStore.getState();
  const accessToken = sessionState.accessToken;

  networkLogger.log("network.request_started", {
    context: {
      method,
      path: requestPath,
      authenticated: Boolean(accessToken),
    },
  });

  if (accessToken) {
    setHeaderValue(config, "Authorization", `Bearer ${accessToken}`);
  }

  if (
    (config.url ?? "").startsWith("/ops/") &&
    appRuntimeConfig.observabilityExportEnabled &&
    appRuntimeConfig.observabilityExportPublicKey
  ) {
    setHeaderValue(
      config,
      "X-Observability-Key",
      appRuntimeConfig.observabilityExportPublicKey,
    );
  }

  return config;
};

const handleFulfilledResponse = (
  response: AxiosResponse,
): AxiosResponse => {
  markConnectivityOnline();
  const metadata = (response.config as InstrumentedRequestConfig).auraxisTelemetry;

  if (metadata) {
    const durationMs = Date.now() - metadata.startedAt;
    if (shouldLogSuccessfulRequest(metadata, durationMs)) {
      networkLogger.log("network.request_succeeded", {
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

interface AxiosFailureContext {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly code: string | undefined;
  readonly durationMs: number;
  readonly invalidationReason: string | null;
}

interface ApiErrorLike {
  readonly status: number;
  readonly code?: string | undefined;
}

const isCriticalFailure = (apiError: ApiErrorLike): boolean => {
  return apiError.status >= 500 || apiError.status === 0;
};

const buildAxiosFailureContext = (
  error: AxiosError,
  apiError: ApiErrorLike,
  reason: string | null,
): AxiosFailureContext => {
  const metadata = (error.config as InstrumentedRequestConfig | undefined)
    ?.auraxisTelemetry;
  return {
    method: metadata?.method ?? (error.config?.method ?? "get").toUpperCase(),
    path: metadata?.path ?? toSanitizedRequestPath(error.config?.url),
    status: apiError.status,
    code: apiError.code,
    durationMs:
      typeof metadata?.startedAt === "number"
        ? Date.now() - metadata.startedAt
        : 0,
    invalidationReason: reason,
  };
};

const maybeInvalidateSession = async (
  error: AxiosError,
): Promise<string | null> => {
  const reason = resolveSessionInvalidationReason(error.response?.status ?? 0);
  if (!reason) {
    return null;
  }
  const authorizationHeader = readHeader(error.config?.headers, "Authorization");
  if (!authorizationHeader || !useSessionStore.getState().isAuthenticated) {
    return reason;
  }
  await useSessionStore.getState().invalidateSession(reason);
  return reason;
};

const handleAxiosFailure = async (
  error: AxiosError,
  apiError: ApiErrorLike,
): Promise<void> => {
  if (apiError.status === 0) {
    markConnectivityOffline();
  }
  const reason = await maybeInvalidateSession(error);
  const context = buildAxiosFailureContext(error, apiError, reason);
  const critical = isCriticalFailure(apiError);
  networkLogger.log("network.request_failed", {
    level: critical ? "error" : "warn",
    context: { ...context },
    error,
    captureInSentry: critical,
  });
};

const handleNonAxiosFailure = (apiError: ApiErrorLike, error: unknown): void => {
  networkLogger.log("network.request_failed", {
    level: "error",
    context: {
      status: apiError.status,
      code: apiError.code,
    },
    error,
  });
};

const handleRejectedResponse = async (error: unknown): Promise<never> => {
  const apiError = toApiError(error);
  if (isAxiosError(error)) {
    await handleAxiosFailure(error, apiError);
  } else {
    handleNonAxiosFailure(apiError, error);
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
        : LIVE_API_ADAPTER_PRIORITY,
  });

  client.interceptors.request.use(attachAuthHeaders);
  client.interceptors.response.use(
    handleFulfilledResponse,
    handleRejectedResponse,
  );

  return client;
};

export const httpClient = createHttpClient(appRuntimeConfig.apiBaseUrl);
