import type {
  AuthActionResult,
  AuthSession,
  ConfirmEmailCommand,
  ForgotPasswordCommand,
  LoginCommand,
  RegisterCommand,
  ResetPasswordCommand,
} from "@/features/auth/contracts";
import type {
  UserBootstrap,
  UserBootstrapQuery,
} from "@/features/bootstrap/contracts";
import type { DashboardOverview } from "@/features/dashboard/contracts";
import type { GoalListResponse } from "@/features/goals/contracts";
import type {
  ObservabilityMetricsSnapshot,
  ObservabilitySnapshot,
} from "@/features/observability/contracts";
import type {
  BillingPlan,
  CheckoutSession,
  CreateCheckoutCommand,
  SubscriptionState,
} from "@/features/subscription/contracts";
import type { WalletSummary } from "@/features/wallet/contracts";
import type {
  AlertListResponse,
  AlertPreferenceListResponse,
  AlertPreferenceRecord,
  UpdateAlertPreferenceCommand,
} from "@/features/alerts/contracts";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiContractDefinition<
  TMethod extends HttpMethod,
  TPath extends string,
  TRequest = never,
  TResponse = never,
  TQuery = never,
> {
  readonly method: TMethod;
  readonly path: TPath;
  readonly authRequired: boolean;
  readonly __request?: TRequest;
  readonly __response?: TResponse;
  readonly __query?: TQuery;
}

const defineApiContract = <
  TMethod extends HttpMethod,
  TPath extends string,
  TRequest = never,
  TResponse = never,
  TQuery = never,
>(
  contract: Omit<
    ApiContractDefinition<TMethod, TPath, TRequest, TResponse, TQuery>,
    "__request" | "__response" | "__query"
  >,
): ApiContractDefinition<TMethod, TPath, TRequest, TResponse, TQuery> => {
  return contract;
};

export const apiContractMap = {
  authLogin: defineApiContract<"POST", "/auth/login", LoginCommand, AuthSession>({
    method: "POST",
    path: "/auth/login",
    authRequired: false,
  }),
  authRegister: defineApiContract<
    "POST",
    "/auth/register",
    RegisterCommand,
    AuthActionResult
  >({
    method: "POST",
    path: "/auth/register",
    authRequired: false,
  }),
  authLogout: defineApiContract<"POST", "/auth/logout", never, void>({
    method: "POST",
    path: "/auth/logout",
    authRequired: true,
  }),
  authForgotPassword: defineApiContract<
    "POST",
    "/auth/password/forgot",
    ForgotPasswordCommand,
    AuthActionResult
  >({
    method: "POST",
    path: "/auth/password/forgot",
    authRequired: false,
  }),
  authResetPassword: defineApiContract<
    "POST",
    "/auth/password/reset",
    ResetPasswordCommand,
    AuthActionResult
  >({
    method: "POST",
    path: "/auth/password/reset",
    authRequired: false,
  }),
  authConfirmEmail: defineApiContract<
    "POST",
    "/auth/email/confirm",
    ConfirmEmailCommand,
    AuthActionResult
  >({
    method: "POST",
    path: "/auth/email/confirm",
    authRequired: false,
  }),
  authResendEmail: defineApiContract<
    "POST",
    "/auth/email/resend",
    never,
    AuthActionResult
  >({
    method: "POST",
    path: "/auth/email/resend",
    authRequired: true,
  }),
  userBootstrap: defineApiContract<
    "GET",
    "/user/bootstrap",
    never,
    UserBootstrap,
    UserBootstrapQuery
  >({
    method: "GET",
    path: "/user/bootstrap",
    authRequired: true,
  }),
  dashboardOverview: defineApiContract<
    "GET",
    "/dashboard/overview",
    never,
    DashboardOverview
  >({
    method: "GET",
    path: "/dashboard/overview",
    authRequired: true,
  }),
  goalsList: defineApiContract<"GET", "/goals", never, GoalListResponse>({
    method: "GET",
    path: "/goals",
    authRequired: true,
  }),
  walletSummary: defineApiContract<"GET", "/wallet", never, WalletSummary>({
    method: "GET",
    path: "/wallet",
    authRequired: true,
  }),
  alertsList: defineApiContract<"GET", "/alerts", never, AlertListResponse>({
    method: "GET",
    path: "/alerts",
    authRequired: true,
  }),
  alertPreferences: defineApiContract<
    "GET",
    "/alerts/preferences",
    never,
    AlertPreferenceListResponse
  >({
    method: "GET",
    path: "/alerts/preferences",
    authRequired: true,
  }),
  updateAlertPreference: defineApiContract<
    "PUT",
    "/alerts/preferences/{category}",
    UpdateAlertPreferenceCommand,
    AlertPreferenceRecord
  >({
    method: "PUT",
    path: "/alerts/preferences/{category}",
    authRequired: true,
  }),
  subscriptionPlans: defineApiContract<
    "GET",
    "/subscriptions/plans",
    never,
    BillingPlan[]
  >({
    method: "GET",
    path: "/subscriptions/plans",
    authRequired: false,
  }),
  subscriptionMe: defineApiContract<
    "GET",
    "/subscriptions/me",
    never,
    SubscriptionState
  >({
    method: "GET",
    path: "/subscriptions/me",
    authRequired: true,
  }),
  subscriptionCheckout: defineApiContract<
    "POST",
    "/subscriptions/checkout",
    CreateCheckoutCommand,
    CheckoutSession
  >({
    method: "POST",
    path: "/subscriptions/checkout",
    authRequired: true,
  }),
  subscriptionCancel: defineApiContract<
    "POST",
    "/subscriptions/cancel",
    never,
    SubscriptionState
  >({
    method: "POST",
    path: "/subscriptions/cancel",
    authRequired: true,
  }),
  opsObservability: defineApiContract<
    "GET",
    "/ops/observability",
    never,
    ObservabilitySnapshot
  >({
    method: "GET",
    path: "/ops/observability",
    authRequired: false,
  }),
  opsMetrics: defineApiContract<
    "GET",
    "/ops/metrics",
    never,
    ObservabilityMetricsSnapshot
  >({
    method: "GET",
    path: "/ops/metrics",
    authRequired: false,
  }),
} as const;

export type ApiContractKey = keyof typeof apiContractMap;
export type ApiContractRequest<TKey extends ApiContractKey> = Exclude<
  (typeof apiContractMap)[TKey]["__request"],
  undefined
>;
export type ApiContractResponse<TKey extends ApiContractKey> = Exclude<
  (typeof apiContractMap)[TKey]["__response"],
  undefined
>;
export type ApiContractQuery<TKey extends ApiContractKey> = Exclude<
  (typeof apiContractMap)[TKey]["__query"],
  undefined
>;
