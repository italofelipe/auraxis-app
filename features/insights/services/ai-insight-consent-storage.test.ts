import * as SecureStore from "expo-secure-store";

import {
  AI_INSIGHT_CONSENT_COPY_VERSION,
  AI_INSIGHT_CONSENT_STORAGE_KEY,
  clearAiInsightConsent,
  loadAiInsightConsent,
  persistAiInsightConsent,
} from "@/features/insights/services/ai-insight-consent-storage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);
const mockDeleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);

describe("ai-insight-consent-storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue(null);
  });

  it("retorna consentimento ausente quando nao ha payload salvo", async () => {
    await expect(loadAiInsightConsent()).resolves.toEqual({
      hasConsent: false,
      grantedAt: null,
    });
  });

  it("hidrata consentimento valido do storage", async () => {
    mockGetItemAsync.mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        copyVersion: AI_INSIGHT_CONSENT_COPY_VERSION,
        hasConsent: true,
        grantedAt: "2026-05-17T01:00:00.000Z",
      }),
    );

    await expect(loadAiInsightConsent()).resolves.toEqual({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });
  });

  it("persiste aceite com versao da copy exibida", async () => {
    await expect(persistAiInsightConsent("2026-05-17T01:00:00.000Z")).resolves.toEqual({
      hasConsent: true,
      grantedAt: "2026-05-17T01:00:00.000Z",
    });

    expect(mockSetItemAsync).toHaveBeenCalledWith(
      AI_INSIGHT_CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copyVersion: AI_INSIGHT_CONSENT_COPY_VERSION,
        hasConsent: true,
        grantedAt: "2026-05-17T01:00:00.000Z",
      }),
    );
  });

  it("limpa o consentimento local", async () => {
    await clearAiInsightConsent();

    expect(mockDeleteItemAsync).toHaveBeenCalledWith(AI_INSIGHT_CONSENT_STORAGE_KEY);
  });
});
