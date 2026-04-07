export const queryKeys = {
  bootstrap: {
    root: ["bootstrap"] as const,
    user: () => ["bootstrap", "user"] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    overview: () => ["dashboard", "overview"] as const,
  },
  goals: {
    root: ["goals"] as const,
    list: () => ["goals", "list"] as const,
  },
  alerts: {
    root: ["alerts"] as const,
    list: () => ["alerts", "list"] as const,
    preferences: () => ["alerts", "preferences"] as const,
  },
  entitlements: {
    root: ["entitlements"] as const,
    check: (featureKey: string) => ["entitlements", "check", featureKey] as const,
    access: (featureKey: string) => ["entitlements", "access", featureKey] as const,
  },
  subscription: {
    root: ["subscription"] as const,
    me: () => ["subscription", "me"] as const,
    plans: () => ["subscription", "plans"] as const,
  },
  wallet: {
    root: ["wallet"] as const,
    summary: () => ["wallet", "summary"] as const,
  },
  observability: {
    root: ["observability"] as const,
    snapshot: () => ["observability", "snapshot"] as const,
    metrics: () => ["observability", "metrics"] as const,
  },
  tools: {
    root: ["tools"] as const,
    catalog: () => ["tools", "catalog"] as const,
    simulationHistory: (toolId: string) => ["simulations", toolId] as const,
  },
} as const;
