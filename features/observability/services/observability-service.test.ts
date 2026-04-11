import type { AxiosInstance } from "axios";

import { createObservabilityService } from "@/features/observability/services/observability-service";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { observabilityLogger } from "@/core/telemetry/domain-loggers";

jest.mock("@/core/telemetry/domain-loggers", () => ({
  observabilityLogger: {
    log: jest.fn(),
  },
}));

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get">> => {
  return {
    get: jest.fn(),
  };
};

const mockedObservabilityLogger = jest.mocked(observabilityLogger);

describe("observabilityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("busca snapshot e registra telemetria", async () => {
    const client = createClient();
    const snapshot = {
      generatedAt: "2026-04-10T10:00:00.000Z",
      metrics: {},
      budgets: {},
      health: {},
    };
    client.get.mockResolvedValue({ data: snapshot });

    const service = createObservabilityService(client as unknown as AxiosInstance);
    await expect(service.getSnapshot()).resolves.toEqual(snapshot);

    expect(client.get).toHaveBeenCalledWith(apiContractMap.opsObservability.path);
    expect(mockedObservabilityLogger.log).toHaveBeenCalledWith(
      "observability.snapshot_requested",
      {
        context: {
          path: apiContractMap.opsObservability.path,
        },
      },
    );
  });

  it("busca métricas e registra telemetria", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: "metrics_payload" });

    const service = createObservabilityService(client as unknown as AxiosInstance);
    await expect(service.getMetrics()).resolves.toEqual({
      payload: "metrics_payload",
    });

    expect(client.get).toHaveBeenCalledWith(apiContractMap.opsMetrics.path, {
      responseType: "text",
    });
    expect(mockedObservabilityLogger.log).toHaveBeenCalledWith(
      "observability.metrics_requested",
      {
        context: {
          path: apiContractMap.opsMetrics.path,
        },
      },
    );
  });
});
