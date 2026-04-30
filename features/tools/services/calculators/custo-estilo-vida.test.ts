import { describe, expect, it } from "@jest/globals";

import {
  calculateCustoEstiloVida,
  createDefaultCustoEstiloVidaFormState,
  decodeQueryToForm,
  encodeFormToQuery,
  validateCustoEstiloVidaForm,
  type CustoEstiloVidaFormState,
} from "./custo-estilo-vida";

describe("validateCustoEstiloVidaForm", () => {
  it("returns error when no expense has amount", () => {
    const form = createDefaultCustoEstiloVidaFormState();
    const errors = validateCustoEstiloVidaForm(form);
    expect(errors.some((e) => e.messageKey === "errors.atLeastOneExpenseRequired")).toBe(true);
  });

  it("returns error when horizon < 1", () => {
    const form: CustoEstiloVidaFormState = {
      ...createDefaultCustoEstiloVidaFormState(),
      expenses: [{ name: "Café", monthlyAmount: 200 }],
      horizonYears: 0,
    };
    const errors = validateCustoEstiloVidaForm(form);
    expect(errors.some((e) => e.messageKey === "errors.horizonRequired")).toBe(true);
  });

  it("passes with valid form", () => {
    const form: CustoEstiloVidaFormState = {
      ...createDefaultCustoEstiloVidaFormState(),
      expenses: [{ name: "Café", monthlyAmount: 200 }],
    };
    expect(validateCustoEstiloVidaForm(form)).toHaveLength(0);
  });
});

describe("calculateCustoEstiloVida", () => {
  it("calculates opportunity cost for single expense", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Streaming", monthlyAmount: 50 }],
      annualReturnPct: 12,
      horizonYears: 10,
    };
    const result = calculateCustoEstiloVida(form);

    expect(result.totalMonthlyCost).toBe(50);
    expect(result.totalAnnualCost).toBe(600);
    expect(result.totalOpportunityCost).toBeGreaterThan(600 * 10);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0]!.opportunityCost).toBeGreaterThan(0);
  });

  it("calculates multiple expenses", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Streaming", monthlyAmount: 50 },
        { name: "Café diário", monthlyAmount: 200 },
      ],
      annualReturnPct: 10,
      horizonYears: 20,
    };
    const result = calculateCustoEstiloVida(form);

    expect(result.totalMonthlyCost).toBe(250);
    expect(result.expenses).toHaveLength(2);
    expect(result.totalOpportunityCost).toBe(
      result.expenses[0]!.opportunityCost + result.expenses[1]!.opportunityCost,
    );
  });

  it("filters out zero-amount expenses", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Streaming", monthlyAmount: 50 },
        { name: "Vazio", monthlyAmount: 0 },
      ],
      annualReturnPct: 12,
      horizonYears: 5,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.expenses).toHaveLength(1);
  });

  it("uses 'Sem nome' for unnamed expenses", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "", monthlyAmount: 100 }],
      annualReturnPct: 12,
      horizonYears: 5,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.expenses[0]!.name).toBe("Sem nome");
  });

  it("handles 0% return rate", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [{ name: "Test", monthlyAmount: 100 }],
      annualReturnPct: 0,
      horizonYears: 5,
    };
    const result = calculateCustoEstiloVida(form);
    expect(result.totalOpportunityCost).toBe(6000); // 100 * 60 months, no growth
  });
});

describe("URL sharing encode/decode", () => {
  it("roundtrips form state through encode/decode", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Café", monthlyAmount: 200 },
        { name: "Gym", monthlyAmount: 150 },
      ],
      annualReturnPct: 12,
      horizonYears: 10,
    };
    const encoded = encodeFormToQuery(form);
    const decoded = decodeQueryToForm(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.expenses).toHaveLength(2);
    expect(decoded!.expenses![0]!.name).toBe("Café");
    expect(decoded!.expenses![0]!.monthlyAmount).toBe(200);
    expect(decoded!.annualReturnPct).toBe(12);
    expect(decoded!.horizonYears).toBe(10);
  });

  it("returns null for invalid encoded string", () => {
    expect(decodeQueryToForm("not-valid-base64!!!")).toBeNull();
  });

  it("returns null when decoded data has no expenses array", () => {
    const encoded = btoa(JSON.stringify({ r: 12, h: 10 }));
    expect(decodeQueryToForm(encoded)).toBeNull();
  });

  it("filters out zero-amount expenses in encoding", () => {
    const form: CustoEstiloVidaFormState = {
      expenses: [
        { name: "Active", monthlyAmount: 100 },
        { name: "Empty", monthlyAmount: 0 },
      ],
      annualReturnPct: 10,
      horizonYears: 5,
    };
    const encoded = encodeFormToQuery(form);
    const decoded = decodeQueryToForm(encoded);
    expect(decoded!.expenses).toHaveLength(1);
  });
});
