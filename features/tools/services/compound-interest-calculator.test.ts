import { describe, expect, it } from "@jest/globals";

import {
  calculateCompoundInterest,
  type CompoundInterestInputs,
} from "@/features/tools/services/compound-interest-calculator";

const baseInputs = (overrides: Partial<CompoundInterestInputs> = {}): CompoundInterestInputs => ({
  initialAmount: 0,
  monthlyContribution: 0,
  annualRatePercent: 0,
  months: 12,
  regime: "yearly",
  ...overrides,
});

describe("calculateCompoundInterest", () => {
  it("returns the principal when there is neither rate nor contribution", () => {
    const result = calculateCompoundInterest(baseInputs({ initialAmount: 1000 }));
    expect(result.finalAmount).toBe(1000);
    expect(result.totalInterest).toBe(0);
    expect(result.totalContributed).toBe(1000);
  });

  it("compounds 12 % per year on a single principal", () => {
    const result = calculateCompoundInterest(
      baseInputs({ initialAmount: 1000, annualRatePercent: 12 }),
    );
    expect(result.finalAmount).toBeCloseTo(1120, 0);
    expect(result.totalContributed).toBe(1000);
    expect(result.totalInterest).toBeCloseTo(120, 0);
  });

  it("treats 'monthly' regime as nominal rate divided by 12", () => {
    const result = calculateCompoundInterest(
      baseInputs({
        initialAmount: 1000,
        annualRatePercent: 12,
        regime: "monthly",
      }),
    );
    // 1000 × (1 + 0.01)^12 ≈ 1126.83
    expect(result.finalAmount).toBeCloseTo(1126.83, 1);
  });

  it("accumulates monthly contributions on top of compounding", () => {
    const result = calculateCompoundInterest(
      baseInputs({
        initialAmount: 0,
        monthlyContribution: 500,
        annualRatePercent: 12,
        months: 120,
      }),
    );
    expect(result.totalContributed).toBe(60_000);
    expect(result.finalAmount).toBeGreaterThan(60_000);
  });

  it("emits one schedule row per month", () => {
    const result = calculateCompoundInterest(baseInputs({ months: 6 }));
    expect(result.schedule).toHaveLength(6);
    expect(result.schedule[0]?.month).toBe(1);
    expect(result.schedule[5]?.month).toBe(6);
  });

  it("invested column tracks contributions only, not interest", () => {
    const result = calculateCompoundInterest(
      baseInputs({
        initialAmount: 100,
        monthlyContribution: 50,
        annualRatePercent: 12,
        months: 3,
      }),
    );
    expect(result.schedule[2]?.invested).toBe(250); // 100 + 50*3
  });
});
