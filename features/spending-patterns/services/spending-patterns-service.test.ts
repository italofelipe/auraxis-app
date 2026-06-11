import type { AxiosInstance } from "axios";

import {
  buildTransactionInputs,
  createSpendingPatternsService,
  severityRank,
} from "@/features/spending-patterns/services/spending-patterns-service";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get" | "post">> => ({
  get: jest.fn(),
  post: jest.fn(),
});

const buildPattern = (overrides: Record<string, unknown> = {}) => ({
  description: "Gastos recorrentes com delivery",
  frequency: "12x no mes",
  average_value: 45.9,
  suggested_action: "Defina um teto mensal para delivery",
  severity: "high",
  ...overrides,
});

describe("severityRank", () => {
  it("ordena high > medium > low", () => {
    expect(severityRank("high")).toBeGreaterThan(severityRank("medium"));
    expect(severityRank("medium")).toBeGreaterThan(severityRank("low"));
  });
});

describe("buildTransactionInputs (LGPD-safe)", () => {
  it("mantem apenas despesas com valor positivo e usa o titulo como label", () => {
    const inputs = buildTransactionInputs([
      { amount: "45.90", type: "expense", dueDate: "2026-06-01", title: "iFood" },
      { amount: "5000.00", type: "income", dueDate: "2026-06-05", title: "Salario" },
      { amount: "0", type: "expense", dueDate: "2026-06-02", title: "Estorno" },
      { amount: "nao-numero", type: "expense", dueDate: "2026-06-03", title: "X" },
    ]);

    expect(inputs).toEqual([
      { amount: 45.9, occurredOn: "2026-06-01", category: "iFood", kind: "expense" },
    ]);
  });

  it("omite category quando o titulo e vazio (sem PII)", () => {
    const inputs = buildTransactionInputs([
      { amount: "10.00", type: "expense", dueDate: "2026-06-01", title: "" },
    ]);
    expect(inputs[0]).toEqual({
      amount: 10,
      occurredOn: "2026-06-01",
      kind: "expense",
    });
  });
});

describe("spendingPatternsService.getLatest", () => {
  it("le o radar cron e ordena por severidade desc", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          patterns: [
            buildPattern({ severity: "low", description: "low" }),
            buildPattern({ severity: "high", description: "high" }),
            buildPattern({ severity: "medium", description: "medium" }),
          ],
          generated_at: "2026-06-10T03:00:00Z",
          period_label: "Ultimos 90 dias",
          model: "gpt-4o",
          cost_usd: 0.01,
          tokens_used: 1200,
        },
      },
    });

    const service = createSpendingPatternsService(client as unknown as AxiosInstance);
    const result = await service.getLatest();

    expect(client.get).toHaveBeenCalledWith("/ai/insights/spending-patterns/latest");
    expect(result.patterns.map((p) => p.description)).toEqual(["high", "medium", "low"]);
    expect(result.patterns[0]).toEqual({
      description: "high",
      frequency: "12x no mes",
      averageValue: 45.9,
      suggestedAction: "Defina um teto mensal para delivery",
      severity: "high",
    });
    expect(result.generatedAt).toBe("2026-06-10T03:00:00Z");
    expect(result.periodLabel).toBe("Ultimos 90 dias");
  });

  it("tolera radar vazio (cron ainda nao rodou)", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: { data: { patterns: [], generated_at: null, period_label: null } },
    });

    const service = createSpendingPatternsService(client as unknown as AxiosInstance);
    const result = await service.getLatest();

    expect(result.patterns).toEqual([]);
    expect(result.generatedAt).toBeNull();
  });
});

describe("spendingPatternsService.detect", () => {
  it("envia transactions LGPD-safe e period_days e mapeia a resposta", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          patterns: [buildPattern({ severity: "medium" })],
          model: "gpt-4o",
          generated_count: 1,
        },
      },
    });

    const service = createSpendingPatternsService(client as unknown as AxiosInstance);
    const result = await service.detect({
      transactions: [
        { amount: 45.9, occurredOn: "2026-06-01", category: "iFood", kind: "expense" },
      ],
      periodDays: 60,
    });

    expect(client.post).toHaveBeenCalledWith("/ai/insights/spending-patterns", {
      transactions: [
        { amount: 45.9, occurred_on: "2026-06-01", category: "iFood", kind: "expense" },
      ],
      period_days: 60,
    });
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("medium");
  });

  it("usa period_days padrao 90 quando nao informado", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: { data: { patterns: [], model: "gpt-4o", generated_count: 0 } },
    });

    const service = createSpendingPatternsService(client as unknown as AxiosInstance);
    await service.detect({ transactions: [] });

    expect(client.post).toHaveBeenCalledWith("/ai/insights/spending-patterns", {
      transactions: [],
      period_days: 90,
    });
  });
});
