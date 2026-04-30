import { describe, expect, it } from "@jest/globals";
import { calcInss, calcIrrf, calcIrrfFromGross } from "./br-tax-tables";

describe("calcInss", () => {
  it("applies 7.5% on salary in first bracket", () => {
    expect(calcInss(1_000)).toBeCloseTo(75, 2);
  });

  it("applies progressive rate on salary spanning multiple brackets", () => {
    // R$ 3,000 spans brackets 1, 2, and 3
    // 1,518.00 × 7.5% = 113.85
    // (2,793.88 − 1,518.00) × 9% = 114.83
    // (3,000.00 − 2,793.88) × 12% = 24.74
    // total ≈ 253.42
    expect(calcInss(3_000)).toBeCloseTo(253.42, 1);
  });

  it("caps at ceiling of R$ 8,157.41", () => {
    const atCeiling = calcInss(8_157.41);
    const aboveCeiling = calcInss(15_000);
    expect(aboveCeiling).toBeCloseTo(atCeiling, 2);
  });

  it("returns 0 for zero salary", () => {
    expect(calcInss(0)).toBe(0);
  });
});

describe("calcIrrf", () => {
  it("returns 0 for taxable base below exemption threshold", () => {
    expect(calcIrrf(2_000)).toBe(0);
  });

  it("applies 7.5% bracket correctly", () => {
    // 2,500 × 7.5% − 169.44 = 187.50 − 169.44 = 18.06
    expect(calcIrrf(2_500)).toBeCloseTo(18.06, 1);
  });

  it("never returns negative value", () => {
    expect(calcIrrf(0)).toBe(0);
    expect(calcIrrf(-100)).toBe(0);
  });
});

describe("calcIrrfFromGross", () => {
  it("deducts INSS and dependent deductions before applying IRRF", () => {
    const gross = 5_000;
    const inss = calcInss(gross);
    const withDep = calcIrrfFromGross(gross, inss, 1);
    const withoutDep = calcIrrfFromGross(gross, inss, 0);
    expect(withDep).toBeLessThan(withoutDep);
  });

  it("returns 0 when deductions exceed gross", () => {
    expect(calcIrrfFromGross(1_000, 1_000, 0)).toBe(0);
  });
});
