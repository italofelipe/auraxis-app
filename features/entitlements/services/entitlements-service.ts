import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  EntitlementCheckQuery,
  EntitlementCheckResult,
} from "@/features/entitlements/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface EntitlementCheckPayload {
  readonly feature_key: string;
  readonly active: boolean;
}

const mapEntitlementCheckPayload = (
  payload: EntitlementCheckPayload,
): EntitlementCheckResult => {
  return {
    featureKey: payload.feature_key,
    active: payload.active,
  };
};

export const createEntitlementsService = (client: AxiosInstance) => {
  return {
    checkEntitlement: async (
      query: EntitlementCheckQuery,
    ): Promise<EntitlementCheckResult> => {
      const response = await client.get(apiContractMap.entitlementsCheck.path, {
        params: {
          feature_key: query.featureKey,
        },
      });

      return mapEntitlementCheckPayload(
        unwrapEnvelopeData<EntitlementCheckPayload>(response.data),
      );
    },
  };
};

export const entitlementsService = createEntitlementsService(httpClient);
