import { describe, expect, it } from "@jest/globals";

import {
  calculateReservaEmergencia,
  createDefaultReservaEmergenciaFormState,
  validateReservaEmergenciaForm,
  type ReservaEmergenciaFormState,
} from "./reserva-emergencia";

describe("validateReservaEmergenciaForm", () => {
  it("returns error when monthlyExpenses is null", () => {
    const form = createDefaultReservaEmergenciaFormState();
    const errors = validateReservaEmergenciaForm(form);
    expect(errors.some((e) => e.field === "monthlyExpenses")).toBe(true);
  });

  it("returns error when monthlyContribution is null", () => {
    const form = { ...createDefaultReservaEmergenciaFormState(), monthlyExpenses: 3000 };
    const errors = validateReservaEmergenciaForm(form);
    expect(errors.some((e) => e.field === "monthlyContribution")).toBe(true);
  });

  it("returns no errors with valid form", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
    };
    expect(validateReservaEmergenciaForm(form)).toHaveLength(0);
  });
});

describe("calculateReservaEmergencia", () => {
  it("calculates target as 6x expenses for CLT", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(18000);
    expect(result.profileMonths).toBe(6);
  });

  it("calculates target as 12x expenses for PJ", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 5000,
      monthlyContribution: 1000,
      profile: "pj",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(60000);
    expect(result.profileMonths).toBe(12);
  });

  it("calculates target as 18x expenses for empresario", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 4000,
      monthlyContribution: 800,
      profile: "empresario",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.targetAmount).toBe(72000);
    expect(result.profileMonths).toBe(18);
  });

  it("considers currentReserve in gap calculation", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      currentReserve: 10000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.gap).toBe(8000);
  });

  it("gap is 0 when reserve exceeds target", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 2000,
      monthlyContribution: 500,
      currentReserve: 20000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.gap).toBe(0);
    expect(result.monthsToTarget).toBe(0);
  });

  it("generates timeline with month 0 as starting point", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 1000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.timeline[0]!.month).toBe(0);
    expect(result.timeline[0]!.balance).toBe(0);
    expect(result.timeline.length).toBeGreaterThan(1);
  });

  it("generates investment comparisons for all 4 vehicles", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 1000,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    expect(result.investments).toHaveLength(4);
    expect(result.investments[0]!.name).toContain("Selic");
  });

  it("poupanca takes longer than selic", () => {
    const form: ReservaEmergenciaFormState = {
      ...createDefaultReservaEmergenciaFormState(),
      monthlyExpenses: 3000,
      monthlyContribution: 500,
      profile: "clt",
    };
    const result = calculateReservaEmergencia(form);
    const selic = result.investments.find((i) => i.name.includes("Selic"));
    const poupanca = result.investments.find((i) => i.name.includes("Poupança"));
    expect(poupanca!.monthsToTarget).toBeGreaterThan(selic!.monthsToTarget);
  });
});
