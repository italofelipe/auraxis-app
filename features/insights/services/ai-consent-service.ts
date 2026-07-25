import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  AiConsentListResponse,
  AiConsentRecord,
  GrantAiConsentCommand,
} from "@/features/insights/ai-consent-contracts";
import type { AiInsightConsentSnapshot } from "@/features/insights/services/ai-insight-consent-storage";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

const AI_CONSENT_VERSION = "1.0" as const;

const findCurrentAiConsent = (records: readonly AiConsentRecord[]): AiConsentRecord | null => {
  return records.find((record) => record.kind === "ai") ?? null;
};

const toConsentSnapshot = (record: AiConsentRecord | null): AiInsightConsentSnapshot => {
  if (record?.action !== "granted") {
    return {
      hasConsent: false,
      grantedAt: null,
    };
  }

  return {
    hasConsent: true,
    grantedAt: record.created_at,
  };
};

export const createAiConsentService = (client: AxiosInstance) => {
  return {
    load: async (): Promise<AiInsightConsentSnapshot> => {
      const response = await client.get(apiContractMap.aiConsentList.path);
      const payload = unwrapEnvelopeData<AiConsentListResponse>(response.data);
      return toConsentSnapshot(findCurrentAiConsent(payload.items));
    },
    grant: async (): Promise<AiInsightConsentSnapshot> => {
      const command: GrantAiConsentCommand = {
        kind: "ai",
        version: AI_CONSENT_VERSION,
        action: "granted",
        source: "app",
      };
      const response = await client.post(apiContractMap.aiConsentGrant.path, command);
      const record = unwrapEnvelopeData<AiConsentRecord>(response.data);
      return toConsentSnapshot(record);
    },
  };
};

export const aiConsentService = createAiConsentService(httpClient);
