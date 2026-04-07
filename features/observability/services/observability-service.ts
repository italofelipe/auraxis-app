import type { AxiosInstance } from "axios";

import { httpClient } from "@/core/http/http-client";
import type {
  ObservabilitySnapshot,
  PrometheusMetricsExport,
} from "@/features/observability/contracts";

export const createObservabilityService = (client: AxiosInstance) => {
  return {
    getSnapshot: async (): Promise<ObservabilitySnapshot> => {
      const response = await client.get<ObservabilitySnapshot>(
        "/ops/observability",
      );
      return response.data;
    },
    getMetrics: async (): Promise<PrometheusMetricsExport> => {
      const response = await client.get<string>("/ops/metrics", {
        responseType: "text",
      });
      return {
        payload: response.data,
      };
    },
  };
};

export const observabilityService = createObservabilityService(httpClient);
