import { describe, expect, it } from "@jest/globals";
import {
  MEI_ACTIVITY_TYPES,
  MEI_ANNUAL_LIMIT,
  MEI_BENEFITS,
  MEI_DAS_BY_ACTIVITY,
  MEI_MONTHLY_LIMIT,
  MEI_TABLE_YEAR,
  calculateMei,
  createDefaultMeiFormState,
  validateMeiForm,
  type MeiFormState,
} from "./mei";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("MEI constants", () => {
  it("annual limit is R$81,000", () => {
    expect(MEI_ANNUAL_LIMIT).toBe(81_000);
  });

  it("monthly limit is R$6,750", () => {
    expect(MEI_MONTHLY_LIMIT).toBe(6_750);
  });

  it("table year is 2025", () => {
    expect(MEI_TABLE_YEAR).toBe(2025);
  });

  it("activity types has 3 values", () => {
    expect(MEI_ACTIVITY_TYPES).toHaveLength(3);
  });

  it("benefits list has 5 items", () => {
    expect(MEI_BENEFITS).toHaveLength(5);
  });

  it("DAS for servicos is greater than comercio", () => {
    expect(MEI_DAS_BY_ACTIVITY.servicos).toBeGreaterThan(MEI_DAS_BY_ACTIVITY.comercio);
  });

  it("DAS for ambos is the highest", () => {
    expect(MEI_DAS_BY_ACTIVITY.ambos).toBeGreaterThan(MEI_DAS_BY_ACTIVITY.servicos);
  });
});

// ─── createDefaultMeiFormState ────────────────────────────────────────────────

describe("createDefaultMeiFormState", () => {
  it("returns default form with servicos activity", () => {
    const form = createDefaultMeiFormState();
    expect(form.activity).toBe("servicos");
    expect(form.monthlyRevenue).toBeNull();
    expect(form.currentSituation).toBe("pf_autonomo_sem_registro");
  });
});

// ─── validateMeiForm ──────────────────────────────────────────────────────────

describe("validateMeiForm", () => {
  it("returns no errors for a valid form", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 4000,
      currentSituation: "pf_carne_leao",
    };
    expect(validateMeiForm(form)).toHaveLength(0);
  });

  it("returns error when monthlyRevenue is null", () => {
    const form = createDefaultMeiFormState();
    const errors = validateMeiForm(form);
    expect(errors.some((e) => e.field === "monthlyRevenue")).toBe(true);
  });

  it("returns error when monthlyRevenue is zero", () => {
    const form: MeiFormState = {
      ...createDefaultMeiFormState(),
      monthlyRevenue: 0,
    };
    expect(validateMeiForm(form).some((e) => e.field === "monthlyRevenue")).toBe(true);
  });

  it("returns error when monthlyRevenue is negative", () => {
    const form: MeiFormState = {
      ...createDefaultMeiFormState(),
      monthlyRevenue: -100,
    };
    expect(validateMeiForm(form)).toHaveLength(1);
  });
});

// ─── calculateMei — DAS ───────────────────────────────────────────────────────

describe("calculateMei — DAS", () => {
  it("dasMontly equals MEI_DAS_BY_ACTIVITY for servicos", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 3000,
      currentSituation: "pf_autonomo_sem_registro",
    };
    const { dasMontly } = calculateMei(form);
    expect(dasMontly).toBe(MEI_DAS_BY_ACTIVITY.servicos);
  });

  it("dasMontly equals MEI_DAS_BY_ACTIVITY for comercio", () => {
    const form: MeiFormState = {
      activity: "comercio",
      monthlyRevenue: 3000,
      currentSituation: "pf_autonomo_sem_registro",
    };
    const { dasMontly } = calculateMei(form);
    expect(dasMontly).toBe(MEI_DAS_BY_ACTIVITY.comercio);
  });

  it("dasMontly equals MEI_DAS_BY_ACTIVITY for ambos", () => {
    const form: MeiFormState = {
      activity: "ambos",
      monthlyRevenue: 3000,
      currentSituation: "pf_autonomo_sem_registro",
    };
    const { dasMontly } = calculateMei(form);
    expect(dasMontly).toBe(MEI_DAS_BY_ACTIVITY.ambos);
  });

  it("dasAnnual is dasMontly * 12", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 4000,
      currentSituation: "pf_carne_leao",
    };
    const { dasMontly, dasAnnual } = calculateMei(form);
    expect(dasAnnual).toBeCloseTo(dasMontly * 12, 2);
  });
});

// ─── calculateMei — revenue limits ───────────────────────────────────────────

describe("calculateMei — revenue limits", () => {
  it("isWithinLimit is true when revenue <= 6750", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 6750,
      currentSituation: "pf_carne_leao",
    };
    const { isWithinLimit } = calculateMei(form);
    expect(isWithinLimit).toBe(true);
  });

  it("isWithinLimit is false when revenue > 6750", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 7000,
      currentSituation: "pf_carne_leao",
    };
    const { isWithinLimit } = calculateMei(form);
    expect(isWithinLimit).toBe(false);
  });

  it("limitWarning is true when annual revenue exceeds 81000", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 7000,
      currentSituation: "pf_carne_leao",
    };
    const { limitWarning, annualRevenueProjection } = calculateMei(form);
    expect(annualRevenueProjection).toBe(84_000);
    expect(limitWarning).toBe(true);
  });

  it("limitWarning is false when annual revenue is within limit", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 5000,
      currentSituation: "pf_carne_leao",
    };
    const { limitWarning } = calculateMei(form);
    expect(limitWarning).toBe(false);
  });
});

// ─── calculateMei — benefits ──────────────────────────────────────────────────

describe("calculateMei — benefits", () => {
  it("benefitsAvailable contains aposentadoria_por_idade", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 3000,
      currentSituation: "pf_autonomo_sem_registro",
    };
    const { benefitsAvailable } = calculateMei(form);
    expect(benefitsAvailable).toContain("aposentadoria_por_idade");
  });

  it("benefitsAvailable contains 5 benefits", () => {
    const form: MeiFormState = {
      activity: "comercio",
      monthlyRevenue: 3000,
      currentSituation: "already_mei",
    };
    const { benefitsAvailable } = calculateMei(form);
    expect(benefitsAvailable).toHaveLength(5);
  });
});

// ─── calculateMei — PF comparison ────────────────────────────────────────────

describe("calculateMei — PF comparison", () => {
  it("meiIsMoreAdvantageous is true for low revenues", () => {
    // At low revenue, PF autonomous tax (20% INSS + IRPF) > DAS ~R$80
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 3000,
      currentSituation: "pf_autonomo_sem_registro",
    };
    const { meiIsMoreAdvantageous, comparisonPF, dasMontly } = calculateMei(form);
    expect(comparisonPF.totalTaxPF).toBeGreaterThan(dasMontly);
    expect(meiIsMoreAdvantageous).toBe(true);
  });

  it("comparisonPF.inssMonthly is 20% of revenue when below ceiling", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 2000,
      currentSituation: "pf_autonomo_sem_registro",
    };
    const { comparisonPF } = calculateMei(form);
    expect(comparisonPF.inssMonthly).toBeCloseTo(2000 * 0.2, 2);
  });

  it("savingsVsPF equals totalTaxPF - dasMontly", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 3000,
      currentSituation: "pf_carne_leao",
    };
    const { savingsVsPF, comparisonPF, dasMontly } = calculateMei(form);
    expect(savingsVsPF).toBeCloseTo(comparisonPF.totalTaxPF - dasMontly, 2);
  });

  it("tableYear matches MEI_TABLE_YEAR", () => {
    const form: MeiFormState = {
      activity: "servicos",
      monthlyRevenue: 4000,
      currentSituation: "pf_carne_leao",
    };
    const { tableYear } = calculateMei(form);
    expect(tableYear).toBe(MEI_TABLE_YEAR);
  });
});
