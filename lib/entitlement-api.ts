import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type { EntitlementCheck, FeatureKey } from "@/types/contracts";

interface EntitlementApiClient {
  readonly get: AxiosInstance["get"];
}

export const createEntitlementApi = (client: EntitlementApiClient) => {
  return {
    checkEntitlement: async (featureKey: FeatureKey): Promise<EntitlementCheck> => {
      const response = await client.get<EntitlementCheck>("/entitlements/check", {
        params: { feature_key: featureKey },
      });
      return response.data;
    },
  };
};

export const entitlementApi = createEntitlementApi(httpClient);
