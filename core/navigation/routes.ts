type MaterialCommunityIconName =
  | "view-dashboard-outline"
  | "wallet-outline"
  | "tools"
  | "bell-outline"
  | "flag-outline";

export const appRoutes = {
  root: "/",
  public: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
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
  },
} as const;

export type PublicAppRoute =
  (typeof appRoutes.public)[keyof typeof appRoutes.public];
export type PrivateAppRoute =
  (typeof appRoutes.private)[keyof typeof appRoutes.private];
export type AppRoute = typeof appRoutes.root | PublicAppRoute | PrivateAppRoute;

export type AppRouteAccess = "root" | "public" | "private";

export interface AppRouteDefinition {
  readonly key: string;
  readonly path: AppRoute;
  readonly access: AppRouteAccess;
  readonly tabVisible: boolean;
  readonly supportsHostedCheckoutReturn: boolean;
}

export interface PrivateTabDefinition {
  readonly name: "dashboard" | "carteira" | "metas" | "ferramentas" | "alertas";
  readonly href: PrivateAppRoute;
  readonly title: string;
  readonly icon: MaterialCommunityIconName;
}

export const privateTabDefinitions: readonly PrivateTabDefinition[] = [
  {
    name: "dashboard",
    href: appRoutes.private.dashboard,
    title: "Dashboard",
    icon: "view-dashboard-outline",
  },
  {
    name: "carteira",
    href: appRoutes.private.wallet,
    title: "Carteira",
    icon: "wallet-outline",
  },
  {
    name: "metas",
    href: appRoutes.private.goals,
    title: "Metas",
    icon: "flag-outline",
  },
  {
    name: "ferramentas",
    href: appRoutes.private.tools,
    title: "Ferramentas",
    icon: "tools",
  },
  {
    name: "alertas",
    href: appRoutes.private.alerts,
    title: "Alertas",
    icon: "bell-outline",
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
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "goals",
    path: appRoutes.private.goals,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "tools",
    path: appRoutes.private.tools,
    access: "private",
    tabVisible: true,
    supportsHostedCheckoutReturn: false,
  },
  {
    key: "alerts",
    path: appRoutes.private.alerts,
    access: "private",
    tabVisible: true,
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

export const isPrivateAppRoute = (route: string): route is PrivateAppRoute => {
  return privateRouteSet.has(route as PrivateAppRoute);
};

export const isPublicAppRoute = (route: string): route is PublicAppRoute => {
  return publicRouteSet.has(route as PublicAppRoute);
};
