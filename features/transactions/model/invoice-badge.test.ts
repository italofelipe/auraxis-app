import {
  invoiceBadgeMonthLabel,
  resolveInvoiceBadgeMonth,
  type SelectedMonthRef,
} from "@/features/transactions/model/invoice-badge";

/** Julho/2026 — mês 0-indexado (6 = julho), espelha o `SelectedMonth` do controller. */
const JULY_2026: SelectedMonthRef = { year: 2026, month: 6 };

describe("invoiceBadgeMonthLabel", () => {
  it("formata o mês curto pt-BR como 'mmm/aa' (sem ponto)", () => {
    expect(invoiceBadgeMonthLabel(JULY_2026)).toBe("jul/26");
  });

  it("formata janeiro e dezembro corretamente", () => {
    expect(invoiceBadgeMonthLabel({ year: 2026, month: 0 })).toBe("jan/26");
    expect(invoiceBadgeMonthLabel({ year: 2025, month: 11 })).toBe("dez/25");
  });

  it("usa os dois últimos dígitos do ano (vira de década/século)", () => {
    expect(invoiceBadgeMonthLabel({ year: 2030, month: 6 })).toBe("jul/30");
    expect(invoiceBadgeMonthLabel({ year: 2009, month: 6 })).toBe("jul/09");
  });
});

describe("resolveInvoiceBadgeMonth", () => {
  it("retorna o rótulo quando é lançamento de cartão e a compra veio de outro mês", () => {
    // Compra em 19/06 que caiu na fatura de julho (mês selecionado).
    expect(
      resolveInvoiceBadgeMonth({
        creditCardId: "cc-1",
        dueDate: "2026-06-19",
        selectedMonth: JULY_2026,
      }),
    ).toBe("jul/26");
  });

  it("retorna null quando o mês do dueDate coincide com o mês selecionado", () => {
    expect(
      resolveInvoiceBadgeMonth({
        creditCardId: "cc-1",
        dueDate: "2026-07-10",
        selectedMonth: JULY_2026,
      }),
    ).toBeNull();
  });

  it("retorna null quando não é lançamento de cartão (sem creditCardId)", () => {
    expect(
      resolveInvoiceBadgeMonth({
        creditCardId: null,
        dueDate: "2026-06-19",
        selectedMonth: JULY_2026,
      }),
    ).toBeNull();
  });

  it("retorna null quando não há mês selecionado (ex.: modo de range custom)", () => {
    expect(
      resolveInvoiceBadgeMonth({
        creditCardId: "cc-1",
        dueDate: "2026-06-19",
        selectedMonth: null,
      }),
    ).toBeNull();
  });

  it("diferencia por mês E ano (mesmo número de mês em anos distintos é 'outro mês')", () => {
    // dueDate em julho/2025, mês selecionado julho/2026 → veio de outro mês.
    expect(
      resolveInvoiceBadgeMonth({
        creditCardId: "cc-1",
        dueDate: "2025-07-19",
        selectedMonth: JULY_2026,
      }),
    ).toBe("jul/26");
  });

  it("faz parsing date-only/timezone-safe do dueDate (ignora componente de horário)", () => {
    // dueDate com horário em 30/06 não deve ser empurrado para julho por fuso.
    expect(
      resolveInvoiceBadgeMonth({
        creditCardId: "cc-1",
        dueDate: "2026-06-30T23:59:59Z",
        selectedMonth: JULY_2026,
      }),
    ).toBe("jul/26");
  });
});
