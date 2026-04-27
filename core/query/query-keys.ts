export const queryKeys = {
  bootstrap: {
    root: ["bootstrap"] as const,
    user: () => ["bootstrap", "user"] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    overview: () => ["dashboard", "overview"] as const,
  },
  transactions: {
    root: ["transactions"] as const,
    list: () => ["transactions", "list"] as const,
    detail: (transactionId: string) => ["transactions", "detail", transactionId] as const,
    summary: () => ["transactions", "summary"] as const,
    deleted: () => ["transactions", "deleted"] as const,
  },
  goals: {
    root: ["goals"] as const,
    list: () => ["goals", "list"] as const,
    plan: (goalId: string) => ["goals", "plan", goalId] as const,
    projection: (goalId: string) => ["goals", "projection", goalId] as const,
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
  userProfile: {
    root: ["user-profile"] as const,
    detail: () => ["user-profile", "detail"] as const,
    notificationPreferences: () =>
      ["user-profile", "notification-preferences"] as const,
  },
  questionnaire: {
    root: ["questionnaire"] as const,
    questions: () => ["questionnaire", "questions"] as const,
  },
  sharedEntries: {
    root: ["shared-entries"] as const,
    byMe: () => ["shared-entries", "by-me"] as const,
    withMe: () => ["shared-entries", "with-me"] as const,
    invitations: () => ["shared-entries", "invitations"] as const,
  },
  subscription: {
    root: ["subscription"] as const,
    me: () => ["subscription", "me"] as const,
    plans: () => ["subscription", "plans"] as const,
  },
  wallet: {
    root: ["wallet"] as const,
    summary: () => ["wallet", "summary"] as const,
    operations: (entryId: string) => ["wallet", "operations", entryId] as const,
    position: (entryId: string) => ["wallet", "position", entryId] as const,
    valuation: () => ["wallet", "valuation"] as const,
    valuationHistory: () => ["wallet", "valuation", "history"] as const,
  },
  observability: {
    root: ["observability"] as const,
    snapshot: () => ["observability", "snapshot"] as const,
    metrics: () => ["observability", "metrics"] as const,
  },
  fiscal: {
    root: ["fiscal"] as const,
    receivables: () => ["fiscal", "receivables"] as const,
    summary: () => ["fiscal", "summary"] as const,
    documents: () => ["fiscal", "documents"] as const,
  },
  tools: {
    root: ["tools"] as const,
    catalog: () => ["tools", "catalog"] as const,
    simulationHistory: (toolId: string) => ["simulations", toolId] as const,
  },
  tags: {
    root: ["tags"] as const,
    list: () => ["tags", "list"] as const,
  },
  accounts: {
    root: ["accounts"] as const,
    list: () => ["accounts", "list"] as const,
  },
  creditCards: {
    root: ["credit-cards"] as const,
    list: () => ["credit-cards", "list"] as const,
  },
  budgets: {
    root: ["budgets"] as const,
    list: () => ["budgets", "list"] as const,
    summary: () => ["budgets", "summary"] as const,
    detail: (budgetId: string) => ["budgets", "detail", budgetId] as const,
  },
} as const;
