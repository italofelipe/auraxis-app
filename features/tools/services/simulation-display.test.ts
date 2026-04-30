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

describe("getSimulationSummary — investimentos", () => {
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

});

describe("getSimulationSummary — dia a dia", () => {
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

describe("getSimulationSummary — salário e trabalho", () => {
  it("fgts-balance formata saldo + saque", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "fgts-balance",
        result: { projectedBalance: 24500, withdrawableAmount: 35000 },
      }),
    );
    expect(summary).toContain("Saldo");
    expect(summary).toContain("saque");
  });

  it("fgts-balance mostra só saldo quando não pode sacar", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "fgts-balance",
        result: { projectedBalance: 8000 },
      }),
    );
    expect(summary).toContain("Saldo");
  });

  it("fgts-balance sem campos cai para fallback", () => {
    expect(
      getSimulationSummary(
        baseRecord({ toolId: "fgts-balance", result: {} }),
      ),
    ).toBeNull();
  });

});

describe("getSimulationSummary — investimentos extras", () => {
  it("treasury formata líquido + rentabilidade anualizada", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "treasury",
        result: { netAmount: 12340, annualizedNetReturn: 0.108 },
      }),
    );
    expect(summary).toContain("Líquido");
    expect(summary).toContain("10.80%");
  });

  it("treasury sem campos cai para fallback", () => {
    expect(getSimulationSummary(baseRecord({ toolId: "treasury", result: {} }))).toBeNull();
  });

  it("fii formata DY + renda mensal", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "fii",
        result: { dividendYield: 9.5, monthlyIncome: 800 },
      }),
    );
    expect(summary).toContain("DY 9.50%");
    expect(summary).toContain("/mês");
  });

  it("fii formata só DY quando não há cotas", () => {
    const summary = getSimulationSummary(
      baseRecord({ toolId: "fii", result: { dividendYield: 7.2, monthlyIncome: null } }),
    );
    expect(summary).toContain("DY 7.20%");
  });

  it("fii sem DY cai para fallback", () => {
    expect(getSimulationSummary(baseRecord({ toolId: "fii", result: {} }))).toBeNull();
  });

});

describe("getSimulationSummary — dívidas e imóvel", () => {
  it("cet-calculator formata CET anual + total pago", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "cet-calculator",
        result: { cetAnnualPct: 36.5, totalPaid: 14500 },
      }),
    );
    expect(summary).toContain("CET 36.50%");
  });

  it("cet sem campos cai para fallback", () => {
    expect(
      getSimulationSummary(baseRecord({ toolId: "cet-calculator", result: {} })),
    ).toBeNull();
  });

  it("mortgage formata valor financiado + 1ª SAC", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "mortgage",
        result: { loanAmount: 400000, sac: { firstPayment: 4500 } },
      }),
    );
    expect(summary).toContain("financiado");
    expect(summary).toContain("1ª SAC");
  });

  it("mortgage sem sac cai para fallback", () => {
    expect(
      getSimulationSummary(baseRecord({ toolId: "mortgage", result: { loanAmount: 1000 } })),
    ).toBeNull();
  });

  it("debt-payoff exibe total + estratégia vencedora", () => {
    const snowball = getSimulationSummary(
      baseRecord({
        toolId: "debt-payoff",
        result: { totalDebt: 50000, bestStrategy: "snowball" },
      }),
    );
    const avalanche = getSimulationSummary(
      baseRecord({
        toolId: "debt-payoff",
        result: { totalDebt: 50000, bestStrategy: "avalanche" },
      }),
    );
    expect(snowball).toContain("bola de neve");
    expect(avalanche).toContain("avalanche");
  });

  it("debt-payoff sem campos cai para fallback", () => {
    expect(getSimulationSummary(baseRecord({ toolId: "debt-payoff", result: {} }))).toBeNull();
  });

  it("rent-vs-buy mostra vereditto + break-even", () => {
    const buy = getSimulationSummary(
      baseRecord({
        toolId: "rent-vs-buy",
        result: { buyIsBetter: true, breakEvenYear: 12 },
      }),
    );
    const rent = getSimulationSummary(
      baseRecord({
        toolId: "rent-vs-buy",
        result: { buyIsBetter: false, breakEvenYear: null },
      }),
    );
    expect(buy).toContain("comprar vence");
    expect(buy).toContain("12a");
    expect(rent).toContain("alugar vence");
  });

  it("rent-vs-buy sem buyIsBetter cai para fallback", () => {
    expect(getSimulationSummary(baseRecord({ toolId: "rent-vs-buy", result: {} }))).toBeNull();
  });

});

describe("getSimulationSummary — convivência e estilo de vida", () => {
  it("split-bill mostra total + valor por pessoa", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "split-bill",
        result: { totalWithFees: 320, perPersonEqual: 80 },
      }),
    );
    expect(summary).toContain("/pessoa");
  });

  it("split-bill sem campos cai para fallback", () => {
    expect(getSimulationSummary(baseRecord({ toolId: "split-bill", result: {} }))).toBeNull();
  });

  it("cost-of-lifestyle formata custo mensal + custo de oportunidade", () => {
    const summary = getSimulationSummary(
      baseRecord({
        toolId: "cost-of-lifestyle",
        result: { totalMonthlyCost: 850, totalOpportunityCost: 250000 },
      }),
    );
    expect(summary).toContain("/mês");
    expect(summary).toContain("custo");
  });

  it("cost-of-lifestyle sem campos cai para fallback", () => {
    expect(
      getSimulationSummary(baseRecord({ toolId: "cost-of-lifestyle", result: {} })),
    ).toBeNull();
  });
});
