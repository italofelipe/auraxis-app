import {
  centsInputToAmountString,
  formatCurrencyInput,
  parseCurrencyCentsInput,
  safeFormatCurrency,
  serializeAmount,
} from "@/shared/utils/currency";

describe("parseCurrencyCentsInput", () => {
  it("fills right-to-left as cents while typing 1,2,0,2,5", () => {
    expect(parseCurrencyCentsInput("1")).toBe(0.01);
    expect(parseCurrencyCentsInput("12")).toBe(0.12);
    expect(parseCurrencyCentsInput("120")).toBe(1.2);
    expect(parseCurrencyCentsInput("1202")).toBe(12.02);
    expect(parseCurrencyCentsInput("12025")).toBe(120.25);
  });

  it("ignores non-digit characters (mask glyphs, separators)", () => {
    expect(parseCurrencyCentsInput("R$ 120,25")).toBe(120.25);
    expect(parseCurrencyCentsInput("1.202,50")).toBe(1202.5);
  });

  it("returns null when there are no digits", () => {
    expect(parseCurrencyCentsInput("")).toBeNull();
    expect(parseCurrencyCentsInput("R$")).toBeNull();
    expect(parseCurrencyCentsInput("abc")).toBeNull();
  });
});

describe("formatCurrencyInput", () => {
  it("formats a number as pt-BR with two decimals and no symbol", () => {
    expect(formatCurrencyInput(120.25)).toBe("120,25");
    expect(formatCurrencyInput(1.2)).toBe("1,20");
    expect(formatCurrencyInput(0.01)).toBe("0,01");
  });

  it("returns an empty string for null or non-finite values (no NaN)", () => {
    expect(formatCurrencyInput(null)).toBe("");
    expect(formatCurrencyInput(Number.NaN)).toBe("");
    expect(formatCurrencyInput(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("centsInputToAmountString", () => {
  it("produces the canonical decimal string the API expects", () => {
    expect(centsInputToAmountString("12025")).toBe("120.25");
    expect(centsInputToAmountString("120")).toBe("1.20");
  });

  it("returns an empty string when nothing parseable was typed", () => {
    expect(centsInputToAmountString("")).toBe("");
    expect(centsInputToAmountString("R$ ,")).toBe("");
  });
});

describe("serializeAmount", () => {
  it("turns a numeric amount into the canonical decimal string for the API", () => {
    expect(serializeAmount(120.25)).toBe("120.25");
    expect(serializeAmount(1.2)).toBe("1.20");
    expect(serializeAmount(0)).toBe("0.00");
    expect(serializeAmount(1000)).toBe("1000.00");
  });

  it("rounds to two fractional digits (half-up)", () => {
    expect(serializeAmount(33.333333)).toBe("33.33");
    expect(serializeAmount(33.335)).toBe("33.34");
  });

  it("falls back to 0.00 for non-finite values (no NaN)", () => {
    expect(serializeAmount(Number.NaN)).toBe("0.00");
    expect(serializeAmount(Number.POSITIVE_INFINITY)).toBe("0.00");
    expect(serializeAmount(Number.NEGATIVE_INFINITY)).toBe("0.00");
  });
});

describe("safeFormatCurrency", () => {
  it("never renders NaN for empty/invalid input", () => {
    expect(safeFormatCurrency("")).not.toContain("NaN");
    expect(safeFormatCurrency(undefined)).not.toContain("NaN");
    expect(safeFormatCurrency(null)).not.toContain("NaN");
    expect(safeFormatCurrency("abc")).not.toContain("NaN");
  });

  it("formats finite numbers and numeric strings as BRL currency", () => {
    expect(safeFormatCurrency(120.25)).toContain("120,25");
    expect(safeFormatCurrency("120.25")).toContain("120,25");
  });
});
