/**
 * Domain model for the Desconto, Markup e Margem calculator, mirrored
 * from `auraxis-web/app/features/tools/model/desconto-markup.ts`.
 *
 * Modes:
 *  - desconto: original price + discount % → final price + savings.
 *  - markup:   cost + markup % → sale price + profit.
 *  - margem:   sale price + cost → margin % + profit.
 *  - reverso:  final price + discount % → original price + applied discount.
 */

import { round2 } from "./math-utils";

export const DESCONTO_MARKUP_MODES = [
  "desconto",
  "markup",
  "margem",
  "reverso",
] as const;

export type DescontoMarkupMode = (typeof DESCONTO_MARKUP_MODES)[number];

export interface DescontoMarkupFormState extends Record<string, unknown> {
  mode: DescontoMarkupMode;
  price: number | null;
  pct: number | null;
  cost: number | null;
}

export const createDefaultDescontoMarkupFormState =
  (): DescontoMarkupFormState => ({
    mode: "desconto",
    price: null,
    pct: null,
    cost: null,
  });

export interface DescontoMarkupValidationError {
  readonly field: keyof DescontoMarkupFormState;
  readonly messageKey: string;
}

const validateDesconto = (
  form: DescontoMarkupFormState,
): DescontoMarkupValidationError[] => {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.price === null || form.price <= 0) {
    errors.push({ field: "price", messageKey: "errors.priceRequired" });
  }
  if (form.pct === null || form.pct < 0 || form.pct > 100) {
    errors.push({ field: "pct", messageKey: "errors.pctRequired" });
  }
  return errors;
};

const validateMarkup = (
  form: DescontoMarkupFormState,
): DescontoMarkupValidationError[] => {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.cost === null || form.cost <= 0) {
    errors.push({ field: "cost", messageKey: "errors.costRequired" });
  }
  if (form.pct === null || form.pct < 0) {
    errors.push({ field: "pct", messageKey: "errors.pctRequired" });
  }
  return errors;
};

const validateMargem = (
  form: DescontoMarkupFormState,
): DescontoMarkupValidationError[] => {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.price === null || form.price <= 0) {
    errors.push({ field: "price", messageKey: "errors.priceRequired" });
  }
  if (form.cost === null || form.cost < 0) {
    errors.push({ field: "cost", messageKey: "errors.costRequired" });
  }
  return errors;
};

const validateReverso = (
  form: DescontoMarkupFormState,
): DescontoMarkupValidationError[] => {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.price === null || form.price <= 0) {
    errors.push({ field: "price", messageKey: "errors.priceRequired" });
  }
  if (form.pct === null || form.pct < 0 || form.pct >= 100) {
    errors.push({ field: "pct", messageKey: "errors.pctRequired" });
  }
  return errors;
};

export const validateDescontoMarkupForm = (
  form: DescontoMarkupFormState,
): DescontoMarkupValidationError[] => {
  if (form.mode === "desconto") {
    return validateDesconto(form);
  }
  if (form.mode === "markup") {
    return validateMarkup(form);
  }
  if (form.mode === "margem") {
    return validateMargem(form);
  }
  return validateReverso(form);
};

export interface DescontoMarkupResult {
  readonly calculatedValue: number;
  readonly pctResult: number;
  readonly savingsOrProfit: number;
  readonly mode: DescontoMarkupMode;
}

const calcDesconto = (form: DescontoMarkupFormState): DescontoMarkupResult => {
  const price = form.price ?? 0;
  const pct = form.pct ?? 0;
  const finalPrice = round2(price * (1 - pct / 100));
  return {
    calculatedValue: finalPrice,
    pctResult: pct,
    savingsOrProfit: round2(price - finalPrice),
    mode: "desconto",
  };
};

const calcMarkup = (form: DescontoMarkupFormState): DescontoMarkupResult => {
  const cost = form.cost ?? 0;
  const pct = form.pct ?? 0;
  const salePrice = round2(cost * (1 + pct / 100));
  return {
    calculatedValue: salePrice,
    pctResult: pct,
    savingsOrProfit: round2(salePrice - cost),
    mode: "markup",
  };
};

const calcMargem = (form: DescontoMarkupFormState): DescontoMarkupResult => {
  const price = form.price ?? 0;
  const cost = form.cost ?? 0;
  const marginPct = price > 0 ? round2(((price - cost) / price) * 100) : 0;
  return {
    calculatedValue: marginPct,
    pctResult: marginPct,
    savingsOrProfit: round2(price - cost),
    mode: "margem",
  };
};

const calcReverso = (form: DescontoMarkupFormState): DescontoMarkupResult => {
  const finalPrice = form.price ?? 0;
  const pct = form.pct ?? 0;
  const divisor = 1 - pct / 100;
  const originalPrice = divisor > 0 ? round2(finalPrice / divisor) : 0;
  return {
    calculatedValue: originalPrice,
    pctResult: pct,
    savingsOrProfit: round2(originalPrice - finalPrice),
    mode: "reverso",
  };
};

export const calculateDescontoMarkup = (
  form: DescontoMarkupFormState,
): DescontoMarkupResult => {
  if (form.mode === "desconto") {
    return calcDesconto(form);
  }
  if (form.mode === "markup") {
    return calcMarkup(form);
  }
  if (form.mode === "margem") {
    return calcMargem(form);
  }
  return calcReverso(form);
};

export interface DescontoMarkupModeMeta {
  readonly id: DescontoMarkupMode;
  readonly label: string;
  readonly description: string;
}

export const DESCONTO_MARKUP_MODE_META: readonly DescontoMarkupModeMeta[] = [
  {
    id: "desconto",
    label: "Desconto",
    description: "Preco original + % de desconto → preco final + economia.",
  },
  {
    id: "markup",
    label: "Markup",
    description: "Custo + % de markup → preco de venda + lucro.",
  },
  {
    id: "margem",
    label: "Margem",
    description: "Preco de venda + custo → margem em % + lucro.",
  },
  {
    id: "reverso",
    label: "Reverso",
    description: "Preco final + % de desconto → preco original.",
  },
];
