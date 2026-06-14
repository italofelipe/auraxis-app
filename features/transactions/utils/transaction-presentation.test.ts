import {
  formatStatusLabel,
  getInstallmentLabel,
  statusTone,
} from "@/features/transactions/utils/transaction-presentation";

describe("transaction-presentation", () => {
  describe("statusTone", () => {
    it("mapeia os estados conhecidos", () => {
      expect(statusTone("paid")).toBe("primary");
      expect(statusTone("overdue")).toBe("danger");
      expect(statusTone("pending")).toBe("default");
    });

    it("usa default para estado desconhecido", () => {
      expect(statusTone("weird")).toBe("default");
    });
  });

  describe("formatStatusLabel", () => {
    it("traduz os estados conhecidos para pt-BR", () => {
      expect(formatStatusLabel("paid")).toBe("Pago");
      expect(formatStatusLabel("overdue")).toBe("Vencido");
    });

    it("faz fallback para o valor cru quando desconhecido", () => {
      expect(formatStatusLabel("weird")).toBe("weird");
    });
  });

  describe("getInstallmentLabel", () => {
    it("retorna null quando nao e parcelada", () => {
      expect(
        getInstallmentLabel({
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
        }),
      ).toBeNull();
    });

    it("formata 'Parcela X/Y' quando ha numero da parcela", () => {
      expect(
        getInstallmentLabel({
          isInstallment: true,
          installmentCount: 12,
          installmentNumber: 3,
        }),
      ).toBe("Parcela 3/12");
    });

    it("formata 'Parcelado em Yx' quando nao ha numero da parcela", () => {
      expect(
        getInstallmentLabel({
          isInstallment: true,
          installmentCount: 6,
          installmentNumber: null,
        }),
      ).toBe("Parcelado em 6x");
    });
  });
});
