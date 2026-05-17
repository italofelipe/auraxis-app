import * as SecureStore from "expo-secure-store";

import {
  ANALYTICS_OPT_OUT_STORAGE_KEY,
  loadAnalyticsOptOutPreference,
  persistAnalyticsOptOutPreference,
} from "@/core/observability/analytics-preferences";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);

describe("analytics-preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue(null);
  });

  it("defaults to collection enabled when no opt-out is stored", async () => {
    await expect(loadAnalyticsOptOutPreference()).resolves.toEqual({
      optedOut: false,
    });
  });

  it("hydrates a stored opt-out preference", async () => {
    mockGetItemAsync.mockResolvedValueOnce(
      JSON.stringify({ version: 1, optedOut: true }),
    );

    await expect(loadAnalyticsOptOutPreference()).resolves.toEqual({
      optedOut: true,
    });
  });

  it("persists the user's opt-out choice", async () => {
    await expect(persistAnalyticsOptOutPreference(true)).resolves.toEqual({
      optedOut: true,
    });

    expect(mockSetItemAsync).toHaveBeenCalledWith(
      ANALYTICS_OPT_OUT_STORAGE_KEY,
      JSON.stringify({ version: 1, optedOut: true }),
    );
  });
});
