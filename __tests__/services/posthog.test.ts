import PostHog from "posthog-react-native";

import {
  resetAnalyticsRuntimeForTesting,
  setAnalyticsCollectionEnabled,
} from "@/core/observability/analytics-runtime";
import { loadAnalyticsOptOutPreference } from "@/core/observability/analytics-preferences";
import { isFeatureEnabled } from "@/shared/feature-flags";

import {
  createPostHogAnalyticsClient,
  initPostHog,
  resetPostHogRuntimeForTests,
} from "@/core/observability/posthog-service";

jest.mock("posthog-react-native", () => jest.fn());
jest.mock("@/core/observability/analytics-preferences", () => ({
  loadAnalyticsOptOutPreference: jest.fn(),
}));
jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const MockedPostHog = jest.mocked(PostHog);
const mockedLoadPreference = jest.mocked(loadAnalyticsOptOutPreference);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

const buildPostHogClient = () => ({
  capture: jest.fn().mockResolvedValue(undefined),
  identify: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  screen: jest.fn().mockResolvedValue(undefined),
  optIn: jest.fn().mockResolvedValue(undefined),
  optOut: jest.fn().mockResolvedValue(undefined),
});

describe("posthog service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAnalyticsRuntimeForTesting();
    resetPostHogRuntimeForTests();
    mockedIsFeatureEnabled.mockReturnValue(true);
    mockedLoadPreference.mockResolvedValue({ optedOut: false });
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = "ph_test";
    process.env.EXPO_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  });

  it("initializes PostHog with LGPD-safe defaults when configured", async () => {
    const client = buildPostHogClient();
    MockedPostHog.mockImplementation(() => client as never);

    await initPostHog();

    expect(MockedPostHog).toHaveBeenCalledWith("ph_test", {
      host: "https://eu.i.posthog.com",
      captureAppLifecycleEvents: true,
      defaultOptIn: true,
      disableGeoip: true,
      enableSessionReplay: false,
    });
    expect(client.optIn).toHaveBeenCalledTimes(1);
  });

  it("honors a stored opt-out during initialization", async () => {
    const client = buildPostHogClient();
    MockedPostHog.mockImplementation(() => client as never);
    mockedLoadPreference.mockResolvedValueOnce({ optedOut: true });

    await initPostHog();

    expect(MockedPostHog).toHaveBeenCalledWith(
      "ph_test",
      expect.objectContaining({ defaultOptIn: false }),
    );
    expect(client.optOut).toHaveBeenCalledTimes(1);
  });

  it("does not initialize PostHog when the API key is missing", async () => {
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

    await initPostHog();

    expect(MockedPostHog).not.toHaveBeenCalled();
  });

  it("maps analytics calls to the PostHog SDK without awaiting UI paths", () => {
    const client = buildPostHogClient();
    const analyticsClient = createPostHogAnalyticsClient(client);

    analyticsClient.capture("tool.used", { slug: "fire" });
    analyticsClient.identify("usr-1", { plan: "premium" });
    analyticsClient.screen("/dashboard", { routeKey: "dashboard" });
    analyticsClient.reset();
    setAnalyticsCollectionEnabled(false);
    analyticsClient.setCollectionEnabled?.(false);

    expect(client.capture).toHaveBeenCalledWith("tool.used", { slug: "fire" });
    expect(client.identify).toHaveBeenCalledWith("usr-1", { plan: "premium" });
    expect(client.screen).toHaveBeenCalledWith("/dashboard", {
      routeKey: "dashboard",
    });
    expect(client.reset).toHaveBeenCalledTimes(1);
    expect(client.optOut).toHaveBeenCalledTimes(1);
  });
});
