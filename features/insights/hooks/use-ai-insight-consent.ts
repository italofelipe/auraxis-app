import { useCallback, useEffect, useState } from "react";

import {
  clearAiInsightConsent,
  loadAiInsightConsent,
  persistAiInsightConsent,
  type AiInsightConsentSnapshot,
} from "@/features/insights/services/ai-insight-consent-storage";
import { aiConsentService } from "@/features/insights/services/ai-consent-service";

export interface UseAiInsightConsentOptions {
  readonly enabled?: boolean;
}

export interface AiInsightConsentState extends AiInsightConsentSnapshot {
  readonly isHydrated: boolean;
  readonly grantConsent: () => Promise<void>;
}

const EMPTY_CONSENT: AiInsightConsentSnapshot = {
  hasConsent: false,
  grantedAt: null,
};

const persistRemoteSnapshot = async (snapshot: AiInsightConsentSnapshot): Promise<void> => {
  try {
    if (snapshot.hasConsent && snapshot.grantedAt) {
      await persistAiInsightConsent(snapshot.grantedAt);
      return;
    }
    await clearAiInsightConsent();
  } catch {
    // SecureStore is a resilience cache. The API remains the consent authority.
  }
};

const loadConsentSnapshot = async (): Promise<AiInsightConsentSnapshot> => {
  try {
    const remoteSnapshot = await aiConsentService.load();
    await persistRemoteSnapshot(remoteSnapshot);
    return remoteSnapshot;
  } catch {
    return loadAiInsightConsent();
  }
};

export const useAiInsightConsent = (
  options: UseAiInsightConsentOptions = {},
): AiInsightConsentState => {
  const enabled = options.enabled ?? true;
  const [snapshot, setSnapshot] = useState<AiInsightConsentSnapshot>(EMPTY_CONSENT);
  const [isHydrated, setIsHydrated] = useState(!enabled);

  useEffect(() => {
    let isActive = true;

    if (!enabled) {
      setSnapshot(EMPTY_CONSENT);
      setIsHydrated(true);
      return () => {
        isActive = false;
      };
    }

    setIsHydrated(false);
    void loadConsentSnapshot().then((nextSnapshot) => {
      if (!isActive) {
        return;
      }

      setSnapshot(nextSnapshot);
      setIsHydrated(true);
    });

    return () => {
      isActive = false;
    };
  }, [enabled]);

  const grantConsent = useCallback(async (): Promise<void> => {
    const nextSnapshot = await aiConsentService.grant();
    await persistRemoteSnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
    setIsHydrated(true);
  }, []);

  return {
    ...snapshot,
    isHydrated,
    grantConsent,
  };
};
