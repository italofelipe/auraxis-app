import { sanitizeTelemetryContext } from "@/core/telemetry/sanitization";
import { isFeatureEnabled } from "@/shared/feature-flags/service";

import type {
  AnalyticsClient,
  AnalyticsEventName,
  AnalyticsEventPropertiesByName,
  AnalyticsProperties,
} from "@/core/observability/analytics-types";

export const ANALYTICS_FEATURE_FLAG_KEY = "app.observability.analytics";

export const ANALYTICS_EVENT_NAMES = Object.freeze([
  "auth.login.success",
  "auth.register.completed",
  "auth.logout",
  "transaction.created",
  "transaction.deleted",
  "transaction.restored",
  "goal.created",
  "goal.simulated",
  "tool.used",
  "subscription.checkout.opened",
  "subscription.checkout.completed",
  "dashboard.period.changed",
] as const satisfies readonly AnalyticsEventName[]);

interface AnalyticsRuntimeState {
  readonly client: AnalyticsClient;
  readonly collectionEnabled: boolean;
}

export const createNoopAnalyticsClient = (): AnalyticsClient => {
  return {
    capture: () => undefined,
    identify: () => undefined,
    reset: () => undefined,
  };
};

const createInitialAnalyticsRuntimeState = (): AnalyticsRuntimeState => {
  return {
    client: createNoopAnalyticsClient(),
    collectionEnabled: isFeatureEnabled(ANALYTICS_FEATURE_FLAG_KEY),
  };
};

let analyticsRuntimeState = createInitialAnalyticsRuntimeState();

const sanitizeAnalyticsProperties = <TProperties extends AnalyticsProperties>(
  properties: TProperties | undefined,
): TProperties | undefined => {
  if (!properties) {
    return undefined;
  }

  return sanitizeTelemetryContext(properties) as TProperties;
};

const runtimeAnalyticsClient: AnalyticsClient = {
  capture: <TEventName extends AnalyticsEventName>(
    eventName: TEventName,
    properties?: AnalyticsEventPropertiesByName[TEventName],
  ): void => {
    if (!analyticsRuntimeState.collectionEnabled) {
      return;
    }

    analyticsRuntimeState.client.capture(
      eventName,
      sanitizeAnalyticsProperties(properties),
    );
  },
  identify: (distinctId: string, traits?: AnalyticsProperties): void => {
    if (!analyticsRuntimeState.collectionEnabled) {
      return;
    }

    analyticsRuntimeState.client.identify(
      distinctId,
      sanitizeAnalyticsProperties(traits),
    );
  },
  reset: (): void => {
    analyticsRuntimeState.client.reset();
  },
};

export const getAnalyticsClient = (): AnalyticsClient => {
  return runtimeAnalyticsClient;
};

export const setAnalyticsClient = (client: AnalyticsClient | undefined): void => {
  analyticsRuntimeState = {
    ...analyticsRuntimeState,
    client: client ?? createNoopAnalyticsClient(),
  };
};

export const setAnalyticsCollectionEnabled = (enabled: boolean): void => {
  analyticsRuntimeState = {
    ...analyticsRuntimeState,
    collectionEnabled: enabled,
  };
};

export const resetAnalyticsRuntimeForTesting = (): void => {
  analyticsRuntimeState = createInitialAnalyticsRuntimeState();
};
