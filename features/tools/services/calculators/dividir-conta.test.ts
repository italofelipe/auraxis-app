import { describe, expect, it } from "@jest/globals";
import {
  DIVIDIR_CONTA_MODES,
  calculateDividirConta,
  createDefaultDividirContaFormState,
  validateDividirContaForm,
  type DividirContaFormState,
} from "./dividir-conta";

// ─── validateDividirContaForm ─────────────────────────────────────────────────

describe("validateDividirContaForm", () => {
  it("returns no errors for a valid equal-mode form", () => {
    const form: DividirContaFormState = {
      total: 200,
      serviceFeePct: 10,
      tipPct: 0,
      people: 4,
      mode: "equal",
      individualAmounts: [null, null, null, null],
    };
    expect(validateDividirContaForm(form)).toHaveLength(0);
  });

  it("returns error when total is null", () => {
    const form = { ...createDefaultDividirContaFormState() };
    const errors = validateDividirContaForm(form);
    expect(errors.some((e) => e.field === "total")).toBe(true);
  });

  it("returns error when total is zero or negative", () => {
    const form: DividirContaFormState = {
      ...createDefaultDividirContaFormState(),
      total: -10,
    };
    const errors = validateDividirContaForm(form);
    expect(errors.some((e) => e.field === "total")).toBe(true);
  });

  it("returns error when people is less than 2", () => {
    const form: DividirContaFormState = {
      ...createDefaultDividirContaFormState(),
      total: 100,
      people: 1,
    };
    const errors = validateDividirContaForm(form);
    expect(errors.some((e) => e.field === "people")).toBe(true);
  });

  it("returns error when serviceFeePct is above 100", () => {
    const form: DividirContaFormState = {
      ...createDefaultDividirContaFormState(),
      total: 100,
      serviceFeePct: 150,
    };
    const errors = validateDividirContaForm(form);
    expect(errors.some((e) => e.field === "serviceFeePct")).toBe(true);
  });

  it("returns error when tipPct is negative", () => {
    const form: DividirContaFormState = {
      ...createDefaultDividirContaFormState(),
      total: 100,
      tipPct: -5,
    };
    const errors = validateDividirContaForm(form);
    expect(errors.some((e) => e.field === "tipPct")).toBe(true);
  });

  it("returns error in individual mode when some amounts are null", () => {
    const form: DividirContaFormState = {
      total: 200,
      serviceFeePct: 10,
      tipPct: 0,
      people: 3,
      mode: "individual",
      individualAmounts: [80, null, 70],
    };
    const errors = validateDividirContaForm(form);
    expect(errors.some((e) => e.field === "individualAmounts")).toBe(true);
  });

  it("returns no errors in individual mode when all amounts are filled", () => {
    const form: DividirContaFormState = {
      total: 200,
      serviceFeePct: 10,
      tipPct: 5,
      people: 3,
      mode: "individual",
      individualAmounts: [80, 70, 50],
    };
    expect(validateDividirContaForm(form)).toHaveLength(0);
  });

  it("accepts zero tip and zero service fee", () => {
    const form: DividirContaFormState = {
      total: 100,
      serviceFeePct: 0,
      tipPct: 0,
      people: 2,
      mode: "equal",
      individualAmounts: [null, null],
    };
    expect(validateDividirContaForm(form)).toHaveLength(0);
  });
});

// ─── calculateDividirConta — equal mode ──────────────────────────────────────

describe("calculateDividirConta — equal mode", () => {
  it("divides total with fee equally among people", () => {
    const form: DividirContaFormState = {
      total: 200,
      serviceFeePct: 10,
      tipPct: 0,
      people: 4,
      mode: "equal",
      individualAmounts: [null, null, null, null],
    };
    const result = calculateDividirConta(form);
    // 200 + 20 = 220; 220 / 4 = 55
    expect(result.totalWithFees).toBeCloseTo(220, 2);
    expect(result.perPersonEqual).toBeCloseTo(55, 2);
  });

  it("applies both service fee and tip correctly", () => {
    const form: DividirContaFormState = {
      total: 100,
      serviceFeePct: 10,
      tipPct: 5,
      people: 2,
      mode: "equal",
      individualAmounts: [null, null],
    };
    const result = calculateDividirConta(form);
    // 100 + 10 + 5 = 115; 115 / 2 = 57.5
    expect(result.serviceFeeBrl).toBeCloseTo(10, 2);
    expect(result.tipBrl).toBeCloseTo(5, 2);
    expect(result.totalWithFees).toBeCloseTo(115, 2);
    expect(result.perPersonEqual).toBeCloseTo(57.5, 2);
  });

  it("returns zero fees when both percentages are zero", () => {
    const form: DividirContaFormState = {
      total: 80,
      serviceFeePct: 0,
      tipPct: 0,
      people: 2,
      mode: "equal",
      individualAmounts: [null, null],
    };
    const result = calculateDividirConta(form);
    expect(result.serviceFeeBrl).toBe(0);
    expect(result.tipBrl).toBe(0);
    expect(result.totalWithFees).toBe(80);
    expect(result.perPersonEqual).toBe(40);
  });
});

// ─── calculateDividirConta — individual mode ──────────────────────────────────

describe("calculateDividirConta — individual mode", () => {
  it("splits fees proportionally to individual consumption", () => {
    const form: DividirContaFormState = {
      total: 200,
      serviceFeePct: 10,
      tipPct: 0,
      people: 2,
      mode: "individual",
      individualAmounts: [100, 100],
    };
    const result = calculateDividirConta(form);
    // fees = 20; each pays 100 + 10 = 110
    expect(result.perPersonIndividual[0]).toBeCloseTo(110, 2);
    expect(result.perPersonIndividual[1]).toBeCloseTo(110, 2);
  });

  it("gives higher fee share to the person who consumed more", () => {
    const form: DividirContaFormState = {
      total: 100,
      serviceFeePct: 10,
      tipPct: 0,
      people: 2,
      mode: "individual",
      individualAmounts: [75, 25],
    };
    const result = calculateDividirConta(form);
    // fees = 10; person A pays 75 + 7.5 = 82.5; person B pays 25 + 2.5 = 27.5
    expect(result.perPersonIndividual[0]).toBeCloseTo(82.5, 2);
    expect(result.perPersonIndividual[1]).toBeCloseTo(27.5, 2);
  });

  it("perPersonIndividual sums to totalWithFees", () => {
    const form: DividirContaFormState = {
      total: 150,
      serviceFeePct: 10,
      tipPct: 5,
      people: 3,
      mode: "individual",
      individualAmounts: [60, 50, 40],
    };
    const result = calculateDividirConta(form);
    const sum = result.perPersonIndividual.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(result.totalWithFees, 1);
  });
});

// ─── DIVIDIR_CONTA_MODES constant ────────────────────────────────────────────

describe("DIVIDIR_CONTA_MODES", () => {
  it("contains equal and individual modes", () => {
    expect(DIVIDIR_CONTA_MODES).toContain("equal");
    expect(DIVIDIR_CONTA_MODES).toContain("individual");
  });
});

// ─── createDefaultDividirContaFormState ──────────────────────────────────────

describe("createDefaultDividirContaFormState", () => {
  it("returns defaults with people=2, serviceFeePct=10, tipPct=0, mode=equal", () => {
    const form = createDefaultDividirContaFormState();
    expect(form.total).toBeNull();
    expect(form.serviceFeePct).toBe(10);
    expect(form.tipPct).toBe(0);
    expect(form.people).toBe(2);
    expect(form.mode).toBe("equal");
    expect(form.individualAmounts).toHaveLength(2);
  });
});
