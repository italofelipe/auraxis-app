import type { AxiosInstance } from "axios";

import {
  buildSnapshotSignature,
  createWeeklySnapshotService,
  isSnapshotUnseen,
} from "@/features/weekly-snapshot/services/weekly-snapshot-service";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get">> => ({
  get: jest.fn(),
});

const buildNarrative = (overrides: Record<string, unknown> = {}) => ({
  narrative: "Sua semana fechou positiva: voce gastou menos em delivery.",
  model: "gpt-4o",
  summary: {
    current_week: {
      start: "2026-06-08",
      end: "2026-06-14",
      income: 5000,
      expense: 1800,
      balance: 3200,
      transaction_count: 23,
    },
    previous_week: {
      start: "2026-06-01",
      end: "2026-06-07",
      income: 5000,
      expense: 2100,
      balance: 2900,
      transaction_count: 27,
    },
    comparison: {
      income_delta: 0,
      income_delta_percent: 0,
      expense_delta: -300,
      expense_delta_percent: -14.3,
      balance_delta: 300,
      balance_delta_percent: 10.3,
    },
  },
  ...overrides,
});

describe("weeklySnapshotService.getWeeklySnapshot", () => {
  it("le o endpoint premium e mapeia narrativa + totais + deltas", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { data: buildNarrative() } });

    const service = createWeeklySnapshotService(client as unknown as AxiosInstance);
    const result = await service.getWeeklySnapshot();

    expect(client.get).toHaveBeenCalledWith("/ai/insights/weekly-summary");
    expect(result).toEqual({
      narrative: "Sua semana fechou positiva: voce gastou menos em delivery.",
      weekStart: "2026-06-08",
      weekEnd: "2026-06-14",
      currentIncome: 5000,
      currentExpense: 1800,
      currentBalance: 3200,
      transactionCount: 23,
      expenseDeltaPercent: -14.3,
      balanceDeltaPercent: 10.3,
    });
  });

  it("tolera envelope flat (sem data wrapper)", async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: buildNarrative() });

    const service = createWeeklySnapshotService(client as unknown as AxiosInstance);
    const result = await service.getWeeklySnapshot();

    expect(result.weekStart).toBe("2026-06-08");
  });
});

describe("weekly snapshot change detection", () => {
  const snapshot = {
    narrative: "x",
    weekStart: "2026-06-08",
    weekEnd: "2026-06-14",
    currentIncome: 5000,
    currentExpense: 1800,
    currentBalance: 3200,
    transactionCount: 23,
    expenseDeltaPercent: -14.3,
    balanceDeltaPercent: 10.3,
  };

  it("buildSnapshotSignature combina semana + despesa atual", () => {
    expect(buildSnapshotSignature(snapshot)).toBe("2026-06-08_2026-06-14_1800");
  });

  it("isSnapshotUnseen e true quando assinatura difere da ultima vista", () => {
    expect(isSnapshotUnseen(snapshot, null)).toBe(true);
    expect(isSnapshotUnseen(snapshot, "2026-06-01_2026-06-07_2100")).toBe(true);
  });

  it("isSnapshotUnseen e false quando ja foi vista", () => {
    expect(isSnapshotUnseen(snapshot, "2026-06-08_2026-06-14_1800")).toBe(false);
  });
});
