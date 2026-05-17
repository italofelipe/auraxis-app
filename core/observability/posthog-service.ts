import PostHog from "posthog-react-native";
import Constants from "expo-constants";

import {
  ANALYTICS_FEATURE_FLAG_KEY,
  setAnalyticsClient,
  setAnalyticsCollectionEnabled,
} from "@/core/observability/analytics-runtime";
import { loadAnalyticsOptOutPreference } from "@/core/observability/analytics-preferences";
import type {
  AnalyticsClient,
  AnalyticsEventName,
  AnalyticsEventPropertiesByName,
  AnalyticsProperties,
} from "@/core/observability/analytics-types";
import { isFeatureEnabled } from "@/shared/feature-flags";

interface PostHogSdkClient {
  readonly capture: (
    eventName: string,
    properties?: Record<string, unknown>,
  ) => void | Promise<void>;
  readonly identify: (
    distinctId: string,
    properties?: Record<string, unknown>,
  ) => void | Promise<void>;
  readonly screen: (
    name: string,
    properties?: Record<string, unknown>,
  ) => void | Promise<void>;
  readonly reset: () => void | Promise<void>;
  readonly optIn: () => void | Promise<void>;
  readonly optOut: () => void | Promise<void>;
}

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

let postHogInitialized = false;

const expoExtra = (): Record<string, unknown> =>
  (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const readString = (
  envValue: string | undefined,
  extraKey: string,
): string | undefined => {
  if (typeof envValue === "string" && envValue.trim().length > 0) {
    return envValue.trim();
  }

  const fromExtra = expoExtra()[extraKey];
  return typeof fromExtra === "string" && fromExtra.trim().length > 0
    ? fromExtra.trim()
    : undefined;
};

const resolvePostHogApiKey = (): string | undefined =>
  readString(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, "posthogApiKey");

const resolvePostHogHost = (): string =>
  readString(process.env.EXPO_PUBLIC_POSTHOG_HOST, "posthogHost") ??
  DEFAULT_POSTHOG_HOST;

export const createPostHogAnalyticsClient = (
  posthog: PostHogSdkClient,
): AnalyticsClient => ({
  capture: <TEventName extends AnalyticsEventName>(
    eventName: TEventName,
    properties?: AnalyticsEventPropertiesByName[TEventName],
  ): void => {
    void posthog.capture(eventName, properties as Record<string, unknown>);
  },
  identify: (distinctId: string, traits?: AnalyticsProperties): void => {
    void posthog.identify(distinctId, traits as Record<string, unknown> | undefined);
  },
  screen: (name: string, properties?: AnalyticsProperties): void => {
    void posthog.screen(name, properties as Record<string, unknown> | undefined);
  },
  reset: (): void => {
    void posthog.reset();
  },
  setCollectionEnabled: (enabled: boolean): void => {
    void (enabled ? posthog.optIn() : posthog.optOut());
  },
});

export const initPostHog = async (): Promise<void> => {
  if (postHogInitialized) {
    return;
  }

  const apiKey = resolvePostHogApiKey();
  if (!apiKey || !isFeatureEnabled(ANALYTICS_FEATURE_FLAG_KEY)) {
    setAnalyticsClient(undefined);
    setAnalyticsCollectionEnabled(false);
    return;
  }

  const preference = await loadAnalyticsOptOutPreference();
  const collectionEnabled = !preference.optedOut;
  const posthog = new PostHog(apiKey, {
    host: resolvePostHogHost(),
    captureAppLifecycleEvents: true,
    defaultOptIn: collectionEnabled,
    disableGeoip: true,
    enableSessionReplay: false,
  });

  setAnalyticsClient(
    createPostHogAnalyticsClient(posthog as unknown as PostHogSdkClient),
  );
  setAnalyticsCollectionEnabled(collectionEnabled);
  postHogInitialized = true;
};

export const resetPostHogRuntimeForTests = (): void => {
  postHogInitialized = false;
};
