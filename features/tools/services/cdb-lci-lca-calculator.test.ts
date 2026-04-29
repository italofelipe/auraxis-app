import { describe, expect, it } from "@jest/globals";

import {
  calculateCdbLciLca,
  type CdbLciLcaInputs,
} from "@/features/tools/services/cdb-lci-lca-calculator";

const baseInputs = (overrides: Partial<CdbLciLcaInputs> = {}): CdbLciLcaInputs => ({
  amount: 10_000,
  months: 12,
  rateKind: "cdi_percent",
  rateValue: 100,
  cdiAnnualPercent: 12,
  ...overrides,
});

describe("calculateCdbLciLca", () => {
  it("LCI and LCA pay the same gross yield as CDB but with zero IR", () => {
    const result = calculateCdbLciLca(baseInputs());
    expect(result.lci.grossYield).toBeCloseTo(result.cdb.grossYield, 1);
    expect(result.lca.grossYield).toBeCloseTo(result.cdb.grossYield, 1);
    expect(result.lci.irRatePercent).toBe(0);
    expect(result.lca.irRatePercent).toBe(0);
  });

  it("CDB has 22.5 % IR for tenors up to 180 days (≈6 months)", () => {
    const result = calculateCdbLciLca(baseInputs({ months: 6 }));
    expect(result.cdb.irRatePercent).toBe(22.5);
  });

  it("CDB has 20 % IR between 181 and 360 days", () => {
    const result = calculateCdbLciLca(baseInputs({ months: 12 }));
    expect(result.cdb.irRatePercent).toBe(20);
  });

  it("CDB has 17.5 % IR between 361 and 720 days", () => {
    const result = calculateCdbLciLca(baseInputs({ months: 18 }));
    expect(result.cdb.irRatePercent).toBe(17.5);
  });

  it("CDB has 15 % IR above 720 days", () => {
    const result = calculateCdbLciLca(baseInputs({ months: 36 }));
    expect(result.cdb.irRatePercent).toBe(15);
  });

  it("treats prefixed rates directly without applying CDI", () => {
    const result = calculateCdbLciLca(
      baseInputs({ rateKind: "prefixed", rateValue: 12, cdiAnnualPercent: 999 }),
    );
    // 10000 × 1.12 - 10000 = 1200 (1y prefixed)
    expect(result.cdb.grossYield).toBeCloseTo(1200, 0);
  });

  it("picks LCI as the best product when CDB pays IR (same gross, no IR)", () => {
    const result = calculateCdbLciLca(baseInputs({ months: 12 }));
    expect(result.cdb.netYield).toBeLessThan(result.lci.netYield);
    expect(result.bestProduct).not.toBe("cdb");
  });

  it("netAmount equals principal plus netYield", () => {
    const result = calculateCdbLciLca(baseInputs());
    expect(result.cdb.netAmount).toBeCloseTo(
      10_000 + result.cdb.netYield,
      1,
    );
  });
});
