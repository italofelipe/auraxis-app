import { describe, expect, it } from "@jest/globals";

import {
  projectGoalScenario,
  projectedCompletionDate,
} from "./goal-scenario-projector";

describe("projectGoalScenario", () => {
  it("projects a zero-interest trajectory equal to linear contributions", () => {
    const scenario = projectGoalScenario({
      currentAmount: 0,
      targetAmount: 1_000,
      monthlyContribution: 100,
      annualReturnRatePct: 0,
      horizonMonths: 12,
    });

    expect(scenario.points).toHaveLength(12);
    expect(scenario.points[11]?.balance).toBeCloseTo(1_200, 6);
    expect(scenario.finalBalance).toBeCloseTo(1_200, 6);
    expect(scenario.monthsToTarget).toBe(10);
    expect(scenario.remainingGap).toBe(0);
  });

  it("compounds interest on top of monthly contributions", () => {
    const scenario = projectGoalScenario({
      currentAmount: 1_000,
      targetAmount: 100_000,
      monthlyContribution: 500,
      annualReturnRatePct: 12,
      horizonMonths: 24,
    });

    expect(scenario.finalBalance).toBeGreaterThan(1_000 + 500 * 24);
  });

  it("marks monthsToTarget as null when the horizon is not enough", () => {
    const scenario = projectGoalScenario({
      currentAmount: 0,
      targetAmount: 100_000,
      monthlyContribution: 100,
      annualReturnRatePct: 0,
      horizonMonths: 12,
    });

    expect(scenario.monthsToTarget).toBeNull();
    expect(scenario.remainingGap).toBeGreaterThan(0);
  });

  it("returns monthsToTarget=0 when already at or above target", () => {
    const scenario = projectGoalScenario({
      currentAmount: 5_000,
      targetAmount: 5_000,
      monthlyContribution: 100,
      annualReturnRatePct: 0,
      horizonMonths: 6,
    });

    expect(scenario.monthsToTarget).toBe(0);
  });

  it("clamps negative contributions to zero", () => {
    const scenario = projectGoalScenario({
      currentAmount: 0,
      targetAmount: 1_000,
      monthlyContribution: -200,
      annualReturnRatePct: 0,
      horizonMonths: 6,
    });

    expect(scenario.finalBalance).toBe(0);
    expect(scenario.monthsToTarget).toBeNull();
  });

  it("clamps negative current amount to zero", () => {
    const scenario = projectGoalScenario({
      currentAmount: -500,
      targetAmount: 1_000,
      monthlyContribution: 100,
      annualReturnRatePct: 0,
      horizonMonths: 6,
    });
    expect(scenario.points[0]?.balance).toBe(100);
  });

  it("clamps fractional horizon down to a whole month", () => {
    const scenario = projectGoalScenario({
      currentAmount: 0,
      targetAmount: 10_000,
      monthlyContribution: 100,
      annualReturnRatePct: 0,
      horizonMonths: 12.9,
    });
    expect(scenario.points).toHaveLength(12);
  });
});

describe("projectedCompletionDate", () => {
  it("returns null when monthsToTarget is null", () => {
    expect(projectedCompletionDate(null)).toBeNull();
  });

  it("returns the reference date when monthsToTarget is zero", () => {
    const ref = new Date("2026-04-21T00:00:00Z");
    expect(projectedCompletionDate(0, ref)).toBe("2026-04-21");
  });

  it("adds the given months to the reference date", () => {
    const ref = new Date("2026-04-21T00:00:00Z");
    expect(projectedCompletionDate(12, ref)).toBe("2027-04-21");
  });
});
