import {
  formatCurrency,
  formatCurrencyShort,
  formatCurrencySigned,
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

describe("formatCurrencySigned", () => {
  // Intl.NumberFormat (pt-BR/BRL) usa espaço não separável (U+00A0) entre
  // "R$" e o número; normalizamos para espaço comum nas comparações exatas.
  const normalizeSpaces = (value: string): string => value.replace(/ /g, " ");

  it("prefixa valores positivos com sinal de mais e o valor absoluto", () => {
    const result = formatCurrencySigned(27675.37);
    expect(result.startsWith("+ ")).toBe(true);
    expect(result).toContain("R$");
    expect(result).toContain("27.675,37");
    expect(result).not.toContain("-");
    expect(result).not.toContain("−");
  });

  it("prefixa valores negativos com sinal de menos tipográfico (U+2212)", () => {
    const result = formatCurrencySigned(-2000);
    expect(result.startsWith("− ")).toBe(true);
    expect(result).toContain("R$");
    expect(result).toContain("2.000,00");
    // Usa o valor absoluto: o "-" do Intl não vaza para dentro da string.
    expect(result).not.toContain("-");
  });

  it("formata zero sem sinal", () => {
    const result = formatCurrencySigned(0);
    expect(normalizeSpaces(result)).toBe("R$ 0,00");
    expect(result).not.toContain("+");
    expect(result).not.toContain("−");
  });

  it("trata -0 como zero (sem sinal)", () => {
    expect(normalizeSpaces(formatCurrencySigned(-0))).toBe("R$ 0,00");
  });
});
