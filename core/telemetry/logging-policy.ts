import type {
  AppLogLevel,
  AppTelemetryEvent,
} from "@/core/telemetry/types";

export interface AppEventLoggingPolicy {
  readonly level: AppLogLevel;
  readonly description: string;
  readonly minimumContextKeys: ReadonlyArray<string>;
  readonly consolePolicy: "dev-only" | "warn-and-error" | "never";
}

const createLoggingPolicy = (
  level: AppLogLevel,
  description: string,
  minimumContextKeys: ReadonlyArray<string>,
  consolePolicy: AppEventLoggingPolicy["consolePolicy"],
): AppEventLoggingPolicy => {
  return {
    level,
    description,
    minimumContextKeys,
    consolePolicy,
  };
};

const devOnlyInfoPolicy = (
  description: string,
  minimumContextKeys: ReadonlyArray<string>,
): AppEventLoggingPolicy => {
  return createLoggingPolicy(
    "info",
    description,
    minimumContextKeys,
    "dev-only",
  );
};

const devOnlyDebugPolicy = (
  description: string,
  minimumContextKeys: ReadonlyArray<string>,
): AppEventLoggingPolicy => {
  return createLoggingPolicy(
    "debug",
    description,
    minimumContextKeys,
    "dev-only",
  );
};

const warnAndErrorInfoPolicy = (
  description: string,
  minimumContextKeys: ReadonlyArray<string>,
): AppEventLoggingPolicy => {
  return createLoggingPolicy(
    "info",
    description,
    minimumContextKeys,
    "warn-and-error",
  );
};

const warnAndErrorWarnPolicy = (
  description: string,
  minimumContextKeys: ReadonlyArray<string>,
): AppEventLoggingPolicy => {
  return createLoggingPolicy(
    "warn",
    description,
    minimumContextKeys,
    "warn-and-error",
  );
};

const warnAndErrorErrorPolicy = (
  description: string,
  minimumContextKeys: ReadonlyArray<string>,
): AppEventLoggingPolicy => {
  return createLoggingPolicy(
    "error",
    description,
    minimumContextKeys,
    "warn-and-error",
  );
};

export const APP_EVENT_LOGGING_POLICY = Object.freeze({
  "startup.bootstrap_requested": devOnlyInfoPolicy(
    "Início do bootstrap estrutural do app.",
    ["hydrated"],
  ),
  "startup.session_rehydrated": devOnlyInfoPolicy(
    "Resultado da rehidratação da sessão persistida.",
    ["authenticated", "source", "migratedLegacySession"],
  ),
  "startup.ready": devOnlyInfoPolicy(
    "App pronto para renderização após bootstrap e fontes.",
    ["fontsLoaded", "hydrated"],
  ),
  "runtime.app_state_changed": devOnlyInfoPolicy(
    "Mudança de foreground/background do app.",
    ["previousAppState", "nextAppState", "shouldSync"],
  ),
  "runtime.reachability_probe_started": devOnlyDebugPolicy(
    "Disparo de probe de conectividade do cliente.",
    ["reason"],
  ),
  "runtime.reachability_probe_completed": warnAndErrorInfoPolicy(
    "Resultado do probe de conectividade do cliente.",
    ["reason", "status", "degradedReason"],
  ),
  "runtime.revalidation_started": devOnlyInfoPolicy(
    "Início de sincronização de runtime em foreground/checkout.",
    ["reason"],
  ),
  "runtime.revalidation_completed": warnAndErrorInfoPolicy(
    "Resultado da sincronização de runtime.",
    ["reason", "revalidated", "signedOut"],
  ),
  "runtime.revalidation_failed": warnAndErrorErrorPolicy(
    "Falha inesperada durante revalidation do runtime.",
    ["reason"],
  ),
  "runtime.error_boundary_captured": warnAndErrorErrorPolicy(
    "Erro inesperado capturado por boundary de React.",
    ["scope", "componentStack"],
  ),
  "navigation.route_changed": devOnlyInfoPolicy(
    "Mudança efetiva de rota no app.",
    ["route", "routeKey", "access"],
  ),
  "navigation.deep_link_deduplicated": devOnlyDebugPolicy(
    "Deep link repetido e ignorado pelo runtime.",
    ["url"],
  ),
  "navigation.deep_link_ignored": warnAndErrorWarnPolicy(
    "Deep link inválido ou fora do contrato esperado.",
    ["url"],
  ),
  "navigation.deep_link_handled": devOnlyInfoPolicy(
    "Deep link válido processado pelo runtime.",
    ["url", "href"],
  ),
  "network.request_started": devOnlyDebugPolicy(
    "Requisição HTTP iniciada pelo cliente.",
    ["method", "path", "authenticated"],
  ),
  "network.request_succeeded": devOnlyInfoPolicy(
    "Requisição HTTP concluída com sucesso.",
    ["method", "path", "status", "durationMs"],
  ),
  "network.request_failed": warnAndErrorWarnPolicy(
    "Requisição HTTP falhou no cliente.",
    ["method", "path", "status", "code"],
  ),
  "auth.session_established": devOnlyInfoPolicy(
    "Sessão autenticada foi persistida/estabelecida.",
    ["hasRefreshToken", "emailConfirmed", "hasUserId"],
  ),
  "auth.session_invalidated": warnAndErrorWarnPolicy(
    "Sessão foi invalidada por expiração, auth failure ou logout.",
    ["reason", "invalidatedAt"],
  ),
  "checkout.return_received": devOnlyInfoPolicy(
    "Retorno de checkout recebido via deep link.",
    ["href", "status", "provider", "url"],
  ),
  "observability.snapshot_requested": devOnlyInfoPolicy(
    "Snapshot de observabilidade solicitado no cliente.",
    ["path"],
  ),
  "observability.metrics_requested": devOnlyInfoPolicy(
    "Export de métricas Prometheus solicitado no cliente.",
    ["path"],
  ),
  "performance.measurement_recorded": devOnlyInfoPolicy(
    "Medição de performance registrada pelo runtime.",
    ["metric", "durationMs", "budgetMs", "exceeded"],
  ),
  "performance.budget_exceeded": warnAndErrorWarnPolicy(
    "Budget de performance excedido no cliente.",
    ["metric", "durationMs", "budgetMs", "exceeded"],
  ),
} satisfies Record<AppTelemetryEvent, AppEventLoggingPolicy>);

export const getAppEventLoggingPolicy = (
  event: AppTelemetryEvent,
): AppEventLoggingPolicy => {
  return APP_EVENT_LOGGING_POLICY[event];
};
