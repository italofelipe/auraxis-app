import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type { Subscription } from "@/types/contracts";

interface SubscriptionApiClient {
  readonly get: AxiosInstance["get"];
}

export const createSubscriptionApi = (client: SubscriptionApiClient) => {
  return {
    getMySubscription: async (): Promise<Subscription> => {
      const response = await client.get<Subscription>("/subscriptions/me");
      return response.data;
    },
  };
};

export const subscriptionApi = createSubscriptionApi(httpClient);
