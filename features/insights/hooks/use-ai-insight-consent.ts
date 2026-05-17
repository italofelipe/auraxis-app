import { useCallback, useEffect, useState } from "react";

import {
  loadAiInsightConsent,
  persistAiInsightConsent,
  type AiInsightConsentSnapshot,
} from "@/features/insights/services/ai-insight-consent-storage";

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
    void loadAiInsightConsent().then((nextSnapshot) => {
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
    const nextSnapshot = await persistAiInsightConsent();
    setSnapshot(nextSnapshot);
    setIsHydrated(true);
  }, []);

  return {
    ...snapshot,
    isHydrated,
    grantConsent,
  };
};
