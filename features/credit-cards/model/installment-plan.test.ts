import {
  buildDistribution,
  computeInstallmentPlan,
} from "@/features/credit-cards/model/installment-plan";

describe("computeInstallmentPlan", () => {
  it("divide o financiado pelo número de parcelas", () => {
    expect(
      computeInstallmentPlan({ total: 1200, downPayment: 0, installments: 3 }),
    ).toEqual({ downPayment: 0, financed: 1200, perInstallment: 400 });
  });

  it("desconta a entrada do valor financiado", () => {
    expect(
      computeInstallmentPlan({ total: 1200, downPayment: 300, installments: 3 }),
    ).toEqual({ downPayment: 300, financed: 900, perInstallment: 300 });
  });

  it("clampa a entrada ao total", () => {
    expect(
      computeInstallmentPlan({ total: 1000, downPayment: 1500, installments: 2 }),
    ).toEqual({ downPayment: 1000, financed: 0, perInstallment: 0 });
  });

  it("trata número de parcelas inválido como uma parcela", () => {
    const plan = computeInstallmentPlan({
      total: 500,
      downPayment: 0,
      installments: 0,
    });
    expect(plan.perInstallment).toBe(500);
  });

  it("nunca retorna valores negativos", () => {
    const plan = computeInstallmentPlan({
      total: -100,
      downPayment: -50,
      installments: 3,
    });
    expect(plan.financed).toBe(0);
    expect(plan.downPayment).toBe(0);
  });
});

describe("buildDistribution", () => {
  const base = {
    total: 1200,
    downPayment: 0,
    hasDownPayment: false,
    installments: 3,
    startBillMonth: "2026-07",
  } as const;

  it("à vista gera um único chip no mês da fatura", () => {
    const chips = buildDistribution({ ...base, mode: "avista" });
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({ label: "Jul", sub: "à vista", value: 1200 });
    expect(chips[0]?.isEntry).toBe(false);
  });

  it("parcelado gera um chip por parcela com mês e índice", () => {
    const chips = buildDistribution({ ...base, mode: "parcelado" });
    expect(chips).toHaveLength(3);
    expect(chips.map((chip) => chip.label)).toEqual(["Jul", "Ago", "Set"]);
    expect(chips.map((chip) => chip.sub)).toEqual(["1/3", "2/3", "3/3"]);
    expect(chips.every((chip) => chip.value === 400)).toBe(true);
  });

  it("com entrada adiciona o chip de entrada antes das parcelas", () => {
    const chips = buildDistribution({
      ...base,
      mode: "parcelado",
      hasDownPayment: true,
      downPayment: 300,
    });
    expect(chips).toHaveLength(4);
    expect(chips[0]).toMatchObject({ label: "Entrada", sub: "hoje", value: 300, isEntry: true });
    expect(chips.slice(1).every((chip) => chip.value === 300)).toBe(true);
  });

  it("ignora a entrada quando o modo é à vista", () => {
    const chips = buildDistribution({
      ...base,
      mode: "avista",
      hasDownPayment: true,
      downPayment: 300,
    });
    expect(chips.some((chip) => chip.isEntry)).toBe(false);
  });
});
