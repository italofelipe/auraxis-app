import type { InsightSign } from "@/features/insights/fluida/contracts";
import {
  formatSignedAmount,
  resolveSignColorToken,
} from "@/features/insights/fluida/sign";
import { formatCurrency } from "@/shared/utils/formatters";

// The canonical BRL formatter inserts a non-breaking space (U+00A0) between
// "R$" and the digits, so expectations are built from it rather than typed
// literals to avoid a brittle whitespace mismatch.

describe("insight sign → colour mapping", () => {
  it("maps a positive sign to the success token", () => {
    expect(resolveSignColorToken("pos")).toBe("$success");
  });

  it("maps a negative sign to the danger token", () => {
    expect(resolveSignColorToken("neg")).toBe("$danger");
  });

  it("maps a neutral sign to the muted token", () => {
    expect(resolveSignColorToken("neutral")).toBe("$muted");
  });

  it("returns a token for every sign", () => {
    const signs: readonly InsightSign[] = ["pos", "neg", "neutral"];
    signs.forEach((sign) => {
      expect(resolveSignColorToken(sign)).toMatch(/^\$/);
    });
  });
});

describe("formatSignedAmount", () => {
  it("prefixes a positive sign with '+' and the BRL amount of the magnitude", () => {
    expect(formatSignedAmount(9800, "pos")).toBe(`+ ${formatCurrency(9800)}`);
  });

  it("prefixes a negative sign with the typographic minus and the magnitude", () => {
    expect(formatSignedAmount(-156.3, "neg")).toBe(`− ${formatCurrency(156.3)}`);
  });

  it("uses the sign, not the numeric value, to choose the prefix", () => {
    // A 'neg' card may carry an already-negative amount; we still take the
    // magnitude so the prefix is driven solely by the sign.
    expect(formatSignedAmount(-11950, "neg")).toBe(`− ${formatCurrency(11950)}`);
  });

  it("renders a neutral amount without any sign prefix", () => {
    expect(formatSignedAmount(0, "neutral")).toBe(formatCurrency(0));
  });
});
