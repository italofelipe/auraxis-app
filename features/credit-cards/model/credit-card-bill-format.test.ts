import type { CreditCardBillRecord } from "@/features/credit-cards/contracts";

import {
  formatCreditCardBillCycleLabel,
  formatCreditCardBillDate,
  formatCreditCardBillMonthLabel,
  getCurrentCreditCardBillMonth,
  groupCreditCardBillTransactionsByDate,
  shiftCreditCardBillMonth,
} from "./credit-card-bill-format";

describe("credit-card-bill-format", () => {
  it("shiftCreditCardBillMonth troca o ano nos limites", () => {
    expect(shiftCreditCardBillMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftCreditCardBillMonth("2026-12", 1)).toBe("2027-01");
  });

  it("getCurrentCreditCardBillMonth retorna o mês corrente", () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    jest.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(getCurrentCreditCardBillMonth()).toBe("2026-06");
    jest.useRealTimers();
  });

  it("formatCreditCardBillMonthLabel produz o rótulo extenso", () => {
    expect(formatCreditCardBillMonthLabel("2026-06")).toMatch(/junho de 2026/u);
  });

  it("formatCreditCardBillDate formata a data", () => {
    expect(formatCreditCardBillDate("2026-05-20")).toMatch(/2026/u);
  });

  it("formatCreditCardBillCycleLabel inclui início, fim e vencimento", () => {
    const bill: CreditCardBillRecord = {
      cycle: {
        startDate: "2026-04-11",
        endDate: "2026-05-10",
        dueDate: "2026-05-20",
        status: "open",
      },
      transactions: [],
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
    expect(formatCreditCardBillCycleLabel(bill)).toMatch(/vence/u);
  });

  it("groupCreditCardBillTransactionsByDate ordena e separa sem data", () => {
    const groups = groupCreditCardBillTransactionsByDate([
      { id: "b", title: "B", amount: 1, dueDate: "2026-05-20", status: "p", type: "expense" },
      { id: "a", title: "A", amount: 1, dueDate: "2026-05-10", status: "p", type: "expense" },
      { id: "c", title: "C", amount: 1, dueDate: null, status: "p", type: "expense" },
    ]);
    expect(groups.map((group) => group.key)).toEqual([
      "2026-05-10",
      "2026-05-20",
      "without-date",
    ]);
    expect(groups.at(-1)?.label).toBe("Sem data");
  });
});
