import {
  formatStatusLabel,
  formatStatusLabelForType,
  getInstallmentLabel,
  statusTone,
  statusVisual,
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

  describe("statusVisual", () => {
    it("mapeia tom semântico + ícone dos estados conhecidos", () => {
      expect(statusVisual("paid").tone).toBe("success");
      expect(statusVisual("pending").tone).toBe("warning");
      expect(statusVisual("overdue").tone).toBe("danger");
      expect(statusVisual("paid").icon).toBe("check-circle-outline");
    });

    it("usa fallback neutro para estado desconhecido", () => {
      expect(statusVisual("weird").tone).toBe("neutral");
      expect(statusVisual("weird").icon).toBe("circle-outline");
    });
  });

  describe("formatStatusLabelForType", () => {
    it("mostra 'Recebido' para receita paga", () => {
      expect(formatStatusLabelForType("paid", "income")).toBe("Recebido");
    });

    it("mostra 'Pago' para despesa paga", () => {
      expect(formatStatusLabelForType("paid", "expense")).toBe("Pago");
    });

    it("delega para o rótulo padrão nos demais estados", () => {
      expect(formatStatusLabelForType("overdue", "expense")).toBe("Vencido");
      expect(formatStatusLabelForType("pending", "income")).toBe("Pendente");
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
