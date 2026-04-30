import { describe, expect, it } from "@jest/globals";
import {
  TESOURO_B3_CUSTODY_RATE,
  TESOURO_IR_BRACKETS,
  TESOURO_TABLE_YEAR,
  TESOURO_TYPES,
  calculateTesouroDireto,
  createDefaultTesouroDiretoFormState,
  findTesourIrRate,
  resolveEffectiveRate,
  validateTesouroDiretoForm,
  type TesouroDiretoFormState,
} from "./tesouro-direto";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("Tesouro Direto constants", () => {
  it("TESOURO_TABLE_YEAR is 2025", () => {
    expect(TESOURO_TABLE_YEAR).toBe(2025);
  });

  it("TESOURO_B3_CUSTODY_RATE is 0.002 (0.20% a.a.)", () => {
    expect(TESOURO_B3_CUSTODY_RATE).toBe(0.002);
  });

  it("TESOURO_TYPES contains selic, ipca_plus and prefixado", () => {
    expect(TESOURO_TYPES).toContain("selic");
    expect(TESOURO_TYPES).toContain("ipca_plus");
    expect(TESOURO_TYPES).toContain("prefixado");
  });

  it("TESOURO_IR_BRACKETS has four entries", () => {
    expect(TESOURO_IR_BRACKETS).toHaveLength(4);
  });
});

// ─── findTesourIrRate ─────────────────────────────────────────────────────────

describe("findTesourIrRate", () => {
  it("returns 22.5% for terms up to 180 days", () => {
    expect(findTesourIrRate(90)).toBe(0.225);
    expect(findTesourIrRate(180)).toBe(0.225);
  });

  it("returns 20% for 181–360 days", () => {
    expect(findTesourIrRate(181)).toBe(0.20);
    expect(findTesourIrRate(360)).toBe(0.20);
  });

  it("returns 17.5% for 361–720 days", () => {
    expect(findTesourIrRate(361)).toBe(0.175);
    expect(findTesourIrRate(720)).toBe(0.175);
  });

  it("returns 15% for terms over 720 days", () => {
    expect(findTesourIrRate(721)).toBe(0.15);
    expect(findTesourIrRate(2000)).toBe(0.15);
  });
});

// ─── resolveEffectiveRate ─────────────────────────────────────────────────────

describe("resolveEffectiveRate", () => {
  it("Selic: effectiveRate = selic + taxaIndicativa", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      type: "selic",
      taxaIndicativaPct: 0.0747,
      selicPct: 10.75,
    };
    const expected = 10.75 / 100 + 0.0747 / 100;
    expect(resolveEffectiveRate(form)).toBeCloseTo(expected, 6);
  });

  it("IPCA+: effectiveRate = ipca + taxaIndicativa", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      type: "ipca_plus",
      taxaIndicativaPct: 6.5,
      ipcaPct: 4.5,
    };
    const expected = (4.5 + 6.5) / 100;
    expect(resolveEffectiveRate(form)).toBeCloseTo(expected, 6);
  });

  it("Prefixado: effectiveRate = taxaIndicativa only", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      type: "prefixado",
      taxaIndicativaPct: 14.0,
    };
    expect(resolveEffectiveRate(form)).toBeCloseTo(0.14, 6);
  });

  it("returns selic alone when taxaIndicativa is null (null treated as 0)", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      type: "selic",
      taxaIndicativaPct: null,
    };
    expect(resolveEffectiveRate(form)).toBeCloseTo(10.75 / 100, 6);
  });
});

// ─── validateTesouroDiretoForm ────────────────────────────────────────────────

describe("validateTesouroDiretoForm", () => {
  it("returns no errors for a valid form", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      amount: 10000,
      taxaIndicativaPct: 0.0747,
    };
    expect(validateTesouroDiretoForm(form)).toHaveLength(0);
  });

  it("returns error when amount is null", () => {
    const form = createDefaultTesouroDiretoFormState();
    const errors = validateTesouroDiretoForm(form);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("returns error when amount is zero", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      amount: 0,
      taxaIndicativaPct: 6.5,
    };
    expect(validateTesouroDiretoForm(form).some((e) => e.field === "amount")).toBe(true);
  });

  it("returns error when termDays is 0", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      amount: 5000,
      termDays: 0,
      taxaIndicativaPct: 6.5,
    };
    expect(validateTesouroDiretoForm(form).some((e) => e.field === "termDays")).toBe(true);
  });

  it("returns error when taxaIndicativa is null", () => {
    const form: TesouroDiretoFormState = {
      ...createDefaultTesouroDiretoFormState(),
      amount: 5000,
    };
    expect(validateTesouroDiretoForm(form).some((e) => e.field === "taxaIndicativaPct")).toBe(true);
  });
});

// ─── calculateTesouroDireto ───────────────────────────────────────────────────

describe("calculateTesouroDireto — basic output", () => {
  const baseForm: TesouroDiretoFormState = {
    type: "prefixado",
    amount: 10000,
    termDays: 365,
    taxaIndicativaPct: 14.0,
    selicPct: 10.75,
    ipcaPct: 4.5,
  };

  it("grossReturn is positive", () => {
    expect(calculateTesouroDireto(baseForm).grossReturn).toBeGreaterThan(0);
  });

  it("netReturn is less than grossReturn", () => {
    const r = calculateTesouroDireto(baseForm);
    expect(r.netReturn).toBeLessThan(r.grossReturn);
  });

  it("netAmount = amount + netReturn", () => {
    const r = calculateTesouroDireto(baseForm);
    expect(r.netAmount).toBeCloseTo(baseForm.amount! + r.netReturn, 2);
  });

  it("custodyFee = amount * 0.002 * (termDays/365)", () => {
    const r = calculateTesouroDireto(baseForm);
    const expected = 10000 * 0.002 * 1;
    expect(r.custodyFee).toBeCloseTo(expected, 2);
  });

  it("irAmount = grossReturn * irRate", () => {
    const r = calculateTesouroDireto(baseForm);
    expect(r.irAmount).toBeCloseTo(r.grossReturn * r.irRate, 2);
  });

  it("IR rate is 17.5% for 365 days (361-720 bracket)", () => {
    expect(calculateTesouroDireto(baseForm).irRate).toBe(0.175);
  });
});

describe("calculateTesouroDireto — Selic bond", () => {
  it("effective rate equals selic + taxa for Selic bond", () => {
    const form: TesouroDiretoFormState = {
      type: "selic",
      amount: 10000,
      termDays: 365,
      taxaIndicativaPct: 0.07,
      selicPct: 10.75,
      ipcaPct: 4.5,
    };
    const r = calculateTesouroDireto(form);
    const effectiveRate = 10.75 / 100 + 0.07 / 100;
    const expectedGross = 10000 * (Math.pow(1 + effectiveRate, 1) - 1);
    expect(r.grossReturn).toBeCloseTo(expectedGross, 1);
  });
});

describe("calculateTesouroDireto — IPCA+ bond", () => {
  it("effective rate equals ipca + taxa for IPCA+ bond", () => {
    const form: TesouroDiretoFormState = {
      type: "ipca_plus",
      amount: 10000,
      termDays: 365,
      taxaIndicativaPct: 6.5,
      selicPct: 10.75,
      ipcaPct: 4.5,
    };
    const r = calculateTesouroDireto(form);
    const effectiveRate = (4.5 + 6.5) / 100;
    const expectedGross = 10000 * (Math.pow(1 + effectiveRate, 1) - 1);
    expect(r.grossReturn).toBeCloseTo(expectedGross, 1);
  });
});

describe("calculateTesouroDireto — real return", () => {
  it("real return is less than annualized net return when IPCA > 0", () => {
    const form: TesouroDiretoFormState = {
      type: "prefixado",
      amount: 10000,
      termDays: 365,
      taxaIndicativaPct: 14.0,
      selicPct: 10.75,
      ipcaPct: 4.5,
    };
    const r = calculateTesouroDireto(form);
    expect(r.realReturn).toBeLessThan(r.annualizedNetReturn);
  });

  it("annualizedNetReturn is positive for profitable bond", () => {
    const form: TesouroDiretoFormState = {
      type: "prefixado",
      amount: 10000,
      termDays: 365,
      taxaIndicativaPct: 14.0,
      selicPct: 10.75,
      ipcaPct: 4.5,
    };
    expect(calculateTesouroDireto(form).annualizedNetReturn).toBeGreaterThan(0);
  });
});
