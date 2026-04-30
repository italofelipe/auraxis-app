import { describe, expect, it } from "@jest/globals";

import {
  getSimulationSummary,
  getSimulationTitle,
} from "@/features/tools/services/simulation-display";
import type { SimulationRecord } from "@/features/tools/contracts";

const baseRecord = (overrides: Partial<SimulationRecord> = {}): SimulationRecord => ({
  id: "sim-1",
  toolId: "compound-interest",
  ruleVersion: "2026.04",
  inputs: {},
  result: {},
  metadata: null,
  saved: true,
  goalId: null,
  createdAt: "2026-04-29T00:00:00Z",
  ...overrides,
});

describe("getSimulationTitle", () => {
  it("usa metadata.label quando presente", () => {
    expect(
      getSimulationTitle(baseRecord({ metadata: { label: "Cenário A" } })),
    ).toBe("Cenário A");
  });

  it("traduz tool_id canônico para o label localizado", () => {
    expect(getSimulationTitle(baseRecord({ toolId: "compound-interest" }))).toBe(
      "Juros compostos",
    );
    expect(getSimulationTitle(baseRecord({ toolId: "cdb-lci-lca" }))).toBe(
      "CDB · LCI · LCA",
    );
  });

  it("aceita o legacy snake_case do installment-vs-cash", () => {
    expect(getSimulationTitle(baseRecord({ toolId: "installment_vs_cash" }))).toBe(
      "Parcelado vs à vista",
    );
  });

  it("cai para o tool_id quando não há label nem mapeamento", () => {
    expect(getSimulationTitle(baseRecord({ toolId: "unknown-tool" }))).toBe(
      "unknown-tool",
    );
  });
});

describe("getSimulationSummary", () => {
  it("formata o montante final do compound-interest em BRL", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "compound-interest",
        result: { finalAmount: 124378.51 },
      }),
    );
    expect(summary).toContain("Montante final");
    expect(summary).toContain("R");
  });

  it("monta a linha do CDB/LCI/LCA com bestProduct + LCI netAmount", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "cdb-lci-lca",
        result: {
          bestProduct: "lci",
          lci: { netAmount: 11200 },
        },
      }),
    );
    expect(summary).toContain("Melhor: LCI");
    expect(summary).toContain("R");
  });

  it("cai para result.summary quando o tool é desconhecido", () => {
    expect(
      getSimulationSummary(
        baseRecord({
          toolId: "x",
          result: { summary: "lorem ipsum" },
        }),
      ),
    ).toBe("lorem ipsum");
  });

  it("retorna null quando não há nada para mostrar", () => {
    expect(getSimulationSummary(baseRecord({ toolId: "x" }))).toBeNull();
  });
});
