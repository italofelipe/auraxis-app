import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type { EntitlementCheckResponse, FeatureKey } from "@/types/contracts/entitlement";

interface EntitlementsApiClient {
  readonly get: AxiosInstance["get"];
}

const normalizeEntitlementCheck = (
  payload: EntitlementCheckResponse,
): boolean => {
  if ("active" in payload) {
    return payload.active === true;
  }

  return payload.has_access === true;
};

export const createEntitlementsApi = (client: EntitlementsApiClient) => {
  return {
    checkEntitlement: async (featureKey: FeatureKey): Promise<boolean> => {
      const response = await client.get<EntitlementCheckResponse>(
        "/entitlements/check",
        { params: { feature_key: featureKey } },
      );
      return normalizeEntitlementCheck(response.data);
    },
  };
};

export const entitlementsApi = createEntitlementsApi(httpClient);
