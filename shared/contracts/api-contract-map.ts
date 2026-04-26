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
import type {
  DashboardOverview,
  DashboardTrends,
} from "@/features/dashboard/contracts";
import type {
  EntitlementCheckQuery,
  EntitlementCheckResult,
} from "@/features/entitlements/contracts";
import type {
  CreateGoalCommand,
  GoalDetailResponse,
  GoalListResponse,
  GoalPlan,
  GoalProjection,
  GoalRecord,
  UpdateGoalCommand,
} from "@/features/goals/contracts";
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
import type {
  CreateWalletEntryCommand,
  CreateWalletOperationCommand,
  UpdateWalletEntryCommand,
  WalletEntry,
  WalletOperation,
  WalletOperationsListResponse,
  WalletOperationsPosition,
  WalletSummary,
} from "@/features/wallet/contracts";
import type {
  AlertListResponse,
  AlertPreferenceListResponse,
  AlertPreferenceRecord,
  UpdateAlertPreferenceCommand,
} from "@/features/alerts/contracts";
import type {
  CsvConfirmCommand,
  CsvConfirmResponse,
  CsvPreviewCommand,
  CsvPreviewResponse,
  CreateFiscalDocumentCommand,
  CreateReceivableCommand,
  FiscalDocumentListQuery,
  FiscalDocumentListResponse,
  FiscalDocumentRecord,
  MarkReceivableReceivedCommand,
  ReceivableListQuery,
  ReceivableListResponse,
  ReceivableRecord,
  RevenueSummary,
} from "@/features/fiscal/contracts";
import type {
  QuestionnaireCollection,
  QuestionnaireResult,
  SubmitQuestionnaireCommand,
} from "@/features/questionnaire/contracts";
import type {
  CreateSharedEntryCommand,
  CreateSharedInvitationCommand,
  SharedEntryListResponse,
  SharedEntryRecord,
  SharedInvitationListResponse,
  SharedInvitationRecord,
} from "@/features/shared-entries/contracts";
import type {
  CreateTransactionCommand,
  TransactionCollection,
  TransactionListQuery,
  TransactionRecord,
  TransactionSummary,
  TransactionSummaryQuery,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import type {
  UpdateUserProfileCommand,
  UserProfile,
} from "@/features/user-profile/contracts";
import type {
  CreateGoalFromInstallmentVsCashDto,
  CreateGoalFromInstallmentVsCashResponseDto,
  CreatePlannedExpenseFromInstallmentVsCashDto,
  CreatePlannedExpenseFromInstallmentVsCashResponseDto,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashHistoryQuery,
  InstallmentVsCashHistoryResponseDto,
  InstallmentVsCashSaveResponseDto,
} from "@/features/tools/contracts";

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
  userProfileGet: defineApiContract<"GET", "/user/profile", never, UserProfile>({
    method: "GET",
    path: "/user/profile",
    authRequired: true,
  }),
  userProfileUpdate: defineApiContract<
    "PUT",
    "/user/profile",
    UpdateUserProfileCommand,
    UserProfile
  >({
    method: "PUT",
    path: "/user/profile",
    authRequired: true,
  }),
  userQuestionnaireGet: defineApiContract<
    "GET",
    "/user/profile/questionnaire",
    never,
    QuestionnaireCollection
  >({
    method: "GET",
    path: "/user/profile/questionnaire",
    authRequired: true,
  }),
  userQuestionnaireSubmit: defineApiContract<
    "POST",
    "/user/profile/questionnaire",
    SubmitQuestionnaireCommand,
    QuestionnaireResult
  >({
    method: "POST",
    path: "/user/profile/questionnaire",
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
  dashboardTrends: defineApiContract<
    "GET",
    "/dashboard/trends",
    never,
    DashboardTrends
  >({
    method: "GET",
    path: "/dashboard/trends",
    authRequired: true,
  }),
  transactionsList: defineApiContract<
    "GET",
    "/transactions",
    never,
    TransactionCollection,
    TransactionListQuery
  >({
    method: "GET",
    path: "/transactions",
    authRequired: true,
  }),
  transactionsCreate: defineApiContract<
    "POST",
    "/transactions",
    CreateTransactionCommand,
    TransactionRecord
  >({
    method: "POST",
    path: "/transactions",
    authRequired: true,
  }),
  transactionDetail: defineApiContract<
    "GET",
    "/transactions/{transaction_id}",
    never,
    TransactionRecord
  >({
    method: "GET",
    path: "/transactions/{transaction_id}",
    authRequired: true,
  }),
  transactionUpdate: defineApiContract<
    "PUT",
    "/transactions/{transaction_id}",
    UpdateTransactionCommand,
    TransactionRecord
  >({
    method: "PUT",
    path: "/transactions/{transaction_id}",
    authRequired: true,
  }),
  transactionDelete: defineApiContract<
    "DELETE",
    "/transactions/{transaction_id}",
    never,
    void
  >({
    method: "DELETE",
    path: "/transactions/{transaction_id}",
    authRequired: true,
  }),
  transactionsSummary: defineApiContract<
    "GET",
    "/transactions/summary",
    never,
    TransactionSummary,
    TransactionSummaryQuery
  >({
    method: "GET",
    path: "/transactions/summary",
    authRequired: true,
  }),
  goalsList: defineApiContract<"GET", "/goals", never, GoalListResponse>({
    method: "GET",
    path: "/goals",
    authRequired: true,
  }),
  goalsCreate: defineApiContract<
    "POST",
    "/goals",
    CreateGoalCommand,
    GoalRecord
  >({
    method: "POST",
    path: "/goals",
    authRequired: true,
  }),
  goalDetail: defineApiContract<
    "GET",
    "/goals/{goal_id}",
    never,
    GoalDetailResponse
  >({
    method: "GET",
    path: "/goals/{goal_id}",
    authRequired: true,
  }),
  goalUpdate: defineApiContract<
    "PATCH",
    "/goals/{goal_id}",
    UpdateGoalCommand,
    GoalRecord
  >({
    method: "PATCH",
    path: "/goals/{goal_id}",
    authRequired: true,
  }),
  goalDelete: defineApiContract<
    "DELETE",
    "/goals/{goal_id}",
    never,
    void
  >({
    method: "DELETE",
    path: "/goals/{goal_id}",
    authRequired: true,
  }),
  goalPlan: defineApiContract<
    "GET",
    "/goals/{goal_id}/plan",
    never,
    GoalPlan
  >({
    method: "GET",
    path: "/goals/{goal_id}/plan",
    authRequired: true,
  }),
  goalProjection: defineApiContract<
    "GET",
    "/goals/{goal_id}/projection",
    never,
    GoalProjection
  >({
    method: "GET",
    path: "/goals/{goal_id}/projection",
    authRequired: true,
  }),
  walletSummary: defineApiContract<"GET", "/wallet", never, WalletSummary>({
    method: "GET",
    path: "/wallet",
    authRequired: true,
  }),
  walletCreate: defineApiContract<
    "POST",
    "/wallet",
    CreateWalletEntryCommand,
    WalletEntry
  >({
    method: "POST",
    path: "/wallet",
    authRequired: true,
  }),
  walletDetail: defineApiContract<
    "GET",
    "/wallet/{investment_id}",
    never,
    WalletEntry
  >({
    method: "GET",
    path: "/wallet/{investment_id}",
    authRequired: true,
  }),
  walletUpdate: defineApiContract<
    "PATCH",
    "/wallet/{investment_id}",
    UpdateWalletEntryCommand,
    WalletEntry
  >({
    method: "PATCH",
    path: "/wallet/{investment_id}",
    authRequired: true,
  }),
  walletDelete: defineApiContract<
    "DELETE",
    "/wallet/{investment_id}",
    never,
    void
  >({
    method: "DELETE",
    path: "/wallet/{investment_id}",
    authRequired: true,
  }),
  walletOperationsList: defineApiContract<
    "GET",
    "/wallet/{investment_id}/operations",
    never,
    WalletOperationsListResponse
  >({
    method: "GET",
    path: "/wallet/{investment_id}/operations",
    authRequired: true,
  }),
  walletOperationCreate: defineApiContract<
    "POST",
    "/wallet/{investment_id}/operations",
    CreateWalletOperationCommand,
    WalletOperation
  >({
    method: "POST",
    path: "/wallet/{investment_id}/operations",
    authRequired: true,
  }),
  walletOperationDelete: defineApiContract<
    "DELETE",
    "/wallet/{investment_id}/operations/{operation_id}",
    never,
    void
  >({
    method: "DELETE",
    path: "/wallet/{investment_id}/operations/{operation_id}",
    authRequired: true,
  }),
  walletOperationsPosition: defineApiContract<
    "GET",
    "/wallet/{investment_id}/operations/position",
    never,
    WalletOperationsPosition
  >({
    method: "GET",
    path: "/wallet/{investment_id}/operations/position",
    authRequired: true,
  }),
  alertsList: defineApiContract<"GET", "/alerts", never, AlertListResponse>({
    method: "GET",
    path: "/alerts",
    authRequired: true,
  }),
  alertsMarkRead: defineApiContract<
    "POST",
    "/alerts/{alertId}/read",
    never,
    void
  >({
    method: "POST",
    path: "/alerts/{alertId}/read",
    authRequired: true,
  }),
  alertsDelete: defineApiContract<
    "DELETE",
    "/alerts/{alertId}",
    never,
    void
  >({
    method: "DELETE",
    path: "/alerts/{alertId}",
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
  sharedEntriesByMe: defineApiContract<
    "GET",
    "/shared-entries/by-me",
    never,
    SharedEntryListResponse
  >({
    method: "GET",
    path: "/shared-entries/by-me",
    authRequired: true,
  }),
  sharedEntriesWithMe: defineApiContract<
    "GET",
    "/shared-entries/with-me",
    never,
    SharedEntryListResponse
  >({
    method: "GET",
    path: "/shared-entries/with-me",
    authRequired: true,
  }),
  sharedEntriesCreate: defineApiContract<
    "POST",
    "/shared-entries",
    CreateSharedEntryCommand,
    SharedEntryRecord
  >({
    method: "POST",
    path: "/shared-entries",
    authRequired: true,
  }),
  sharedEntriesDelete: defineApiContract<
    "DELETE",
    "/shared-entries/{sharedEntryId}",
    never,
    SharedEntryRecord
  >({
    method: "DELETE",
    path: "/shared-entries/{sharedEntryId}",
    authRequired: true,
  }),
  sharedInvitationsList: defineApiContract<
    "GET",
    "/shared-entries/invitations",
    never,
    SharedInvitationListResponse
  >({
    method: "GET",
    path: "/shared-entries/invitations",
    authRequired: true,
  }),
  sharedInvitationsCreate: defineApiContract<
    "POST",
    "/shared-entries/invitations",
    CreateSharedInvitationCommand,
    SharedInvitationRecord
  >({
    method: "POST",
    path: "/shared-entries/invitations",
    authRequired: true,
  }),
  sharedInvitationsAccept: defineApiContract<
    "POST",
    "/shared-entries/invitations/{token}/accept",
    never,
    SharedInvitationRecord
  >({
    method: "POST",
    path: "/shared-entries/invitations/{token}/accept",
    authRequired: true,
  }),
  sharedInvitationsDelete: defineApiContract<
    "DELETE",
    "/shared-entries/invitations/{invitationId}",
    never,
    SharedInvitationRecord
  >({
    method: "DELETE",
    path: "/shared-entries/invitations/{invitationId}",
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
  entitlementsCheck: defineApiContract<
    "GET",
    "/entitlements/check",
    never,
    EntitlementCheckResult,
    EntitlementCheckQuery
  >({
    method: "GET",
    path: "/entitlements/check",
    authRequired: true,
  }),
  fiscalCsvPreview: defineApiContract<
    "POST",
    "/fiscal/csv/upload",
    CsvPreviewCommand,
    CsvPreviewResponse
  >({
    method: "POST",
    path: "/fiscal/csv/upload",
    authRequired: true,
  }),
  fiscalCsvConfirm: defineApiContract<
    "POST",
    "/fiscal/csv/confirm",
    CsvConfirmCommand,
    CsvConfirmResponse
  >({
    method: "POST",
    path: "/fiscal/csv/confirm",
    authRequired: true,
  }),
  fiscalReceivablesList: defineApiContract<
    "GET",
    "/fiscal/receivables",
    never,
    ReceivableListResponse,
    ReceivableListQuery
  >({
    method: "GET",
    path: "/fiscal/receivables",
    authRequired: true,
  }),
  fiscalReceivablesCreate: defineApiContract<
    "POST",
    "/fiscal/receivables",
    CreateReceivableCommand,
    ReceivableRecord
  >({
    method: "POST",
    path: "/fiscal/receivables",
    authRequired: true,
  }),
  fiscalReceivablesReceive: defineApiContract<
    "PATCH",
    "/fiscal/receivables/{entryId}/receive",
    MarkReceivableReceivedCommand,
    ReceivableRecord
  >({
    method: "PATCH",
    path: "/fiscal/receivables/{entryId}/receive",
    authRequired: true,
  }),
  fiscalReceivablesDelete: defineApiContract<
    "DELETE",
    "/fiscal/receivables/{entryId}",
    never,
    ReceivableRecord
  >({
    method: "DELETE",
    path: "/fiscal/receivables/{entryId}",
    authRequired: true,
  }),
  fiscalReceivablesSummary: defineApiContract<
    "GET",
    "/fiscal/receivables/summary",
    never,
    RevenueSummary
  >({
    method: "GET",
    path: "/fiscal/receivables/summary",
    authRequired: true,
  }),
  fiscalDocumentsList: defineApiContract<
    "GET",
    "/fiscal/fiscal-documents",
    never,
    FiscalDocumentListResponse,
    FiscalDocumentListQuery
  >({
    method: "GET",
    path: "/fiscal/fiscal-documents",
    authRequired: true,
  }),
  fiscalDocumentsCreate: defineApiContract<
    "POST",
    "/fiscal/fiscal-documents",
    CreateFiscalDocumentCommand,
    FiscalDocumentRecord
  >({
    method: "POST",
    path: "/fiscal/fiscal-documents",
    authRequired: true,
  }),
  installmentVsCashCalculate: defineApiContract<
    "POST",
    "/simulations/installment-vs-cash/calculate",
    InstallmentVsCashCalculationRequestDto,
    InstallmentVsCashCalculationResponseDto
  >({
    method: "POST",
    path: "/simulations/installment-vs-cash/calculate",
    authRequired: true,
  }),
  installmentVsCashSave: defineApiContract<
    "POST",
    "/simulations/installment-vs-cash",
    InstallmentVsCashCalculationRequestDto,
    InstallmentVsCashSaveResponseDto
  >({
    method: "POST",
    path: "/simulations/installment-vs-cash",
    authRequired: true,
  }),
  installmentVsCashHistory: defineApiContract<
    "GET",
    "/simulations",
    never,
    InstallmentVsCashHistoryResponseDto,
    InstallmentVsCashHistoryQuery
  >({
    method: "GET",
    path: "/simulations",
    authRequired: true,
  }),
  installmentVsCashGoalBridge: defineApiContract<
    "POST",
    "/simulations/{simulation_id}/goal",
    CreateGoalFromInstallmentVsCashDto,
    CreateGoalFromInstallmentVsCashResponseDto
  >({
    method: "POST",
    path: "/simulations/{simulation_id}/goal",
    authRequired: true,
  }),
  installmentVsCashPlannedExpenseBridge: defineApiContract<
    "POST",
    "/simulations/{simulation_id}/planned-expense",
    CreatePlannedExpenseFromInstallmentVsCashDto,
    CreatePlannedExpenseFromInstallmentVsCashResponseDto
  >({
    method: "POST",
    path: "/simulations/{simulation_id}/planned-expense",
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
  subscriptionTrial: defineApiContract<
    "POST",
    "/subscriptions/trial",
    never,
    SubscriptionState
  >({
    method: "POST",
    path: "/subscriptions/trial",
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
