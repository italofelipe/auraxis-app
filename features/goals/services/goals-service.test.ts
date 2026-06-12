import type { AxiosInstance } from "axios";

import { createGoalsService } from "@/features/goals/services/goals-service";

// Fixture espelhando a resposta REAL do Flask (goal/resources.py +
// goal_schema.py): lista vem em `data.items` (não `data.goals`) e os
// montantes são Decimal serializados COMO STRING (`as_string=True`).
const FLASK_GOALS_LIST_ENVELOPE = {
  status: "success",
  message: "Metas listadas com sucesso",
  data: {
    items: [
      {
        id: "0e1f0a52-6f2a-4f5e-9b1c-0c9d6a8f1b21",
        user_id: "f3b9d3a1-1111-2222-3333-444455556666",
        title: "Reserva de emergencia",
        description: "",
        category: "seguranca",
        target_amount: "15000.00",
        current_amount: "2500.50",
        priority: 3,
        target_date: "2026-12-31",
        status: "active",
      },
    ],
  },
  meta: {
    pagination: { page: 1, per_page: 20, total: 1, pages: 1 },
  },
};

const createClient = (
  getResponse: unknown,
): { client: AxiosInstance; get: jest.Mock } => {
  const get = jest.fn().mockResolvedValue({ data: getResponse });
  return { client: { get } as unknown as AxiosInstance, get };
};

describe("goalsService.listGoals", () => {
  it("desembrulha data.items do envelope real do Flask e mapeia para goals", async () => {
    const { client, get } = createClient(FLASK_GOALS_LIST_ENVELOPE);
    const service = createGoalsService(client);

    const result = await service.listGoals();

    expect(get).toHaveBeenCalledWith("/goals");
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0]).toEqual({
      id: "0e1f0a52-6f2a-4f5e-9b1c-0c9d6a8f1b21",
      title: "Reserva de emergencia",
      currentAmount: 2500.5,
      targetAmount: 15000,
      targetDate: "2026-12-31",
      status: "active",
    });
  });

  it("coage montantes Decimal-string do Flask para number", async () => {
    const { client } = createClient(FLASK_GOALS_LIST_ENVELOPE);
    const service = createGoalsService(client);

    const result = await service.listGoals();

    expect(typeof result.goals[0]?.currentAmount).toBe("number");
    expect(typeof result.goals[0]?.targetAmount).toBe("number");
  });

  it("retorna lista vazia quando o envelope vem sem items", async () => {
    const { client } = createClient({
      status: "success",
      message: "Metas listadas com sucesso",
      data: {},
    });
    const service = createGoalsService(client);

    const result = await service.listGoals();

    expect(result.goals).toEqual([]);
  });
});
