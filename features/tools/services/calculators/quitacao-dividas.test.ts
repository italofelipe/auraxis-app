import { describe, expect, it } from "@jest/globals";

import {
  calculateQuitacaoDividas,
  createDefaultQuitacaoDividasFormState,
  validateQuitacaoDividasForm,
  type QuitacaoDividasFormState,
} from "./quitacao-dividas";

describe("validateQuitacaoDividasForm", () => {
  it("returns error when fewer than 2 debts", () => {
    const form: QuitacaoDividasFormState = {
      debts: [{ name: "A", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 }],
      extraPayment: 0,
    };
    const errors = validateQuitacaoDividasForm(form);
    expect(errors.some((e) => e.messageKey === "errors.minTwoDebts")).toBe(true);
  });

  it("returns error when no debt has valid balance", () => {
    const form = createDefaultQuitacaoDividasFormState();
    const errors = validateQuitacaoDividasForm(form);
    expect(errors.some((e) => e.messageKey === "errors.atLeastOneDebtRequired")).toBe(true);
  });

  it("passes validation with valid debts", () => {
    const form: QuitacaoDividasFormState = {
      debts: [
        { name: "A", balance: 1000, monthlyRatePct: 2, minimumPayment: 100 },
        { name: "B", balance: 5000, monthlyRatePct: 5, minimumPayment: 200 },
      ],
      extraPayment: 300,
    };
    expect(validateQuitacaoDividasForm(form)).toHaveLength(0);
  });
});

describe("calculateQuitacaoDividas", () => {
  const baseForm: QuitacaoDividasFormState = {
    debts: [
      { name: "Cartão A", balance: 2000, monthlyRatePct: 10, minimumPayment: 200 },
      { name: "Empréstimo B", balance: 8000, monthlyRatePct: 2, minimumPayment: 400 },
    ],
    extraPayment: 500,
  };

  it("calculates total debt", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.totalDebt).toBe(10000);
  });

  it("generates both snowball and avalanche strategies", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.snowball.strategy).toBe("snowball");
    expect(result.avalanche.strategy).toBe("avalanche");
  });

  it("both strategies eventually pay off all debt", () => {
    const result = calculateQuitacaoDividas(baseForm);
    const lastSnowball = result.snowball.timeline[result.snowball.timeline.length - 1];
    const lastAvalanche = result.avalanche.timeline[result.avalanche.timeline.length - 1];
    expect(lastSnowball!.totalBalance).toBeLessThan(1);
    expect(lastAvalanche!.totalBalance).toBeLessThan(1);
  });

  it("avalanche pays less total interest than snowball (high rate disparity)", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.avalanche.totalInterest).toBeLessThanOrEqual(result.snowball.totalInterest);
    expect(result.bestStrategy).toBe("avalanche");
  });

  it("calculates interest saved", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.interestSaved).toBeGreaterThanOrEqual(0);
    expect(result.interestSaved).toBe(
      Math.abs(result.snowball.totalInterest - result.avalanche.totalInterest),
    );
  });

  it("timeline starts at month 0 with full debt", () => {
    const result = calculateQuitacaoDividas(baseForm);
    expect(result.snowball.timeline[0]!.month).toBe(0);
    expect(result.snowball.timeline[0]!.totalBalance).toBe(10000);
  });

  it("handles no extra payment", () => {
    const form: QuitacaoDividasFormState = {
      ...baseForm,
      extraPayment: 0,
    };
    const result = calculateQuitacaoDividas(form);
    expect(result.snowball.totalMonths).toBeGreaterThan(0);
    expect(result.avalanche.totalMonths).toBeGreaterThan(0);
  });

  it("handles zero-rate debts", () => {
    const form: QuitacaoDividasFormState = {
      debts: [
        { name: "Sem juros", balance: 1000, monthlyRatePct: 0, minimumPayment: 100 },
        { name: "Com juros", balance: 2000, monthlyRatePct: 3, minimumPayment: 150 },
      ],
      extraPayment: 200,
    };
    const result = calculateQuitacaoDividas(form);
    expect(result.totalDebt).toBe(3000);
    expect(result.snowball.totalMonths).toBeGreaterThan(0);
  });
});
