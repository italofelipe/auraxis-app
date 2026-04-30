import { describe, expect, it } from "@jest/globals";

import {
  AVISO_PREVIO_BASE_DAYS,
  AVISO_PREVIO_EXTRA_DAYS_PER_YEAR,
  AVISO_PREVIO_MAX_DAYS,
  FGTS_MULTA_RATE_ACORDO,
  FGTS_MULTA_RATE_SEM_JUSTA_CAUSA,
  calculateRescisao,
  createDefaultRescisaoFormState,
  validateRescisaoForm,
  type RescisaoFormState,
} from "./rescisao";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a minimal valid form state for sem_justa_causa, easy to override.
 *
 * @returns Valid RescisaoFormState.
 */
function validForm(): RescisaoFormState {
  return {
    grossSalary: 5000,
    terminationType: "sem_justa_causa",
    yearsOfService: 2,
    daysWorkedInLastMonth: 30,
    monthsFor13: 6,
    monthsForVacation: 6,
    hasExpiredVacation: false,
    overtimeAverage: 0,
    dependents: 0,
    fgtsBalance: 10000,
  };
}

// ─── createDefaultRescisaoFormState ───────────────────────────────────────────

describe("createDefaultRescisaoFormState", () => {
  it("returns sem_justa_causa as default termination type", () => {
    const state = createDefaultRescisaoFormState();
    expect(state.terminationType).toBe("sem_justa_causa");
  });

  it("returns null grossSalary by default", () => {
    const state = createDefaultRescisaoFormState();
    expect(state.grossSalary).toBeNull();
  });
});

// ─── validateRescisaoForm ─────────────────────────────────────────────────────

describe("validateRescisaoForm", () => {
  it("returns no errors for a valid form", () => {
    expect(validateRescisaoForm(validForm())).toHaveLength(0);
  });

  it("requires grossSalary to be provided and positive", () => {
    const errors = validateRescisaoForm({ ...validForm(), grossSalary: null });
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("rejects zero grossSalary", () => {
    const errors = validateRescisaoForm({ ...validForm(), grossSalary: 0 });
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("rejects negative yearsOfService", () => {
    const errors = validateRescisaoForm({ ...validForm(), yearsOfService: -1 });
    expect(errors.some((e) => e.field === "yearsOfService")).toBe(true);
  });

  it("rejects non-integer yearsOfService", () => {
    const errors = validateRescisaoForm({ ...validForm(), yearsOfService: 1.5 });
    expect(errors.some((e) => e.field === "yearsOfService")).toBe(true);
  });

  it("rejects daysWorkedInLastMonth below 1", () => {
    const errors = validateRescisaoForm({ ...validForm(), daysWorkedInLastMonth: 0 });
    expect(errors.some((e) => e.field === "daysWorkedInLastMonth")).toBe(true);
  });

  it("rejects daysWorkedInLastMonth above 31", () => {
    const errors = validateRescisaoForm({ ...validForm(), daysWorkedInLastMonth: 32 });
    expect(errors.some((e) => e.field === "daysWorkedInLastMonth")).toBe(true);
  });

  it("rejects monthsFor13 below 1", () => {
    const errors = validateRescisaoForm({ ...validForm(), monthsFor13: 0 });
    expect(errors.some((e) => e.field === "monthsFor13")).toBe(true);
  });

  it("rejects monthsFor13 above 12", () => {
    const errors = validateRescisaoForm({ ...validForm(), monthsFor13: 13 });
    expect(errors.some((e) => e.field === "monthsFor13")).toBe(true);
  });

  it("rejects monthsForVacation below 0", () => {
    const errors = validateRescisaoForm({ ...validForm(), monthsForVacation: -1 });
    expect(errors.some((e) => e.field === "monthsForVacation")).toBe(true);
  });

  it("rejects monthsForVacation above 11", () => {
    const errors = validateRescisaoForm({ ...validForm(), monthsForVacation: 12 });
    expect(errors.some((e) => e.field === "monthsForVacation")).toBe(true);
  });

  it("rejects negative overtimeAverage", () => {
    const errors = validateRescisaoForm({ ...validForm(), overtimeAverage: -100 });
    expect(errors.some((e) => e.field === "overtimeAverage")).toBe(true);
  });

  it("rejects negative fgtsBalance", () => {
    const errors = validateRescisaoForm({ ...validForm(), fgtsBalance: -500 });
    expect(errors.some((e) => e.field === "fgtsBalance")).toBe(true);
  });

  it("rejects non-integer dependents", () => {
    const errors = validateRescisaoForm({ ...validForm(), dependents: 1.5 });
    expect(errors.some((e) => e.field === "dependents")).toBe(true);
  });
});

// ─── Aviso prévio days (Lei 12.506/2011) ─────────────────────────────────────

describe("aviso prévio days", () => {
  it("computes base constant values", () => {
    expect(AVISO_PREVIO_BASE_DAYS).toBe(30);
    expect(AVISO_PREVIO_EXTRA_DAYS_PER_YEAR).toBe(3);
    expect(AVISO_PREVIO_MAX_DAYS).toBe(90);
  });

  it("gives 30 days for 0 years of service", () => {
    const result = calculateRescisao({ ...validForm(), yearsOfService: 0 });
    expect(result.noticeDays).toBe(30);
  });

  it("gives 33 days for 1 year of service", () => {
    const result = calculateRescisao({ ...validForm(), yearsOfService: 1 });
    expect(result.noticeDays).toBe(33);
  });

  it("caps at 90 days for 20+ years of service", () => {
    const result = calculateRescisao({ ...validForm(), yearsOfService: 30 });
    expect(result.noticeDays).toBe(90);
  });
});

// ─── Saldo de salário ─────────────────────────────────────────────────────────

describe("saldo de salário", () => {
  it("equals full month salary when daysWorkedInLastMonth is 30", () => {
    const result = calculateRescisao({ ...validForm(), grossSalary: 3000, daysWorkedInLastMonth: 30 });
    expect(result.saldoSalario).toBeCloseTo(3000, 2);
  });

  it("prorates correctly for partial month", () => {
    const result = calculateRescisao({ ...validForm(), grossSalary: 3000, daysWorkedInLastMonth: 15 });
    expect(result.saldoSalario).toBeCloseTo(1500, 2);
  });
});

// ─── Aviso prévio indenizado ──────────────────────────────────────────────────

describe("aviso prévio indenizado", () => {
  it("is paid for sem_justa_causa", () => {
    const result = calculateRescisao({
      ...validForm(),
      grossSalary: 3000,
      terminationType: "sem_justa_causa",
      yearsOfService: 0,
    });
    expect(result.avisoPrevio).toBeCloseTo(3000, 2); // 30 days = full month
  });

  it("is paid for acordo", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "acordo",
      yearsOfService: 0,
    });
    expect(result.avisoPrevio).toBeGreaterThan(0);
  });

  it("is zero for com_justa_causa", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "com_justa_causa",
    });
    expect(result.avisoPrevio).toBe(0);
  });

  it("is zero for pedido_de_demissao", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "pedido_de_demissao",
    });
    expect(result.avisoPrevio).toBe(0);
  });
});

// ─── 13º proporcional ─────────────────────────────────────────────────────────

describe("13º proporcional", () => {
  it("equals half the monthly base for 6 months", () => {
    const result = calculateRescisao({ ...validForm(), grossSalary: 3000, monthsFor13: 6 });
    expect(result.decimoTerceiroProporcional).toBeCloseTo(1500, 2);
  });

  it("equals full monthly base for 12 months", () => {
    const result = calculateRescisao({ ...validForm(), grossSalary: 3000, monthsFor13: 12 });
    expect(result.decimoTerceiroProporcional).toBeCloseTo(3000, 2);
  });

  it("is zero for com_justa_causa", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "com_justa_causa",
      monthsFor13: 6,
    });
    expect(result.decimoTerceiroProporcional).toBe(0);
  });

  it("is positive for pedido_de_demissao", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "pedido_de_demissao",
      monthsFor13: 6,
    });
    expect(result.decimoTerceiroProporcional).toBeGreaterThan(0);
  });
});

// ─── Férias proporcionais ─────────────────────────────────────────────────────

describe("férias proporcionais", () => {
  it("equals zero when monthsForVacation is 0", () => {
    const result = calculateRescisao({ ...validForm(), monthsForVacation: 0 });
    expect(result.feriasProporcionais).toBe(0);
  });

  it("includes 1/3 constitutional", () => {
    const result = calculateRescisao({
      ...validForm(),
      grossSalary: 3000,
      monthsForVacation: 6,
    });
    expect(result.feriasProporcionaisThird).toBeCloseTo(result.feriasProporcionaisBase / 3, 1);
    expect(result.feriasProporcionais).toBeCloseTo(
      result.feriasProporcionaisBase + result.feriasProporcionaisThird,
      2,
    );
  });

  it("is zero for com_justa_causa", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "com_justa_causa",
      monthsForVacation: 6,
    });
    expect(result.feriasProporcionais).toBe(0);
  });
});

// ─── Férias vencidas ──────────────────────────────────────────────────────────

describe("férias vencidas", () => {
  it("is zero when hasExpiredVacation is false", () => {
    const result = calculateRescisao({ ...validForm(), hasExpiredVacation: false });
    expect(result.feriasVencidas).toBe(0);
  });

  it("equals full month salary + 1/3 when hasExpiredVacation is true", () => {
    const result = calculateRescisao({
      ...validForm(),
      grossSalary: 3000,
      hasExpiredVacation: true,
    });
    expect(result.feriasVencidasBase).toBeCloseTo(3000, 2);
    expect(result.feriasVencidas).toBeCloseTo(4000, 2); // 3000 * 4/3
  });
});

// ─── FGTS multa ───────────────────────────────────────────────────────────────

describe("FGTS multa", () => {
  it("applies 40% for sem_justa_causa", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "sem_justa_causa",
      fgtsBalance: 10000,
    });
    expect(result.fgtsMulta).toBeCloseTo(10000 * FGTS_MULTA_RATE_SEM_JUSTA_CAUSA, 2);
  });

  it("applies 20% for acordo", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "acordo",
      fgtsBalance: 10000,
    });
    expect(result.fgtsMulta).toBeCloseTo(10000 * FGTS_MULTA_RATE_ACORDO, 2);
  });

  it("is zero for pedido_de_demissao", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "pedido_de_demissao",
      fgtsBalance: 10000,
    });
    expect(result.fgtsMulta).toBe(0);
  });

  it("is zero for com_justa_causa", () => {
    const result = calculateRescisao({
      ...validForm(),
      terminationType: "com_justa_causa",
      fgtsBalance: 10000,
    });
    expect(result.fgtsMulta).toBe(0);
  });
});

// ─── INSS ─────────────────────────────────────────────────────────────────────

describe("INSS", () => {
  it("excludes aviso prévio indenizado from INSS base", () => {
    const result = calculateRescisao({
      ...validForm(),
      grossSalary: 3000,
      terminationType: "sem_justa_causa",
      yearsOfService: 0,
      daysWorkedInLastMonth: 30,
      monthsFor13: 1,
      monthsForVacation: 0,
    });
    // INSS base = saldo (3000) + decimo (250) + feriasPropBase (0) + feriasVencBase (0)
    expect(result.inssBase).toBeCloseTo(3000 + result.decimoTerceiroProporcional, 1);
    expect(result.avisoPrevio).toBeGreaterThan(0);
  });

  it("is positive for a typical salary", () => {
    const result = calculateRescisao(validForm());
    expect(result.inss).toBeGreaterThan(0);
  });
});

// ─── Net total ────────────────────────────────────────────────────────────────

describe("net total", () => {
  it("equals totalGross minus INSS minus IRRF", () => {
    const result = calculateRescisao(validForm());
    expect(result.netTotal).toBeCloseTo(result.totalGross - result.inss - result.irrf, 2);
  });

  it("is less than totalGross when there are deductions", () => {
    const result = calculateRescisao(validForm());
    expect(result.netTotal).toBeLessThan(result.totalGross);
  });

  it("sem_justa_causa net is higher than pedido_de_demissao for same salary and FGTS", () => {
    const base = { ...validForm(), fgtsBalance: 10000 };
    const semJusta = calculateRescisao({ ...base, terminationType: "sem_justa_causa" });
    const pedido = calculateRescisao({ ...base, terminationType: "pedido_de_demissao" });
    expect(semJusta.netTotal).toBeGreaterThan(pedido.netTotal);
  });
});
