import { previewInstallments } from "@/features/transactions/utils/preview-installments";

describe("previewInstallments", () => {
  it("gera 12 parcelas de R$ 100 a partir de 2026-05-17", () => {
    const preview = previewInstallments({
      amount: "1200.00",
      installmentCount: 12,
      firstDueDate: new Date("2026-05-17T00:00:00.000Z"),
    });

    expect(preview.perInstallmentAmount).toBe("100.00");
    expect(preview.installments).toHaveLength(12);
    expect(preview.installments[0]).toEqual({
      installmentNumber: 1,
      dueDate: "2026-05-17",
      amount: "100.00",
    });
    expect(preview.installments[11]).toEqual({
      installmentNumber: 12,
      dueDate: "2027-04-17",
      amount: "100.00",
    });
  });

  it("distribui centavos quando a divisao nao e inteira", () => {
    const preview = previewInstallments({
      amount: "100.00",
      installmentCount: 3,
      firstDueDate: new Date("2026-05-17T00:00:00.000Z"),
    });

    expect(preview.installments.map((item) => item.amount)).toEqual([
      "33.34",
      "33.33",
      "33.33",
    ]);
    expect(preview.totalAmount).toBe("100.00");
  });

  it("ancora fim de mes em 31/01 + 1 mes = 28/02", () => {
    const preview = previewInstallments({
      amount: "200.00",
      installmentCount: 2,
      firstDueDate: new Date("2026-01-31T00:00:00.000Z"),
    });

    expect(preview.installments.map((item) => item.dueDate)).toEqual([
      "2026-01-31",
      "2026-02-28",
    ]);
  });
});
