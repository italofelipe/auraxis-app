import {
  centsInputToAmountString,
  formatCurrencyInput,
  parseCurrencyCentsInput,
  safeFormatCurrency,
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
