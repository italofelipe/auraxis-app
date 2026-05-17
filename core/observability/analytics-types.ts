export type AnalyticsPropertyPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AnalyticsPropertyValue =
  | AnalyticsPropertyPrimitive
  | readonly AnalyticsPropertyValue[]
  | {
      readonly [key: string]: AnalyticsPropertyValue;
    };

export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export interface AuthLoginSuccessAnalyticsProperties
  extends AnalyticsProperties {
  readonly method?: "password" | "biometric" | "magic-link" | "unknown";
  readonly emailConfirmed?: boolean;
}

export interface AuthRegisterCompletedAnalyticsProperties
  extends AnalyticsProperties {
  readonly emailConfirmed?: boolean;
  readonly locale?: string;
}

export interface AuthLogoutAnalyticsProperties extends AnalyticsProperties {
  readonly reason?: "manual" | "session_expired" | "auth_failure" | "unknown";
}

export interface TransactionAnalyticsProperties extends AnalyticsProperties {
  readonly transactionType?: "income" | "expense" | "transfer" | "unknown";
  readonly source?: string;
}

export interface GoalCreatedAnalyticsProperties extends AnalyticsProperties {
  readonly goalType?: string;
  readonly targetAmountBucket?: string;
}

export interface GoalSimulatedAnalyticsProperties extends AnalyticsProperties {
  readonly horizonMonths?: number;
  readonly contributionBucket?: string;
}

export interface ToolUsedAnalyticsProperties extends AnalyticsProperties {
  readonly slug: string;
}

export interface SubscriptionCheckoutAnalyticsProperties
  extends AnalyticsProperties {
  readonly provider?: "hosted" | "store" | "unknown";
  readonly planId?: string;
  readonly status?: "opened" | "completed" | "cancelled" | "unknown";
}

export interface DashboardPeriodChangedAnalyticsProperties
  extends AnalyticsProperties {
  readonly period: string;
}

export interface AnalyticsEventPropertiesByName {
  readonly "auth.login.success": AuthLoginSuccessAnalyticsProperties;
  readonly "auth.register.completed": AuthRegisterCompletedAnalyticsProperties;
  readonly "auth.logout": AuthLogoutAnalyticsProperties;
  readonly "transaction.created": TransactionAnalyticsProperties;
  readonly "transaction.deleted": TransactionAnalyticsProperties;
  readonly "transaction.restored": TransactionAnalyticsProperties;
  readonly "goal.created": GoalCreatedAnalyticsProperties;
  readonly "goal.simulated": GoalSimulatedAnalyticsProperties;
  readonly "tool.used": ToolUsedAnalyticsProperties;
  readonly "subscription.checkout.opened": SubscriptionCheckoutAnalyticsProperties;
  readonly "subscription.checkout.completed": SubscriptionCheckoutAnalyticsProperties;
  readonly "dashboard.period.changed": DashboardPeriodChangedAnalyticsProperties;
}

export type AnalyticsEventName = keyof AnalyticsEventPropertiesByName;

export interface AnalyticsClient {
  capture: <TEventName extends AnalyticsEventName>(
    eventName: TEventName,
    properties?: AnalyticsEventPropertiesByName[TEventName],
  ) => void;
  identify: (distinctId: string, traits?: AnalyticsProperties) => void;
  reset: () => void;
}
