import type { AxiosInstance } from "axios";

import { httpClient } from "@/core/http/http-client";
import { observabilityLogger } from "@/core/telemetry/domain-loggers";
import type {
  ObservabilitySnapshot,
  PrometheusMetricsExport,
} from "@/features/observability/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

export const createObservabilityService = (client: AxiosInstance) => {
  return {
    getSnapshot: async (): Promise<ObservabilitySnapshot> => {
      observabilityLogger.log("observability.snapshot_requested", {
        context: {
          path: apiContractMap.opsObservability.path,
        },
      });
      const response = await client.get<ObservabilitySnapshot>(
        apiContractMap.opsObservability.path,
      );
      return response.data;
    },
    getMetrics: async (): Promise<PrometheusMetricsExport> => {
      observabilityLogger.log("observability.metrics_requested", {
        context: {
          path: apiContractMap.opsMetrics.path,
        },
      });
      const response = await client.get<string>(apiContractMap.opsMetrics.path, {
        responseType: "text",
      });
      return {
        payload: response.data,
      };
    },
  };
};

export const observabilityService = createObservabilityService(httpClient);
