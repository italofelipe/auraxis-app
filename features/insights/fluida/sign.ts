import type { InsightSign } from "@/features/insights/fluida/contracts";
import { formatCurrency } from "@/shared/utils/formatters";

/** Typographic minus (U+2212), matching the transaction feed convention. */
const MINUS_SIGN = "−";

/**
 * Tamagui colour token for a comparative figure, keyed by its
 * {@link InsightSign}. `pos` reuses the success token (green), `neg` the
 * danger token (red) and `neutral` the muted token — all semantic, so
 * light/dark resolve automatically and nothing is hardcoded at the call site.
 */
const SIGN_COLOR_TOKENS: Record<InsightSign, `$${string}`> = {
  pos: "$success",
  neg: "$danger",
  neutral: "$muted",
};

/**
 * Resolves the colour token used to tint a signed value (compare card value,
 * peak label, etc.).
 *
 * @param sign Direction of the figure.
 * @returns The matching Tamagui colour token.
 */
export const resolveSignColorToken = (sign: InsightSign): `$${string}` => {
  return SIGN_COLOR_TOKENS[sign];
};

/**
 * Formats a BRL amount with an explicit sign prefix driven by the
 * {@link InsightSign}, not by the numeric value. `pos` gets "+ ", `neg` the
 * typographic minus "− " and the magnitude formatted as BRL; `neutral`
 * renders the magnitude with no prefix. The magnitude is always taken so a
 * card tagged `neg` with an already-negative amount still reads "− R$ …".
 *
 * @param value Raw BRL amount (its own sign is ignored).
 * @param sign Direction that drives the prefix and colour.
 * @returns Signed BRL string, e.g. "+ R$ 9.800,00" or "− R$ 156,30".
 */
export const formatSignedAmount = (value: number, sign: InsightSign): string => {
  const amount = formatCurrency(Math.abs(value));
  if (sign === "pos") {
    return `+ ${amount}`;
  }
  if (sign === "neg") {
    return `${MINUS_SIGN} ${amount}`;
  }
  return amount;
};
