import { describe, expect, it } from "@jest/globals";
import {
  FGTS_DEPOSIT_RATE,
  FGTS_FINE_RATES,
  FGTS_TABLE_YEAR,
  FGTS_TERMINATION_TYPES,
  calculateFgts,
  createDefaultFgtsFormState,
  validateFgtsForm,
  type FgtsFormState,
} from "./fgts";

// ─── validateFgtsForm ─────────────────────────────────────────────────────────

describe("validateFgtsForm", () => {
  it("returns no errors for a valid form", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 2,
      monthsOfService: 6,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    expect(validateFgtsForm(form)).toHaveLength(0);
  });

  it("returns error when grossSalary is null", () => {
    const form = createDefaultFgtsFormState();
    const errors = validateFgtsForm(form);
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when grossSalary is zero", () => {
    const form: FgtsFormState = {
      ...createDefaultFgtsFormState(),
      grossSalary: 0,
    };
    expect(validateFgtsForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when grossSalary is negative", () => {
    const form: FgtsFormState = {
      ...createDefaultFgtsFormState(),
      grossSalary: -100,
    };
    expect(validateFgtsForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when yearsOfService is negative", () => {
    const form: FgtsFormState = {
      ...createDefaultFgtsFormState(),
      grossSalary: 3000,
      yearsOfService: -1,
    };
    expect(validateFgtsForm(form).some((e) => e.field === "yearsOfService")).toBe(true);
  });

  it("returns error when monthsOfService exceeds 11", () => {
    const form: FgtsFormState = {
      ...createDefaultFgtsFormState(),
      grossSalary: 3000,
      monthsOfService: 12,
    };
    expect(validateFgtsForm(form).some((e) => e.field === "monthsOfService")).toBe(true);
  });

  it("returns error when currentBalance is negative", () => {
    const form: FgtsFormState = {
      ...createDefaultFgtsFormState(),
      grossSalary: 3000,
      currentBalance: -500,
    };
    expect(validateFgtsForm(form).some((e) => e.field === "currentBalance")).toBe(true);
  });

  it("accepts form with zero years of service", () => {
    const form: FgtsFormState = {
      grossSalary: 2000,
      yearsOfService: 0,
      monthsOfService: 6,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "acordo",
    };
    expect(validateFgtsForm(form)).toHaveLength(0);
  });
});

// ─── createDefaultFgtsFormState ───────────────────────────────────────────────

describe("createDefaultFgtsFormState", () => {
  it("returns default state with expected values", () => {
    const form = createDefaultFgtsFormState();
    expect(form.grossSalary).toBeNull();
    expect(form.yearsOfService).toBe(1);
    expect(form.monthsOfService).toBe(0);
    expect(form.currentBalance).toBe(0);
    expect(form.trRatePct).toBe(0.0);
    expect(form.terminationType).toBe("sem_justa_causa");
  });
});

// ─── calculateFgts — constants ────────────────────────────────────────────────

describe("FGTS constants", () => {
  it("deposit rate is 8%", () => {
    expect(FGTS_DEPOSIT_RATE).toBe(0.08);
  });

  it("table year is 2025", () => {
    expect(FGTS_TABLE_YEAR).toBe(2025);
  });

  it("termination types has 4 values", () => {
    expect(FGTS_TERMINATION_TYPES).toHaveLength(4);
  });

  it("fine rate for sem_justa_causa is 0.40", () => {
    expect(FGTS_FINE_RATES.sem_justa_causa).toBe(0.4);
  });

  it("fine rate for acordo is 0.20", () => {
    expect(FGTS_FINE_RATES.acordo).toBe(0.2);
  });

  it("fine rate for pedido_demissao is 0", () => {
    expect(FGTS_FINE_RATES.pedido_demissao).toBe(0);
  });

  it("fine rate for justa_causa is 0", () => {
    expect(FGTS_FINE_RATES.justa_causa).toBe(0);
  });
});

// ─── calculateFgts — monthly deposit ─────────────────────────────────────────

describe("calculateFgts — monthly deposit", () => {
  it("calculates monthly deposit as 8% of gross salary", () => {
    const form: FgtsFormState = {
      grossSalary: 5000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { monthlyDeposit } = calculateFgts(form);
    expect(monthlyDeposit).toBeCloseTo(400, 2);
  });

  it("totalDeposited equals totalMonths * monthlyDeposit", () => {
    const form: FgtsFormState = {
      grossSalary: 2500,
      yearsOfService: 2,
      monthsOfService: 3,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "justa_causa",
    };
    const { totalDeposited, monthlyDeposit } = calculateFgts(form);
    const totalMonths = 2 * 12 + 3;
    expect(totalDeposited).toBeCloseTo(totalMonths * monthlyDeposit, 2);
  });
});

// ─── calculateFgts — balance accumulation ────────────────────────────────────

describe("calculateFgts — balance accumulation", () => {
  it("projected balance is greater than totalDeposited due to correction", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 2,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { projectedBalance, totalDeposited } = calculateFgts(form);
    expect(projectedBalance).toBeGreaterThan(totalDeposited);
  });

  it("starting with a current balance results in higher projected balance", () => {
    const baseForm: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "pedido_demissao",
    };
    const withBalance: FgtsFormState = { ...baseForm, currentBalance: 5000 };
    const { projectedBalance: base } = calculateFgts(baseForm);
    const { projectedBalance: withBal } = calculateFgts(withBalance);
    expect(withBal).toBeGreaterThan(base);
  });

  it("correction amount is positive for non-zero period", () => {
    const form: FgtsFormState = {
      grossSalary: 4000,
      yearsOfService: 1,
      monthsOfService: 6,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { correctionAmount } = calculateFgts(form);
    expect(correctionAmount).toBeGreaterThan(0);
  });
});

// ─── calculateFgts — termination fine ────────────────────────────────────────

describe("calculateFgts — termination fine", () => {
  it("sem_justa_causa: fineAmount = 40% of projectedBalance", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { projectedBalance, fineAmount } = calculateFgts(form);
    expect(fineAmount).toBeCloseTo(projectedBalance * 0.4, 2);
  });

  it("sem_justa_causa: governmentFineAmount = 10% of projectedBalance", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { projectedBalance, governmentFineAmount } = calculateFgts(form);
    expect(governmentFineAmount).toBeCloseTo(projectedBalance * 0.1, 2);
  });

  it("acordo: fineAmount = 20% of projectedBalance", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "acordo",
    };
    const { projectedBalance, fineAmount } = calculateFgts(form);
    expect(fineAmount).toBeCloseTo(projectedBalance * 0.2, 2);
  });

  it("acordo: governmentFineAmount is 0", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "acordo",
    };
    const { governmentFineAmount } = calculateFgts(form);
    expect(governmentFineAmount).toBe(0);
  });

  it("pedido_demissao: no fine, canWithdraw is false", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "pedido_demissao",
    };
    const { fineAmount, canWithdraw, withdrawableAmount } = calculateFgts(form);
    expect(fineAmount).toBe(0);
    expect(canWithdraw).toBe(false);
    expect(withdrawableAmount).toBe(0);
  });

  it("justa_causa: no fine, canWithdraw is false", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "justa_causa",
    };
    const { fineAmount, canWithdraw, withdrawableAmount } = calculateFgts(form);
    expect(fineAmount).toBe(0);
    expect(canWithdraw).toBe(false);
    expect(withdrawableAmount).toBe(0);
  });
});

// ─── calculateFgts — withdrawable amount ─────────────────────────────────────

describe("calculateFgts — withdrawable amount", () => {
  it("sem_justa_causa: withdrawableAmount = projectedBalance + fineAmount", () => {
    const form: FgtsFormState = {
      grossSalary: 5000,
      yearsOfService: 3,
      monthsOfService: 0,
      currentBalance: 1000,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { projectedBalance, fineAmount, withdrawableAmount } = calculateFgts(form);
    expect(withdrawableAmount).toBeCloseTo(projectedBalance + fineAmount, 2);
  });

  it("acordo: withdrawableAmount = 80% of projectedBalance + fineAmount", () => {
    const form: FgtsFormState = {
      grossSalary: 4000,
      yearsOfService: 2,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "acordo",
    };
    const { projectedBalance, fineAmount, withdrawableAmount } = calculateFgts(form);
    expect(withdrawableAmount).toBeCloseTo(projectedBalance * 0.8 + fineAmount, 2);
  });

  it("tableYear matches FGTS_TABLE_YEAR", () => {
    const form: FgtsFormState = {
      grossSalary: 3000,
      yearsOfService: 1,
      monthsOfService: 0,
      currentBalance: 0,
      trRatePct: 0,
      terminationType: "sem_justa_causa",
    };
    const { tableYear } = calculateFgts(form);
    expect(tableYear).toBe(FGTS_TABLE_YEAR);
  });
});
