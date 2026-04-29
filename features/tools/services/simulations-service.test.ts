import type { AxiosInstance } from "axios";

import { createSimulationsService } from "@/features/tools/services/simulations-service";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get" | "delete">> => ({
  get: jest.fn(),
  delete: jest.fn(),
});

describe("simulationsService listSimulations", () => {
  it("retorna lista mapeada para domain shape", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: "sim-1",
              tool_id: "installment-vs-cash",
              rule_version: "v1",
              inputs: { price: 1000 },
              result: { selected: "cash" },
              saved: true,
              goal_id: null,
              created_at: "2026-04-28T12:00:00Z",
            },
            {
              id: "sim-2",
              tool_id: "salary-simulator",
              rule_version: "v2",
              inputs: { base: 5000 },
              result: { net: 4200 },
              saved: false,
              goal_id: "goal-1",
              created_at: "2026-04-27T09:00:00Z",
            },
          ],
        },
        meta: {
          pagination: { page: 1, per_page: 20, total: 42, has_more: true },
        },
      },
    });

    const service = createSimulationsService(client as unknown as AxiosInstance);
    const result = await service.listSimulations({ page: 1, perPage: 20 });

    expect(client.get).toHaveBeenCalledWith("/simulations", {
      params: { page: 1, per_page: 20 },
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.id).toBe("sim-1");
    expect(result.items[0]?.toolId).toBe("installment-vs-cash");
    expect(result.items[0]?.saved).toBe(true);
    expect(result.items[1]?.goalId).toBe("goal-1");
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 20,
      total: 42,
      hasMore: true,
    });
  });

  it("usa fallbacks quando envelope vem sem meta nem items", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { data: {} } });

    const service = createSimulationsService(client as unknown as AxiosInstance);
    const result = await service.listSimulations();

    expect(result.items).toEqual([]);
    expect(result.pagination).toEqual({
      page: 1,
      perPage: 0,
      total: 0,
      hasMore: false,
    });
  });

  it("normaliza inputs/result/saved/goalId quando vêm undefined no payload", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: "sim-3",
              tool_id: "x",
              rule_version: "v1",
              created_at: "2026-04-28T00:00:00Z",
            },
          ],
        },
      },
    });

    const service = createSimulationsService(client as unknown as AxiosInstance);
    const result = await service.listSimulations();

    expect(result.items[0]?.inputs).toEqual({});
    expect(result.items[0]?.result).toEqual({});
    expect(result.items[0]?.saved).toBe(false);
    expect(result.items[0]?.goalId).toBeNull();
  });
});

describe("simulationsService deleteSimulation", () => {
  it("envia DELETE no path com simulation_id substituído", async () => {
    const client = createClient();
    client.delete.mockResolvedValue({ data: {} });

    const service = createSimulationsService(client as unknown as AxiosInstance);
    await service.deleteSimulation({ simulationId: "sim-99" });

    expect(client.delete).toHaveBeenCalledWith("/simulations/sim-99");
  });
});
