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

  it("compound-interest sem finalAmount cai para fallback", () => {
    expect(
      getSimulationSummary(
        baseRecord({ toolId: "compound-interest", result: {} }),
      ),
    ).toBeNull();
  });

  it("cdb-lci-lca sem bestProduct cai para fallback", () => {
    expect(
      getSimulationSummary(
        baseRecord({ toolId: "cdb-lci-lca", result: { lci: { netAmount: 100 } } }),
      ),
    ).toBeNull();
  });

  it("emergency-fund formata meta + meses restantes", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "emergency-fund",
        result: { targetAmount: 18000, monthsToTarget: 24 },
      }),
    );
    expect(summary).toContain("Meta");
    expect(summary).toContain("24 meses");
  });

  it("emergency-fund sinaliza quando a meta já foi alcançada", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "emergency-fund",
        result: { targetAmount: 12000, monthsToTarget: 0 },
      }),
    );
    expect(summary).toContain("alcançada");
  });

  it("emergency-fund sem campos válidos cai para fallback", () => {
    expect(
      getSimulationSummary(
        baseRecord({ toolId: "emergency-fund", result: {} }),
      ),
    ).toBeNull();
  });

  it("fifty-thirty-twenty formata renda + sobra positiva", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "fifty-thirty-twenty",
        result: { netIncome: 10000, surplus: 1500 },
      }),
    );
    expect(summary).toContain("sobra");
  });

  it("fifty-thirty-twenty marca déficit quando surplus negativo", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "fifty-thirty-twenty",
        result: { netIncome: 5000, surplus: -1000 },
      }),
    );
    expect(summary).toContain("déficit");
  });

  it("fifty-thirty-twenty mostra só renda quando surplus ausente (modo simples)", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "fifty-thirty-twenty",
        result: { netIncome: 7500 },
      }),
    );
    expect(summary).toContain("Renda");
  });

  it("fifty-thirty-twenty sem renda cai para fallback", () => {
    expect(
      getSimulationSummary(
        baseRecord({ toolId: "fifty-thirty-twenty", result: {} }),
      ),
    ).toBeNull();
  });

  it("currency-converter formata pares estrangeiros com 4 casas", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "currency-converter",
        result: { convertedAmount: 198.0198, fromCurrency: "BRL", toCurrency: "USD" },
      }),
    );
    expect(summary).toContain("BRL → USD");
    expect(summary).toContain("198");
  });

  it("currency-converter sem campos cai para fallback", () => {
    expect(
      getSimulationSummary(
        baseRecord({ toolId: "currency-converter", result: {} }),
      ),
    ).toBeNull();
  });
});
