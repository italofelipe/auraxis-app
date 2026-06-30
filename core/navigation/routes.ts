import type { Href } from "expo-router";

type MaterialCommunityIconName =
  | "view-dashboard-outline"
  | "wallet-outline"
  | "tools"
  | "bell-outline"
  | "flag-outline"
  | "swap-horizontal"
  | "star-four-points-outline"
  | "credit-card-outline"
  | "target"
  | "dots-horizontal"
  | "view-grid-outline";

export const appRoutes = {
  root: "/",
  legal: {
    privacyPolicy: "/privacy-policy",
    termsOfService: "/terms-of-service",
    confirmEmail: "/confirm-email",
    plans: "/plans",
  },
  public: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    resendConfirmation: "/resend-confirmation",
  },
  private: {
    dashboard: "/dashboard",
    wallet: "/carteira",
    goals: "/metas",
    tools: "/ferramentas",
    alerts: "/alertas",
    subscription: "/assinatura",
    installmentVsCash: "/installment-vs-cash",
    confirmEmailPending: "/confirm-email-pending",
    sharedEntries: "/compartilhamentos",
    transactions: "/transacoes",
    importTransactions: "/importar-transacoes",
    profile: "/perfil",
    fiscal: "/fiscal",
    questionnaire: "/questionario",
    walletOperations: "/carteira-operacoes",
    tags: "/tags",
    accounts: "/contas",
    creditCards: "/cartoes",
    budgets: "/orcamentos",
    insights: "/insights",
    focus: "/foco",
    onboarding: "/onboarding",
    goalSimulator: "/simulador-meta",
    transactionsTrash: "/lixeira-transacoes",
    salarySimulator: "/simulador-salario",
    notificationPreferences: "/preferencias-notificacao",
    privacyCenter: "/privacidade",
    dangerZone: "/perfil-zona-de-perigo",
    simulationsHistory: "/simulacoes",
    planning: "/planejamento",
    moreHub: "/mais",
    checkoutSuccess: "/checkout/success",
    checkoutCancel: "/checkout/cancel",
  },
} as const;

/**
 * Builds the dynamic per-goal scenario sandbox route for a given id.
 * @param goalId Goal id from the goals list.
 * @returns Expo Router-compatible path under /metas.
 */
export const buildGoalScenarioPath = (goalId: string): Href => ({
  pathname: "/metas/[id]/simular",
  params: { id: goalId },
});

/**
 * Builds the dynamic goal detail route (progress, plan and projection).
 * @param goalId Goal id from the goals list.
 * @returns Expo Router-compatible path under /metas.
 */
export const buildGoalDetailPath = (goalId: string): Href => ({
  pathname: "/metas/[id]",
  params: { id: goalId },
});

/**
 * Builds the dynamic ticker detail route (price chart + position).
 * @param ticker BRAPI ticker symbol (case-insensitive — normalized here).
 * @returns Expo Router-compatible path under /carteira.
 */
export const buildTickerDetailPath = (ticker: string): Href => ({
  pathname: "/carteira/[ticker]",
  params: { ticker: ticker.trim().toUpperCase() },
});

/**
 * Builds the dynamic bill route for a credit card.
 * @param creditCardId Credit card id from the card list.
 * @returns Expo Router-compatible path under /cartoes.
 */
export const buildCreditCardBillPath = (creditCardId: string): Href => ({
  pathname: "/cartoes/[id]/fatura",
  params: { id: creditCardId },
});

/**
 * Builds the dynamic credit card detail route (info, cycle and utilization).
 * @param creditCardId Credit card id from the card list.
 * @returns Expo Router-compatible path under /cartoes.
 */
export const buildCreditCardDetailPath = (creditCardId: string): Href => ({
  pathname: "/cartoes/[id]",
  params: { id: creditCardId },
});

/**
 * Builds the dynamic budget detail route (usage, period and transactions).
 * @param budgetId Budget id from the budgets list.
 * @returns Expo Router-compatible path under /orcamentos.
 */
export const buildBudgetDetailPath = (budgetId: string): Href => ({
  pathname: "/orcamentos/[id]",
  params: { id: budgetId },
});

export type PublicAppRoute =
  (typeof appRoutes.public)[keyof typeof appRoutes.public];
export type PrivateAppRoute =
  (typeof appRoutes.private)[keyof typeof appRoutes.private];
export type LegalAppRoute =
  (typeof appRoutes.legal)[keyof typeof appRoutes.legal];
export type AppRoute =
  | typeof appRoutes.root
  | PublicAppRoute
  | PrivateAppRoute
  | LegalAppRoute;

export type AppRouteAccess = "root" | "public" | "private" | "legal";

export interface AppRouteDefinition {
  readonly key: string;
  readonly path: AppRoute;
  readonly access: AppRouteAccess;
  readonly tabVisible: boolean;
  readonly supportsHostedCheckoutReturn: boolean;
}

export interface PrivateTabDefinition {
  readonly name: "dashboard" | "transacoes" | "insights" | "cartoes" | "mais";
  readonly href: PrivateAppRoute;
  readonly title: string;
  readonly icon: MaterialCommunityIconName;
}

// Destinos das tabs (handoff menu liquido): Insights e Cartoes ganham acesso
// direto; Planejamento e demais destinos ficam no hub "Mais".
export const privateTabDefinitions: readonly PrivateTabDefinition[] = [
  {
    name: "dashboard",
    href: appRoutes.private.dashboard,
    title: "Início",
    icon: "view-dashboard-outline",
  },
  {
    name: "transacoes",
    href: appRoutes.private.transactions,
    title: "Transações",
    icon: "swap-horizontal",
  },
  {
    name: "insights",
    href: appRoutes.private.insights,
    title: "Insights",
    icon: "star-four-points-outline",
  },
  {
    name: "cartoes",
    href: appRoutes.private.creditCards,
    title: "Cartões",
    icon: "credit-card-outline",
  },
  {
    name: "mais",
    href: appRoutes.private.moreHub,
    title: "Mais",
    icon: "dots-horizontal",
  },
] as const;

export const appRouteRegistry: readonly AppRouteDefinition[] = [
  {
    key: "root",
    path: appRoutes.root,
    access: "root",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "login",
    path: appRoutes.public.login,
    access: "public",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "register",
    path: appRoutes.public.register,
    access: "public",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "forgotPassword",
    path: appRoutes.public.forgotPassword,
    access: "public",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "resetPassword",
    path: appRoutes.public.resetPassword,
    access: "public",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "resendConfirmation",
    path: appRoutes.public.resendConfirmation,
    access: "public",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "dashboard",
    path: appRoutes.private.dashboard,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "wallet",
    path: appRoutes.private.wallet,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "goals",
    path: appRoutes.private.goals,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "tools",
    path: appRoutes.private.tools,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "alerts",
    path: appRoutes.private.alerts,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "subscription",
    path: appRoutes.private.subscription,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: true,
  },
  {
    key: "installmentVsCash",
    path: appRoutes.private.installmentVsCash,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "confirmEmailPending",
    path: appRoutes.private.confirmEmailPending,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "sharedEntries",
    path: appRoutes.private.sharedEntries,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "planning",
    path: appRoutes.private.planning,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "moreHub",
    path: appRoutes.private.moreHub,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "transactions",
    path: appRoutes.private.transactions,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "importTransactions",
    path: appRoutes.private.importTransactions,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "profile",
    path: appRoutes.private.profile,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "fiscal",
    path: appRoutes.private.fiscal,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "questionnaire",
    path: appRoutes.private.questionnaire,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "walletOperations",
    path: appRoutes.private.walletOperations,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "tags",
    path: appRoutes.private.tags,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "accounts",
    path: appRoutes.private.accounts,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "creditCards",
    path: appRoutes.private.creditCards,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "budgets",
    path: appRoutes.private.budgets,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "insights",
    path: appRoutes.private.insights,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "focus",
    path: appRoutes.private.focus,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "onboarding",
    path: appRoutes.private.onboarding,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "goalSimulator",
    path: appRoutes.private.goalSimulator,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "transactionsTrash",
    path: appRoutes.private.transactionsTrash,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "salarySimulator",
    path: appRoutes.private.salarySimulator,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "notificationPreferences",
    path: appRoutes.private.notificationPreferences,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "privacyCenter",
    path: appRoutes.private.privacyCenter,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "checkoutSuccess",
    path: appRoutes.private.checkoutSuccess,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: true,
  },
  {
    key: "checkoutCancel",
    path: appRoutes.private.checkoutCancel,
    access: "private",
    tabVisible: false,
    supportsHostedCheckoutReturn: true,
  },
  {
    key: "privacyPolicy",
    path: appRoutes.legal.privacyPolicy,
    access: "legal",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "termsOfService",
    path: appRoutes.legal.termsOfService,
    access: "legal",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "confirmEmail",
    path: appRoutes.legal.confirmEmail,
    access: "legal",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "plans",
    path: appRoutes.legal.plans,
    access: "legal",
    tabVisible: false,
    supportsHostedCheckoutReturn: false,
  },
] as const;

const privateRouteSet = new Set<PrivateAppRoute>(
  appRouteRegistry
    .filter((route) => route.access === "private")
    .map((route) => route.path as PrivateAppRoute),
);

const publicRouteSet = new Set<PublicAppRoute>(
  appRouteRegistry
    .filter((route) => route.access === "public")
    .map((route) => route.path as PublicAppRoute),
);

const legalRouteSet = new Set<LegalAppRoute>(
  appRouteRegistry
    .filter((route) => route.access === "legal")
    .map((route) => route.path as LegalAppRoute),
);

export const isPrivateAppRoute = (route: string): route is PrivateAppRoute => {
  return privateRouteSet.has(route as PrivateAppRoute);
};

export const isPublicAppRoute = (route: string): route is PublicAppRoute => {
  return publicRouteSet.has(route as PublicAppRoute);
};

export const isLegalAppRoute = (route: string): route is LegalAppRoute => {
  return legalRouteSet.has(route as LegalAppRoute);
};
