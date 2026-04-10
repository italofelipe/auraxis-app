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

export const APP_EVENT_LOGGING_POLICY = Object.freeze({
  "startup.bootstrap_requested": {
    level: "info",
    description: "Início do bootstrap estrutural do app.",
    minimumContextKeys: ["hydrated"],
    consolePolicy: "dev-only",
  },
  "startup.session_rehydrated": {
    level: "info",
    description: "Resultado da rehidratação da sessão persistida.",
    minimumContextKeys: ["authenticated", "source", "migratedLegacySession"],
    consolePolicy: "dev-only",
  },
  "startup.ready": {
    level: "info",
    description: "App pronto para renderização após bootstrap e fontes.",
    minimumContextKeys: ["fontsLoaded", "hydrated"],
    consolePolicy: "dev-only",
  },
  "runtime.app_state_changed": {
    level: "info",
    description: "Mudança de foreground/background do app.",
    minimumContextKeys: ["previousAppState", "nextAppState", "shouldSync"],
    consolePolicy: "dev-only",
  },
  "runtime.reachability_probe_started": {
    level: "debug",
    description: "Disparo de probe de conectividade do cliente.",
    minimumContextKeys: ["reason"],
    consolePolicy: "dev-only",
  },
  "runtime.reachability_probe_completed": {
    level: "info",
    description: "Resultado do probe de conectividade do cliente.",
    minimumContextKeys: ["reason", "status", "degradedReason"],
    consolePolicy: "warn-and-error",
  },
  "runtime.revalidation_started": {
    level: "info",
    description: "Início de sincronização de runtime em foreground/checkout.",
    minimumContextKeys: ["reason"],
    consolePolicy: "dev-only",
  },
  "runtime.revalidation_completed": {
    level: "info",
    description: "Resultado da sincronização de runtime.",
    minimumContextKeys: ["reason", "revalidated", "signedOut"],
    consolePolicy: "warn-and-error",
  },
  "runtime.revalidation_failed": {
    level: "error",
    description: "Falha inesperada durante revalidation do runtime.",
    minimumContextKeys: ["reason"],
    consolePolicy: "warn-and-error",
  },
  "runtime.error_boundary_captured": {
    level: "error",
    description: "Erro inesperado capturado por boundary de React.",
    minimumContextKeys: ["scope", "componentStack"],
    consolePolicy: "warn-and-error",
  },
  "navigation.route_changed": {
    level: "info",
    description: "Mudança efetiva de rota no app.",
    minimumContextKeys: ["route", "routeKey", "access"],
    consolePolicy: "dev-only",
  },
  "navigation.deep_link_deduplicated": {
    level: "debug",
    description: "Deep link repetido e ignorado pelo runtime.",
    minimumContextKeys: ["url"],
    consolePolicy: "dev-only",
  },
  "navigation.deep_link_ignored": {
    level: "warn",
    description: "Deep link inválido ou fora do contrato esperado.",
    minimumContextKeys: ["url"],
    consolePolicy: "warn-and-error",
  },
  "navigation.deep_link_handled": {
    level: "info",
    description: "Deep link válido processado pelo runtime.",
    minimumContextKeys: ["url", "href"],
    consolePolicy: "dev-only",
  },
  "network.request_started": {
    level: "debug",
    description: "Requisição HTTP iniciada pelo cliente.",
    minimumContextKeys: ["method", "path", "authenticated"],
    consolePolicy: "dev-only",
  },
  "network.request_succeeded": {
    level: "info",
    description: "Requisição HTTP concluída com sucesso.",
    minimumContextKeys: ["method", "path", "status", "durationMs"],
    consolePolicy: "dev-only",
  },
  "network.request_failed": {
    level: "warn",
    description: "Requisição HTTP falhou no cliente.",
    minimumContextKeys: ["method", "path", "status", "code"],
    consolePolicy: "warn-and-error",
  },
  "auth.session_established": {
    level: "info",
    description: "Sessão autenticada foi persistida/estabelecida.",
    minimumContextKeys: ["hasRefreshToken", "emailConfirmed", "hasUserId"],
    consolePolicy: "dev-only",
  },
  "auth.session_invalidated": {
    level: "warn",
    description: "Sessão foi invalidada por expiração, auth failure ou logout.",
    minimumContextKeys: ["reason", "invalidatedAt"],
    consolePolicy: "warn-and-error",
  },
  "checkout.return_received": {
    level: "info",
    description: "Retorno de checkout recebido via deep link.",
    minimumContextKeys: ["href", "status", "provider", "url"],
    consolePolicy: "dev-only",
  },
} satisfies Record<AppTelemetryEvent, AppEventLoggingPolicy>);

export const getAppEventLoggingPolicy = (
  event: AppTelemetryEvent,
): AppEventLoggingPolicy => {
  return APP_EVENT_LOGGING_POLICY[event];
};
