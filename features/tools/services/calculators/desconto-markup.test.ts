import { describe, expect, it } from "@jest/globals";

import {
  DESCONTO_MARKUP_MODES,
  DESCONTO_MARKUP_MODE_META,
  calculateDescontoMarkup,
  createDefaultDescontoMarkupFormState,
  validateDescontoMarkupForm,
  type DescontoMarkupFormState,
} from "./desconto-markup";

const buildForm = (
  overrides: Partial<DescontoMarkupFormState> = {},
): DescontoMarkupFormState => ({
  ...createDefaultDescontoMarkupFormState(),
  ...overrides,
});

describe("desconto-markup constants", () => {
  it("expoe os 4 modos canonicos", () => {
    expect(DESCONTO_MARKUP_MODES).toEqual([
      "desconto",
      "markup",
      "margem",
      "reverso",
    ]);
  });

  it("metadados contem rotulo e descricao para cada modo", () => {
    expect(DESCONTO_MARKUP_MODE_META).toHaveLength(4);
    DESCONTO_MARKUP_MODE_META.forEach((entry) => {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    });
  });
});

describe("validateDescontoMarkupForm", () => {
  it("desconto: aceita preco e % validos", () => {
    expect(
      validateDescontoMarkupForm(buildForm({ price: 100, pct: 10 })),
    ).toEqual([]);
  });

  it("desconto: rejeita preco invalido", () => {
    const errors = validateDescontoMarkupForm(buildForm({ price: 0, pct: 10 }));
    expect(errors.some((e) => e.field === "price")).toBe(true);
  });

  it("desconto: rejeita pct fora de 0..100", () => {
    const errors = validateDescontoMarkupForm(
      buildForm({ price: 100, pct: 120 }),
    );
    expect(errors.some((e) => e.field === "pct")).toBe(true);
  });

  it("markup: exige custo positivo e pct >= 0", () => {
    const errors = validateDescontoMarkupForm(
      buildForm({ mode: "markup", cost: 0, pct: -1 }),
    );
    expect(errors.some((e) => e.field === "cost")).toBe(true);
    expect(errors.some((e) => e.field === "pct")).toBe(true);
  });

  it("margem: aceita custo zero", () => {
    expect(
      validateDescontoMarkupForm(
        buildForm({ mode: "margem", price: 100, cost: 0 }),
      ),
    ).toEqual([]);
  });

  it("reverso: rejeita pct >= 100", () => {
    const errors = validateDescontoMarkupForm(
      buildForm({ mode: "reverso", price: 50, pct: 100 }),
    );
    expect(errors.some((e) => e.field === "pct")).toBe(true);
  });
});

describe("calculateDescontoMarkup", () => {
  it("desconto: calcula preco final e economia", () => {
    const result = calculateDescontoMarkup(buildForm({ price: 100, pct: 10 }));
    expect(result.calculatedValue).toBe(90);
    expect(result.savingsOrProfit).toBe(10);
    expect(result.mode).toBe("desconto");
  });

  it("markup: calcula preco de venda e lucro", () => {
    const result = calculateDescontoMarkup(
      buildForm({ mode: "markup", cost: 100, pct: 25 }),
    );
    expect(result.calculatedValue).toBe(125);
    expect(result.savingsOrProfit).toBe(25);
  });

  it("margem: calcula percentual e lucro", () => {
    const result = calculateDescontoMarkup(
      buildForm({ mode: "margem", price: 200, cost: 150 }),
    );
    expect(result.calculatedValue).toBe(25);
    expect(result.savingsOrProfit).toBe(50);
  });

  it("margem: retorna zero quando preco e zero", () => {
    const result = calculateDescontoMarkup(
      buildForm({ mode: "margem", price: 0, cost: 0 }),
    );
    expect(result.calculatedValue).toBe(0);
  });

  it("reverso: recupera preco original", () => {
    const result = calculateDescontoMarkup(
      buildForm({ mode: "reverso", price: 90, pct: 10 }),
    );
    expect(result.calculatedValue).toBe(100);
    expect(result.savingsOrProfit).toBe(10);
  });

  it("reverso: protege contra divisor zero quando pct >= 100", () => {
    const result = calculateDescontoMarkup(
      buildForm({ mode: "reverso", price: 90, pct: 100 }),
    );
    expect(result.calculatedValue).toBe(0);
  });
});
