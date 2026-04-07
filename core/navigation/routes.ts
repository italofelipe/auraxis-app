type MaterialCommunityIconName =
  | "view-dashboard-outline"
  | "wallet-outline"
  | "tools"
  | "bell-outline";

export const appRoutes = {
  root: "/",
  public: {
    login: "/login",
    forgotPassword: "/forgot-password",
  },
  private: {
    dashboard: "/dashboard",
    wallet: "/carteira",
    tools: "/ferramentas",
    alerts: "/alertas",
    subscription: "/assinatura",
    installmentVsCash: "/installment-vs-cash",
  },
} as const;

export type PublicAppRoute =
  (typeof appRoutes.public)[keyof typeof appRoutes.public];
export type PrivateAppRoute =
  (typeof appRoutes.private)[keyof typeof appRoutes.private];
export type AppRoute = typeof appRoutes.root | PublicAppRoute | PrivateAppRoute;

export interface PrivateTabDefinition {
  readonly name: "dashboard" | "carteira" | "ferramentas" | "alertas";
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
