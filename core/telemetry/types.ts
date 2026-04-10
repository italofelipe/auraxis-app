export type AppTelemetryDomain =
  | "startup"
  | "runtime"
  | "navigation"
  | "network"
  | "auth"
  | "checkout"
  | "observability";

export type AppTelemetryEvent =
  | "startup.bootstrap_requested"
  | "startup.session_rehydrated"
  | "startup.ready"
  | "runtime.app_state_changed"
  | "runtime.reachability_probe_started"
  | "runtime.reachability_probe_completed"
  | "runtime.revalidation_started"
  | "runtime.revalidation_completed"
  | "runtime.revalidation_failed"
  | "runtime.error_boundary_captured"
  | "navigation.route_changed"
  | "navigation.deep_link_deduplicated"
  | "navigation.deep_link_ignored"
  | "navigation.deep_link_handled"
  | "network.request_started"
  | "network.request_succeeded"
  | "network.request_failed"
  | "auth.session_established"
  | "auth.session_invalidated"
  | "checkout.return_received";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export interface AppBreadcrumb {
  readonly category: AppTelemetryDomain;
  readonly message: string;
  readonly level: AppLogLevel;
  readonly data?: Record<string, unknown>;
}

export interface AppLogEntry {
  readonly domain: AppTelemetryDomain;
  readonly event: AppTelemetryEvent;
  readonly context?: Record<string, unknown>;
  readonly error?: unknown;
  readonly captureInSentry?: boolean;
}
