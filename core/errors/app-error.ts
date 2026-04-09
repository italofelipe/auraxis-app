import { ApiError, toApiError } from "@/core/http/api-error";
import {
  type RuntimeConnectivityStatus,
  useAppShellStore,
} from "@/core/shell/app-shell-store";

export type AppErrorCategory =
  | "auth"
  | "network"
  | "server"
  | "validation"
  | "unexpected"
  | "degraded";

export type AppErrorRecoverability =
  | "retry"
  | "reauthenticate"
  | "dismiss"
  | "wait";

export interface AppErrorState {
  readonly category: AppErrorCategory;
  readonly recoverability: AppErrorRecoverability;
  readonly title: string;
  readonly description: string;
  readonly canRetry: boolean;
  readonly actionLabel: string | null;
  readonly captureInTelemetry: boolean;
  readonly status: number;
  readonly code: string;
  readonly technicalMessage: string;
}

export interface CreateAppErrorStateOptions {
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly connectivityStatus?: RuntimeConnectivityStatus;
}

interface AppErrorCategoryPresentation {
  readonly title: string;
  readonly description: string;
  readonly recoverability: AppErrorRecoverability;
  readonly actionLabel: string | null;
  readonly captureInTelemetry: boolean;
}

const DEGRADED_STATUSES = new Set([429, 502, 503, 504]);
const NETWORK_STATUSES = new Set([0, 408]);
const AUTH_CODES = new Set([
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "INVALID_TOKEN",
  "SESSION_EXPIRED",
  "TOKEN_EXPIRED",
  "UNAUTHORIZED",
]);
const VALIDATION_CODES = new Set([
  "BAD_REQUEST",
  "INVALID_CREDENTIALS",
  "INVALID_INPUT",
  "VALIDATION_ERROR",
]);

const CATEGORY_PRESENTATION: Record<
  AppErrorCategory,
  AppErrorCategoryPresentation
> = {
  auth: {
    title: "Nao foi possivel validar sua sessao",
    description: "Entre novamente para continuar com seguranca.",
    recoverability: "reauthenticate",
    actionLabel: "Entrar novamente",
    captureInTelemetry: false,
  },
  network: {
    title: "Sem conexao no momento",
    description: "Verifique sua internet e tente novamente.",
    recoverability: "wait",
    actionLabel: null,
    captureInTelemetry: false,
  },
  server: {
    title: "O servidor nao respondeu como esperado",
    description: "Tente novamente em alguns instantes.",
    recoverability: "retry",
    actionLabel: "Tentar novamente",
    captureInTelemetry: true,
  },
  validation: {
    title: "Revise os dados informados",
    description: "Confira as informacoes e tente novamente.",
    recoverability: "dismiss",
    actionLabel: null,
    captureInTelemetry: false,
  },
  unexpected: {
    title: "Algo saiu do esperado",
    description: "Tente novamente em alguns instantes.",
    recoverability: "retry",
    actionLabel: "Tentar novamente",
    captureInTelemetry: true,
  },
  degraded: {
    title: "Servico temporariamente instavel",
    description: "A operacao nao pode ser concluida agora. Tente novamente em breve.",
    recoverability: "retry",
    actionLabel: "Tentar novamente",
    captureInTelemetry: true,
  },
};

const readConnectivityStatus = (
  connectivityStatus?: RuntimeConnectivityStatus,
): RuntimeConnectivityStatus => {
  return connectivityStatus ?? useAppShellStore.getState().connectivityStatus;
};

const isApiErrorRetryable = (error: ApiError): boolean => {
  const retryable = error.details.retryable;
  if (typeof retryable === "boolean") {
    return retryable;
  }

  return (
    NETWORK_STATUSES.has(error.status) ||
    DEGRADED_STATUSES.has(error.status) ||
    error.status >= 500
  );
};

const shouldExposeApiMessage = (
  error: ApiError,
  category: AppErrorCategory,
): boolean => {
  if (error.message.trim().length === 0 || error.status === 0) {
    return false;
  }

  return category === "auth" || category === "validation";
};

const resolveCategoryFromApiError = (
  rawError: unknown,
  error: ApiError,
  connectivityStatus: RuntimeConnectivityStatus,
): AppErrorCategory => {
  if (connectivityStatus === "offline") {
    return "network";
  }

  if (error.status === 401 || error.status === 403 || AUTH_CODES.has(error.code)) {
    return "auth";
  }

  if (
    [400, 404, 409, 422].includes(error.status) ||
    VALIDATION_CODES.has(error.code)
  ) {
    return "validation";
  }

  if (connectivityStatus === "degraded" || DEGRADED_STATUSES.has(error.status)) {
    return "degraded";
  }

  if (rawError instanceof Error && !(rawError instanceof ApiError) && error.status === 0) {
    return "unexpected";
  }

  if (NETWORK_STATUSES.has(error.status)) {
    return "network";
  }

  if (error.status >= 500) {
    return "server";
  }

  return "unexpected";
};

export const createAppErrorState = (
  error: unknown,
  options: CreateAppErrorStateOptions = {},
): AppErrorState => {
  const connectivityStatus = readConnectivityStatus(options.connectivityStatus);
  const apiError = toApiError(error);
  const category = resolveCategoryFromApiError(error, apiError, connectivityStatus);
  const presentation = CATEGORY_PRESENTATION[category];
  const retryable =
    presentation.recoverability === "retry" && isApiErrorRetryable(apiError);
  const title = options.fallbackTitle ?? presentation.title;
  const description =
    options.fallbackDescription ??
    (shouldExposeApiMessage(apiError, category)
      ? apiError.message
      : presentation.description);

  return {
    category,
    recoverability: presentation.recoverability,
    title,
    description,
    canRetry: retryable,
    actionLabel: retryable ? presentation.actionLabel : null,
    captureInTelemetry: presentation.captureInTelemetry,
    status: apiError.status,
    code: apiError.code,
    technicalMessage: apiError.message,
  };
};
