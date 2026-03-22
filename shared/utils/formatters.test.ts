import {
  formatCurrency,
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
