import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
  formatShortDate,
} from "@/shared/utils/formatters";

describe("formatters", () => {
  it("formata moeda em BRL", () => {
    expect(formatCurrency(1299.5)).toContain("1.299");
    expect(formatCurrency(1299.5)).toContain("R$");
  });

  it("formata percentual com sufixo", () => {
    expect(formatPercent(12.345)).toContain("%");
  });

  it("formata datas curtas em pt-BR", () => {
    expect(formatShortDate("2026-03-20")).toContain("2026");
  });
});

describe("formatCurrencyShort", () => {
  it("abrevia milhares com uma casa decimal e sufixo k", () => {
    const result = formatCurrencyShort(65300);
    expect(result).toContain("R$");
    expect(result).toContain("65,3");
    expect(result).toContain("k");
  });

  it("arredonda milhares mantendo o sufixo k", () => {
    expect(formatCurrencyShort(1000)).toContain("1,0");
    expect(formatCurrencyShort(1000)).toContain("k");
  });

  it("não abrevia valores abaixo de mil", () => {
    expect(formatCurrencyShort(999)).toContain("999");
    expect(formatCurrencyShort(999)).not.toContain("k");
  });

  it("formata zero sem sufixo", () => {
    expect(formatCurrencyShort(0)).toContain("R$");
    expect(formatCurrencyShort(0)).not.toContain("k");
  });

  it("trata negativos preservando o sinal", () => {
    expect(formatCurrencyShort(-2500)).toContain("-");
    expect(formatCurrencyShort(-2500)).toContain("2,5");
  });
});
