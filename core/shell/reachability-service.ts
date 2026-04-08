import { appRuntimeConfig, normalizeBaseUrl } from "@/shared/config/runtime";

import type {
  RuntimeConnectivityStatus,
  RuntimeDegradedReason,
} from "@/core/shell/app-shell-store";

export interface ReachabilityProbeResult {
  readonly status: Exclude<RuntimeConnectivityStatus, "unknown">;
  readonly degradedReason: RuntimeDegradedReason;
  readonly checkedAt: string;
  readonly latencyMs: number;
  readonly statusCode: number | null;
}

interface ReachabilityServiceDependencies {
  readonly fetch: typeof globalThis.fetch;
  readonly now?: () => number;
  readonly createAbortController?: () => AbortController;
  readonly apiBaseUrl?: string;
  readonly probePath?: string;
  readonly timeoutMs?: number;
}

const normalizeProbePath = (value: string): string => {
  if (!value.startsWith("/")) {
    return `/${value}`;
  }

  return value;
};

const defaultDependencies: ReachabilityServiceDependencies = {
  fetch: globalThis.fetch.bind(globalThis),
  now: (): number => Date.now(),
  createAbortController: (): AbortController => new AbortController(),
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === "AbortError";
};

const buildProbeUrl = (baseUrl: string, probePath: string): string => {
  return `${normalizeBaseUrl(baseUrl)}${normalizeProbePath(probePath)}`;
};

const createProbeResult = (
  status: Exclude<RuntimeConnectivityStatus, "unknown">,
  degradedReason: RuntimeDegradedReason,
  startedAt: number,
  now: () => number,
  statusCode: number | null = null,
): ReachabilityProbeResult => {
  return {
    status,
    degradedReason,
    checkedAt: new Date(now()).toISOString(),
    latencyMs: Math.max(0, now() - startedAt),
    statusCode,
  };
};

export const createReachabilityService = (
  dependencies: ReachabilityServiceDependencies = defaultDependencies,
) => {
  const fetchDependency = dependencies.fetch;
  const now = dependencies.now ?? defaultDependencies.now!;
  const createAbortController =
    dependencies.createAbortController ??
    defaultDependencies.createAbortController!;
  const probeUrl = buildProbeUrl(
    dependencies.apiBaseUrl ?? appRuntimeConfig.apiBaseUrl,
    dependencies.probePath ?? appRuntimeConfig.reachabilityProbePath,
  );
  const timeoutMs =
    dependencies.timeoutMs ?? appRuntimeConfig.reachabilityProbeTimeoutMs;

  return {
    probe: async (): Promise<ReachabilityProbeResult> => {
      const startedAt = now();
      const abortController = createAbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);

      try {
        const response = await fetchDependency(probeUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: abortController.signal,
        });

        if (response.ok) {
          return createProbeResult(
            "online",
            null,
            startedAt,
            now,
            response.status,
          );
        }

        return createProbeResult(
          "degraded",
          "healthcheck-failed",
          startedAt,
          now,
          response.status,
        );
      } catch (error) {
        if (isAbortError(error)) {
          return createProbeResult(
            "degraded",
            "probe-timeout",
            startedAt,
            now,
          );
        }

        return createProbeResult("offline", "offline", startedAt, now);
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
};

export const reachabilityService = createReachabilityService();
