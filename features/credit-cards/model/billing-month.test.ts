import {
  billMonthsWindow,
  billWindowStartDate,
  monthEndDate,
  monthKeyLabel,
  monthKeyShort,
  parseMonthKey,
  shiftMonthKey,
} from "@/features/credit-cards/model/billing-month";

describe("billing-month", () => {
  describe("parseMonthKey", () => {
    it("divide YYYY-MM em ano e índice 0-based", () => {
      expect(parseMonthKey("2026-06")).toEqual([2026, 5]);
      expect(parseMonthKey("2026-01")).toEqual([2026, 0]);
    });
  });

  describe("shiftMonthKey", () => {
    it("avança meses dentro do mesmo ano", () => {
      expect(shiftMonthKey("2026-06", 1)).toBe("2026-07");
    });

    it("vira o ano para frente", () => {
      expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
    });

    it("vira o ano para trás", () => {
      expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    });
  });

  describe("monthKeyShort", () => {
    it("abrevia o mês em português", () => {
      expect(monthKeyShort("2026-07")).toBe("Jul");
      expect(monthKeyShort("2026-01")).toBe("Jan");
      expect(monthKeyShort("2026-12")).toBe("Dez");
    });
  });

  describe("monthKeyLabel", () => {
    it("gera rótulo extenso com ano", () => {
      const label = monthKeyLabel("2026-06");
      expect(label).toContain("junho");
      expect(label).toContain("2026");
    });
  });

  describe("billMonthsWindow", () => {
    it("gera janela crescente terminando no mês final", () => {
      expect(billMonthsWindow("2026-06", 3)).toEqual([
        "2026-04",
        "2026-05",
        "2026-06",
      ]);
    });

    it("atravessa a virada de ano", () => {
      expect(billMonthsWindow("2026-01", 2)).toEqual(["2025-12", "2026-01"]);
    });

    it("garante ao menos um mês", () => {
      expect(billMonthsWindow("2026-06", 0)).toEqual(["2026-06"]);
    });
  });

  describe("monthEndDate", () => {
    it("retorna o último dia do mês", () => {
      expect(monthEndDate("2026-02")).toBe("2026-02-28");
      expect(monthEndDate("2026-01")).toBe("2026-01-31");
    });
  });

  describe("billWindowStartDate", () => {
    it("retorna o primeiro dia com folga de um mês antes da janela", () => {
      expect(billWindowStartDate("2026-06", 3)).toBe("2026-03-01");
    });
  });
});
