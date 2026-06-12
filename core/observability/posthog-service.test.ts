import {
  setAnalyticsClient,
  setAnalyticsCollectionEnabled,
} from "@/core/observability/analytics-runtime";
import {
  initPostHog,
  resetPostHogRuntimeForTests,
} from "@/core/observability/posthog-service";

jest.mock("posthog-react-native", () => {
  return jest.fn().mockImplementation(() => {
    throw new Error(
      "PostHog: No storage available. Please install expo-file-system or react-native-async-storage OR implement a custom storage provider.",
    );
  });
});

jest.mock("@/core/observability/analytics-runtime", () => ({
  ANALYTICS_FEATURE_FLAG_KEY: "analytics",
  setAnalyticsClient: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true),
}));

describe("initPostHog", () => {
  const originalApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPostHogRuntimeForTests();
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = "phc_test_key";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalApiKey;
  });

  it("nao propaga excecao quando o SDK falha ao construir (storage indisponivel)", async () => {
    await expect(initPostHog()).resolves.toBeUndefined();
  });

  it("desabilita analytics de forma limpa quando o SDK falha", async () => {
    await initPostHog();

    expect(setAnalyticsClient).toHaveBeenCalledWith(undefined);
    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(false);
  });
});
