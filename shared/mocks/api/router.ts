import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { alertListFixture, alertPreferenceListFixture } from "@/features/alerts/mocks";
import { authActionFixture, authSessionFixture } from "@/features/auth/mocks";
import { userBootstrapFixture } from "@/features/bootstrap/mocks";
import {
  dashboardOverviewFixture,
  dashboardTrendsFixture,
} from "@/features/dashboard/mocks";
import { goalListFixture } from "@/features/goals/mocks";
import {
  observabilitySnapshotFixture,
  prometheusMetricsFixture,
} from "@/features/observability/mocks";
import {
  billingPlanFixtures,
  checkoutSessionFixture,
  subscriptionFixture,
} from "@/features/subscription/mocks";
import { walletCollectionFixture } from "@/features/wallet/mocks";

interface MockApiResponsePayload {
  readonly status: number;
  readonly body: unknown;
  readonly headers?: Record<string, string>;
}

interface MockRouteContext {
  readonly method: string;
  readonly pathname: string;
  readonly body: Record<string, unknown>;
  readonly query: URLSearchParams;
}

type MockRouteHandler = (
  context: MockRouteContext,
) => MockApiResponsePayload | null;

interface SerializedSubscriptionEnvelope {
  readonly subscription: {
    readonly id: string;
    readonly user_id: string;
    readonly plan_code: string;
    readonly offer_code: string | null;
    readonly status: string;
    readonly billing_cycle: string | null;
    readonly provider: string | null;
    readonly provider_subscription_id: string | null;
    readonly trial_ends_at: string | null;
    readonly current_period_start: string | null;
    readonly current_period_end: string | null;
    readonly canceled_at: string | null;
    readonly created_at: string | null;
    readonly updated_at: string | null;
  };
}

interface SerializedAlertsEnvelope {
  readonly alerts: {
    readonly id: string;
    readonly user_id: string;
    readonly category: string;
    readonly status: string | null;
    readonly entity_type: string | null;
    readonly entity_id: string | null;
    readonly triggered_at: string | null;
    readonly sent_at: string | null;
    readonly created_at: string | null;
  }[];
}

interface SerializedAlertPreferencesEnvelope {
  readonly preferences: {
    readonly id: string;
    readonly user_id: string;
    readonly category: string;
    readonly enabled: boolean;
    readonly global_opt_out: boolean;
    readonly updated_at: string | null;
  }[];
}

const ok = <TData>(data: TData): MockApiResponsePayload => {
  return {
    status: 200,
    body: {
      success: true,
      message: "OK",
      data,
    },
  };
};

const created = <TData>(data: TData): MockApiResponsePayload => {
  return {
    status: 201,
    body: {
      success: true,
      message: "Created",
      data,
    },
  };
};

const delay = async (ms: number): Promise<void> => {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getPathname = (config: InternalAxiosRequestConfig): string => {
  const rawUrl = config.url ?? "";

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return new URL(rawUrl).pathname;
  }

  return rawUrl.split("?")[0];
};

const getQueryParams = (config: InternalAxiosRequestConfig): URLSearchParams => {
  const rawUrl = config.url ?? "";
  const search = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
  return new URLSearchParams(search);
};

const readJsonBody = (config: InternalAxiosRequestConfig): Record<string, unknown> => {
  if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
    return config.data as Record<string, unknown>;
  }

  if (typeof config.data === "string" && config.data.length > 0) {
    try {
      return JSON.parse(config.data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return {};
};

const createResponse = (
  config: InternalAxiosRequestConfig,
  payload: MockApiResponsePayload,
): AxiosResponse => {
  return {
    data: payload.body,
    status: payload.status,
    statusText: payload.status === 200 || payload.status === 201 ? "OK" : "ERROR",
    headers: payload.headers ?? {},
    config,
  };
};

const createRouteContext = (config: InternalAxiosRequestConfig): MockRouteContext => {
  return {
    method: (config.method ?? "get").toUpperCase(),
    pathname: getPathname(config),
    body: readJsonBody(config),
    query: getQueryParams(config),
  };
};

const createMissingRouteError = (): MockApiResponsePayload => {
  return {
    status: 404,
    body: {
      success: false,
      message: "Mock route not found",
      error: {
        code: "MOCK_ROUTE_NOT_FOUND",
      },
    },
  };
};

const createInvalidCredentialsError = (): MockApiResponsePayload => {
  return {
    status: 400,
    body: {
      success: false,
      message: "Missing credentials",
      error: {
        code: "VALIDATION_ERROR",
      },
    },
  };
};

const serializeBootstrapResponse = (
  requestedLimit: number,
): Record<string, unknown> => {
  return {
    ...userBootstrapFixture,
    transactions_preview: {
      ...userBootstrapFixture.transactionsPreview,
      limit: requestedLimit,
    },
    user: {
      identity: userBootstrapFixture.user.identity,
      profile: {
        gender: userBootstrapFixture.user.profile.gender,
        birth_date: userBootstrapFixture.user.profile.birthDate,
        state_uf: userBootstrapFixture.user.profile.stateUf,
        occupation: userBootstrapFixture.user.profile.occupation,
      },
      financial_profile: {
        monthly_income_net: userBootstrapFixture.user.financialProfile.monthlyIncomeNet,
        monthly_expenses: userBootstrapFixture.user.financialProfile.monthlyExpenses,
        net_worth: userBootstrapFixture.user.financialProfile.netWorth,
        initial_investment: userBootstrapFixture.user.financialProfile.initialInvestment,
        monthly_investment: userBootstrapFixture.user.financialProfile.monthlyInvestment,
        investment_goal_date: userBootstrapFixture.user.financialProfile.investmentGoalDate,
      },
      investor_profile: {
        declared: userBootstrapFixture.user.investorProfile.declared,
        suggested: userBootstrapFixture.user.investorProfile.suggested,
        quiz_score: userBootstrapFixture.user.investorProfile.quizScore,
        taxonomy_version: userBootstrapFixture.user.investorProfile.taxonomyVersion,
        financial_objectives: userBootstrapFixture.user.investorProfile.financialObjectives,
      },
      product_context: {
        entitlements_version: userBootstrapFixture.user.productContext.entitlementsVersion,
      },
    },
    wallet: {
      ...userBootstrapFixture.wallet,
      items: userBootstrapFixture.wallet.items.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        estimated_value_on_create_date: item.estimatedValueOnCreateDate,
        ticker: item.ticker,
        quantity: item.quantity,
        asset_class: item.assetClass,
        annual_rate: item.annualRate,
        target_withdraw_date: item.targetWithdrawDate,
        register_date: item.registerDate,
        should_be_on_wallet: item.shouldBeOnWallet,
      })),
    },
  };
};

const serializeSubscriptionPlans = (): Record<string, unknown> => {
  return {
    plans: billingPlanFixtures.map((plan) => ({
      slug: plan.slug,
      plan_code: plan.planCode,
      tier: plan.tier,
      billing_cycle: plan.billingCycle,
      display_name: plan.displayName,
      description: plan.description,
      price_cents: plan.priceCents,
      currency: plan.currency,
      trial_days: plan.trialDays,
      checkout_enabled: plan.checkoutEnabled,
      highlighted: plan.highlighted,
    })),
  };
};

const serializeSubscriptionState = (): SerializedSubscriptionEnvelope => {
  return {
    subscription: {
      id: subscriptionFixture.id,
      user_id: subscriptionFixture.userId,
      plan_code: subscriptionFixture.planCode,
      offer_code: subscriptionFixture.offerCode,
      status: subscriptionFixture.status,
      billing_cycle: subscriptionFixture.billingCycle,
      provider: subscriptionFixture.provider,
      provider_subscription_id: subscriptionFixture.providerSubscriptionId,
      trial_ends_at: subscriptionFixture.trialEndsAt,
      current_period_start: subscriptionFixture.currentPeriodStart,
      current_period_end: subscriptionFixture.currentPeriodEnd,
      canceled_at: subscriptionFixture.canceledAt,
      created_at: subscriptionFixture.createdAt,
      updated_at: subscriptionFixture.updatedAt,
    },
  };
};

const serializeDashboardOverview = (): Record<string, unknown> => {
  return {
    month: dashboardOverviewFixture.month,
    totals: {
      income_total: dashboardOverviewFixture.totals.incomeTotal,
      expense_total: dashboardOverviewFixture.totals.expenseTotal,
      balance: dashboardOverviewFixture.totals.balance,
    },
    counts: {
      total_transactions: dashboardOverviewFixture.counts.totalTransactions,
      income_transactions: dashboardOverviewFixture.counts.incomeTransactions,
      expense_transactions: dashboardOverviewFixture.counts.expenseTransactions,
      status: dashboardOverviewFixture.counts.status,
    },
    top_categories: {
      expense: dashboardOverviewFixture.topCategories.expense.map((item) => ({
        tag_id: item.tagId,
        category_name: item.categoryName,
        total_amount: item.totalAmount,
        transactions_count: item.transactionsCount,
      })),
      income: dashboardOverviewFixture.topCategories.income.map((item) => ({
        tag_id: item.tagId,
        category_name: item.categoryName,
        total_amount: item.totalAmount,
        transactions_count: item.transactionsCount,
      })),
    },
  };
};

const serializeWalletCollection = (): Record<string, unknown> => {
  return {
    items: walletCollectionFixture.items.map((item) => ({
      id: item.id,
      name: item.name,
      value: item.value,
      estimated_value_on_create_date: item.estimatedValueOnCreateDate,
      ticker: item.ticker,
      quantity: item.quantity,
      asset_class: item.assetClass,
      annual_rate: item.annualRate,
      target_withdraw_date: item.targetWithdrawDate,
      register_date: item.registerDate,
      should_be_on_wallet: item.shouldBeOnWallet,
    })),
    total: walletCollectionFixture.total,
    returned_items: walletCollectionFixture.returnedItems,
    limit: walletCollectionFixture.limit,
    has_more: walletCollectionFixture.hasMore,
  };
};

const serializeAlerts = (): SerializedAlertsEnvelope => {
  return {
    alerts: alertListFixture.alerts.map((alert) => ({
      id: alert.id,
      user_id: alert.userId,
      category: alert.category,
      status: alert.status,
      entity_type: alert.entityType,
      entity_id: alert.entityId,
      triggered_at: alert.triggeredAt,
      sent_at: alert.sentAt,
      created_at: alert.createdAt,
    })),
  };
};

const serializeAlertPreferences = (): SerializedAlertPreferencesEnvelope => {
  return {
    preferences: alertPreferenceListFixture.preferences.map((preference) => ({
      id: preference.id,
      user_id: preference.userId,
      category: preference.category,
      enabled: preference.enabled,
      global_opt_out: preference.globalOptOut,
      updated_at: preference.updatedAt,
    })),
  };
};

const handleHealthRoute: MockRouteHandler = (context) => {
  if (context.method !== "GET" || context.pathname !== "/healthz") {
    return null;
  }

  return {
    status: 200,
    body: {
      status: "ok",
    },
  };
};

const handleAuthRoutes: MockRouteHandler = (context) => {
  if (context.method === "POST" && context.pathname === "/auth/login") {
    const email = String(context.body.email ?? "");
    const password = String(context.body.password ?? "");
    return email && password
      ? ok({
          token: authSessionFixture.accessToken,
          refresh_token: authSessionFixture.refreshToken,
          user: {
            id: authSessionFixture.user.id,
            name: authSessionFixture.user.name,
            email: authSessionFixture.user.email,
            email_confirmed: authSessionFixture.user.emailConfirmed,
          },
        })
      : createInvalidCredentialsError();
  }

  if (
    context.method === "POST" &&
    [
      "/auth/logout",
      "/auth/password/forgot",
      "/auth/password/reset",
      "/auth/email/confirm",
      "/auth/email/resend",
    ].includes(context.pathname)
  ) {
    return context.pathname === "/auth/logout" ? ok({}) : ok(authActionFixture);
  }

  if (context.method === "POST" && context.pathname === "/auth/register") {
    return created({});
  }

  return null;
};

const handleBootstrapRoute: MockRouteHandler = (context) => {
  if (context.method !== "GET" || context.pathname !== "/user/bootstrap") {
    return null;
  }

  const requestedLimit = Number(context.query.get("transactions_limit") ?? "5");
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 5;
  return ok(serializeBootstrapResponse(limit));
};

const handleSubscriptionRoutes: MockRouteHandler = (context) => {
  if (context.method === "GET" && context.pathname === "/subscriptions/plans") {
    return ok(serializeSubscriptionPlans());
  }

  if (context.method === "GET" && context.pathname === "/subscriptions/me") {
    return ok(serializeSubscriptionState());
  }

  if (context.method === "POST" && context.pathname === "/subscriptions/checkout") {
    return created({
      plan_slug: checkoutSessionFixture.planSlug,
      plan_code: checkoutSessionFixture.planCode,
      billing_cycle: checkoutSessionFixture.billingCycle,
      checkout_url: checkoutSessionFixture.checkoutUrl,
      provider: checkoutSessionFixture.provider,
    });
  }

  if (context.method === "POST" && context.pathname === "/subscriptions/cancel") {
    return ok({
      subscription: {
        ...serializeSubscriptionState().subscription,
        status: "canceled",
        canceled_at: "2026-04-07T18:00:00+00:00",
      },
    });
  }

  return null;
};

const handleDashboardRoutes: MockRouteHandler = (context) => {
  if (context.method === "GET" && context.pathname === "/dashboard/overview") {
    return ok(serializeDashboardOverview());
  }

  if (context.method === "GET" && context.pathname === "/dashboard/trends") {
    return ok({
      months: dashboardTrendsFixture.months,
      series: dashboardTrendsFixture.series,
    });
  }

  return null;
};

const handleWalletRoute: MockRouteHandler = (context) => {
  if (context.method !== "GET" || context.pathname !== "/wallet") {
    return null;
  }

  return ok(serializeWalletCollection());
};

const handleGoalRoute: MockRouteHandler = (context) => {
  if (context.method === "GET" && context.pathname === "/goals") {
    return ok(goalListFixture);
  }

  return null;
};

const handleAlertRoutes: MockRouteHandler = (context) => {
  if (context.method === "GET" && context.pathname === "/alerts") {
    return ok(serializeAlerts());
  }

  if (context.method === "GET" && context.pathname === "/alerts/preferences") {
    return ok(serializeAlertPreferences());
  }

  if (
    context.method === "PUT" &&
    context.pathname.startsWith("/alerts/preferences/")
  ) {
    return ok({
      preference: {
        ...serializeAlertPreferences().preferences[0],
        category: context.pathname.replace("/alerts/preferences/", ""),
        enabled: Boolean(context.body.enabled),
        global_opt_out: Boolean(context.body.global_opt_out),
      },
    });
  }

  if (
    context.method === "POST" &&
    context.pathname.startsWith("/alerts/") &&
    context.pathname.endsWith("/read")
  ) {
    return ok({
      alert: {
        ...serializeAlerts().alerts[0],
        status: "read",
      },
    });
  }

  if (context.method === "DELETE" && context.pathname.startsWith("/alerts/")) {
    return ok({});
  }

  return null;
};

const handleObservabilityRoutes: MockRouteHandler = (context) => {
  if (context.method === "GET" && context.pathname === "/ops/observability") {
    return {
      status: 200,
      body: observabilitySnapshotFixture,
    };
  }

  if (context.method === "GET" && context.pathname === "/ops/metrics") {
    return {
      status: 200,
      body: prometheusMetricsFixture,
      headers: {
        "content-type": "text/plain; version=0.0.4; charset=utf-8",
      },
    };
  }

  return null;
};

const routeHandlers: MockRouteHandler[] = [
  handleHealthRoute,
  handleAuthRoutes,
  handleBootstrapRoute,
  handleSubscriptionRoutes,
  handleDashboardRoutes,
  handleWalletRoute,
  handleGoalRoute,
  handleAlertRoutes,
  handleObservabilityRoutes,
];

const buildMockResponse = (
  config: InternalAxiosRequestConfig,
): MockApiResponsePayload => {
  const context = createRouteContext(config);

  for (const handler of routeHandlers) {
    const payload = handler(context);
    if (payload !== null) {
      return payload;
    }
  }

  return createMissingRouteError();
};

export const createMockApiAdapter = (latencyMs = 0): AxiosAdapter => {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    await delay(latencyMs);
    return createResponse(config, buildMockResponse(config));
  };
};
