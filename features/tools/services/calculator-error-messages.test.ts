import { describe, expect, it } from "@jest/globals";

import { resolveCalculatorError } from "./calculator-error-messages";

describe("resolveCalculatorError", () => {
  it("traduz chaves conhecidas para pt-BR", () => {
    expect(resolveCalculatorError("errors.grossSalaryRequired")).toBe(
      "Informe o salário bruto.",
    );
    expect(resolveCalculatorError("errors.expensesRequired")).toBe(
      "Informe seus gastos mensais.",
    );
    expect(resolveCalculatorError("errors.contributionRequired")).toBe(
      "Informe quanto pretende aportar por mês.",
    );
    expect(resolveCalculatorError("errors.incomeRequired")).toBe(
      "Informe sua renda líquida mensal.",
    );
    expect(resolveCalculatorError("errors.amountRequired")).toBe(
      "Informe um valor maior que zero.",
    );
    expect(resolveCalculatorError("errors.rateRequired")).toBe(
      "Informe a taxa manual ou aguarde a cotação.",
    );
  });

  it("usa fallback genérico para chaves desconhecidas", () => {
    expect(resolveCalculatorError("errors.totalmenteInventada")).toBe(
      "Campo inválido. Confira e tente novamente.",
    );
  });
});
