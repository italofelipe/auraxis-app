import * as SecureStore from "expo-secure-store";

export const AI_INSIGHT_CONSENT_STORAGE_KEY = "auraxis.ai-insight-consent.v1";
export const AI_INSIGHT_CONSENT_COPY_VERSION = "ai-insights-transparency-v1";

export interface AiInsightConsentSnapshot {
  readonly hasConsent: boolean;
  readonly grantedAt: string | null;
}

interface PersistedAiInsightConsent {
  readonly version: 1;
  readonly copyVersion: string;
  readonly hasConsent: boolean;
  readonly grantedAt: string | null;
}

const EMPTY_CONSENT: AiInsightConsentSnapshot = {
  hasConsent: false,
  grantedAt: null,
};

const hydrateConsent = (payload: unknown): AiInsightConsentSnapshot => {
  if (payload === null || typeof payload !== "object") {
    return EMPTY_CONSENT;
  }

  const parsed = payload as Partial<PersistedAiInsightConsent>;
  if (
    parsed.version !== 1 ||
    parsed.copyVersion !== AI_INSIGHT_CONSENT_COPY_VERSION ||
    parsed.hasConsent !== true ||
    typeof parsed.grantedAt !== "string" ||
    parsed.grantedAt.trim().length === 0
  ) {
    return EMPTY_CONSENT;
  }

  return {
    hasConsent: true,
    grantedAt: parsed.grantedAt,
  };
};

export const loadAiInsightConsent = async (): Promise<AiInsightConsentSnapshot> => {
  try {
    const payload = await SecureStore.getItemAsync(AI_INSIGHT_CONSENT_STORAGE_KEY);
    if (!payload) {
      return EMPTY_CONSENT;
    }

    return hydrateConsent(JSON.parse(payload));
  } catch {
    return EMPTY_CONSENT;
  }
};

export const persistAiInsightConsent = async (
  grantedAt = new Date().toISOString(),
): Promise<AiInsightConsentSnapshot> => {
  const snapshot: AiInsightConsentSnapshot = {
    hasConsent: true,
    grantedAt,
  };
  const payload: PersistedAiInsightConsent = {
    version: 1,
    copyVersion: AI_INSIGHT_CONSENT_COPY_VERSION,
    hasConsent: true,
    grantedAt,
  };

  await SecureStore.setItemAsync(AI_INSIGHT_CONSENT_STORAGE_KEY, JSON.stringify(payload));

  return snapshot;
};

export const clearAiInsightConsent = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AI_INSIGHT_CONSENT_STORAGE_KEY);
};
