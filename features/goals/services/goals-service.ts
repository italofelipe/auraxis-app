import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type { GoalListResponse } from "@/features/goals/contracts";

export const createGoalsService = (client: AxiosInstance) => {
  return {
    listGoals: async (): Promise<GoalListResponse> => {
      const response = await client.get("/goals");
      return unwrapEnvelopeData<GoalListResponse>(response.data);
    },
  };
};

export const goalsService = createGoalsService(httpClient);
