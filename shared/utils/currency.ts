import { formatCurrency } from "@/shared/utils/formatters";

const inputFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Parses Brazilian POS-style currency entry: every typed digit shifts the
 * amount in cents (right-to-left). Non-digit characters are ignored, so the
 * masked display string round-trips safely.
 *
 * @param raw Raw text from the field (may include `R$`, separators, spaces).
 * @returns Finite BRL amount, or `null` when no digits were typed.
 */
export const parseCurrencyCentsInput = (raw: string): number | null => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) {
    return null;
  }
  const value = Number(digits) / 100;
  return Number.isFinite(value) ? value : null;
};

/**
 * Formats a numeric amount for display inside the money input: pt-BR with two
 * decimals and no currency symbol. NaN-safe — returns "" for null/non-finite.
 *
 * @param value Numeric amount, or null.
 * @returns Masked display string, or "" when there is nothing to show.
 */
export const formatCurrencyInput = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }
  return inputFormatter.format(value);
};

/**
 * Converts cents-style entry into the canonical decimal string the API and
 * Zod validators expect (e.g. `"120.25"`).
 *
 * @param raw Raw text from the field.
 * @returns Decimal string with two fractional digits, or "" when empty.
 */
export const centsInputToAmountString = (raw: string): string => {
  const value = parseCurrencyCentsInput(raw);
  return value === null ? "" : value.toFixed(2);
};

/**
 * Formats any persisted/display value as BRL currency without ever rendering
 * `NaN`. Accepts numbers, numeric strings (`"120.25"`), null or undefined.
 *
 * @param value Raw value to format.
 * @returns BRL currency string; falls back to `R$ 0,00` for invalid input.
 */
export const safeFormatCurrency = (
  value: number | string | null | undefined,
): string => {
  const numeric = typeof value === "number" ? value : Number(value);
  return formatCurrency(Number.isFinite(numeric) ? numeric : 0);
};
