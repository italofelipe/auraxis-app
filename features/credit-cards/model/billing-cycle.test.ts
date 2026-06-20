import { resolveCreditCardBillingCycle } from "@/features/credit-cards/model/billing-cycle";

describe("resolveCreditCardBillingCycle", () => {
  it("mantém a compra na fatura do mês quando ocorre até o fechamento", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-02",
      closingDay: 3,
      dueDay: 10,
    });
    expect(cycle.billMonth).toBe("2026-06");
    expect(cycle.closingDate).toBe("2026-06-03");
    expect(cycle.dueDate).toBe("2026-06-10");
    expect(cycle.closesAfterPurchase).toBe(true);
  });

  it("empurra a compra para a próxima fatura quando ocorre após o fechamento", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-05",
      closingDay: 3,
      dueDay: 10,
    });
    expect(cycle.billMonth).toBe("2026-07");
    expect(cycle.closingDate).toBe("2026-07-03");
    expect(cycle.dueDate).toBe("2026-07-10");
  });

  it("desloca o vencimento para o mês seguinte quando dueDay <= closingDay", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-10",
      closingDay: 20,
      dueDay: 5,
    });
    // Fecha em 2026-06-20; como o vencimento (5) <= fechamento (20), vence no mês seguinte.
    expect(cycle.billMonth).toBe("2026-06");
    expect(cycle.closingDate).toBe("2026-06-20");
    expect(cycle.dueDate).toBe("2026-07-05");
  });

  it("clampa o dia de fechamento ao último dia em meses curtos", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-02-15",
      closingDay: 31,
      dueDay: 10,
    });
    expect(cycle.closingDate).toBe("2026-02-28");
  });

  it("calcula o início do ciclo como o dia seguinte ao fechamento anterior", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-02",
      closingDay: 3,
      dueDay: 10,
    });
    expect(cycle.cycleStartDate).toBe("2026-05-04");
  });

  it("aceita instâncias Date como data da compra", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: new Date(2026, 5, 2),
      closingDay: 3,
      dueDay: 10,
    });
    expect(cycle.billMonth).toBe("2026-06");
  });

  it("gera o rótulo do mês em português", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-02",
      closingDay: 3,
      dueDay: 10,
    });
    expect(cycle.billLabel).toBe("junho de 2026");
  });
});
