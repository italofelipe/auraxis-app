/**
 * Domain model for the Conversor de Moeda (Currency Converter) calculator.
 *
 * Converts between Brazilian Real (BRL) and foreign currencies using live
 * bid/ask rates from BRAPI, with a manual rate fallback when the API is
 * unavailable.
 *
 * Exchange rate logic:
 *   - direction "buy"  → user holds BRL and buys foreign currency → rate = ask
 *     convertedAmount = brlAmount / ask
 *   - direction "sell" → user holds foreign currency and sells for BRL → rate = bid
 *     convertedAmount = foreignAmount * bid
 */

import type { BrapiCurrencyQuote } from "@/features/wallet/brapi-contracts";

export const CONVERSOR_MOEDA_PUBLIC_PATH = "/tools/conversor-moedas";

/** All supported currency pairs for conversion. */
export const CURRENCY_PAIRS = [
  "USD-BRL",
  "EUR-BRL",
  "GBP-BRL",
  "ARS-BRL",
  "JPY-BRL",
  "CAD-BRL",
  "AUD-BRL",
  "CHF-BRL",
  "BTC-BRL",
] as const;

export type CurrencyPair = (typeof CURRENCY_PAIRS)[number];

export interface ConversorMoedaFormState extends Record<string, unknown> {
  amount: number | null;
  pair: CurrencyPair;
  direction: "buy" | "sell";
  manualRate: number | null;
}

export interface ConversorMoedaResult {
  convertedAmount: number;
  rate: number;
  bid: number;
  ask: number;
  pctChange: number;
  source: "brapi" | "manual";
  fromCurrency: string;
  toCurrency: string;
}

export interface ConversorMoedaValidationError {
  field: string;
  messageKey: string;
}

export const createDefaultConversorMoedaFormState = (): ConversorMoedaFormState => ({
  amount: null,
  pair: "USD-BRL",
  direction: "buy",
  manualRate: null,
});

export const validateConversorMoedaForm = (
  form: ConversorMoedaFormState,
  hasBrapiQuote: boolean,
): ConversorMoedaValidationError[] => {
  const errors: ConversorMoedaValidationError[] = [];

  if (form.amount === null || form.amount <= 0) {
    errors.push({ field: "amount", messageKey: "errors.amountRequired" });
  }

  if (!hasBrapiQuote && (form.manualRate === null || form.manualRate <= 0)) {
    errors.push({ field: "manualRate", messageKey: "errors.rateRequired" });
  }

  return errors;
};

const parsePair = (pair: CurrencyPair): [string, string] => {
  const [foreign, base] = pair.split("-") as [string, string];
  return [foreign, base];
};

type ConversionContext = {
  amount: number;
  direction: "buy" | "sell";
  foreignCurrency: string;
  baseCurrency: string;
};

const applyBrapiQuote = (
  ctx: ConversionContext,
  quote: BrapiCurrencyQuote,
): ConversorMoedaResult => {
  const { bid, ask } = quote;
  const isBuy = ctx.direction === "buy";
  const rate = isBuy ? ask : bid;
  const convertedAmount = isBuy ? ctx.amount / ask : ctx.amount * bid;
  return {
    convertedAmount,
    rate,
    bid,
    ask,
    pctChange: quote.pctChange,
    source: "brapi",
    fromCurrency: isBuy ? ctx.baseCurrency : ctx.foreignCurrency,
    toCurrency: isBuy ? ctx.foreignCurrency : ctx.baseCurrency,
  };
};

const applyManualRate = (
  ctx: ConversionContext,
  manualRate: number,
): ConversorMoedaResult => {
  const isBuy = ctx.direction === "buy";
  const convertedAmount = isBuy ? ctx.amount / manualRate : ctx.amount * manualRate;
  return {
    convertedAmount,
    rate: manualRate,
    bid: manualRate,
    ask: manualRate,
    pctChange: 0,
    source: "manual",
    fromCurrency: isBuy ? ctx.baseCurrency : ctx.foreignCurrency,
    toCurrency: isBuy ? ctx.foreignCurrency : ctx.baseCurrency,
  };
};

export const calculateConversorMoeda = (
  form: ConversorMoedaFormState,
  brapiQuote: BrapiCurrencyQuote | null | undefined,
): ConversorMoedaResult => {
  const [foreignCurrency, baseCurrency] = parsePair(form.pair);
  const ctx: ConversionContext = {
    amount: form.amount ?? 0,
    direction: form.direction,
    foreignCurrency,
    baseCurrency,
  };

  if (brapiQuote) {
    return applyBrapiQuote(ctx, brapiQuote);
  }

  return applyManualRate(ctx, form.manualRate ?? 1);
};
