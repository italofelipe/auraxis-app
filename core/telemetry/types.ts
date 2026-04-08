export type AppTelemetryDomain =
  | "startup"
  | "runtime"
  | "navigation"
  | "network"
  | "auth"
  | "checkout"
  | "observability";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export interface AppBreadcrumb {
  readonly category: AppTelemetryDomain;
  readonly message: string;
  readonly level: AppLogLevel;
  readonly data?: Record<string, unknown>;
}

export interface AppLogEntry {
  readonly domain: AppTelemetryDomain;
  readonly event: string;
  readonly context?: Record<string, unknown>;
  readonly error?: unknown;
  readonly captureInSentry?: boolean;
}
