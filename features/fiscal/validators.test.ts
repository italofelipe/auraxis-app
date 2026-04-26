import {
  createReceivableSchema,
  markReceivableReceivedSchema,
  normalizeAmount,
} from "@/features/fiscal/validators";

describe("createReceivableSchema", () => {
  const valid = {
    description: "NF 123",
    amount: "1500.00",
    expectedDate: "2026-05-01",
  };

  it("aceita payload minimo", () => {
    expect(() => createReceivableSchema.parse(valid)).not.toThrow();
  });

  it("rejeita amount zero", () => {
    expect(() => createReceivableSchema.parse({ ...valid, amount: "0" })).toThrow();
  });

  it("rejeita description curta", () => {
    expect(() => createReceivableSchema.parse({ ...valid, description: "X" })).toThrow();
  });

  it("rejeita expectedDate invalida", () => {
    expect(() =>
      createReceivableSchema.parse({ ...valid, expectedDate: "invalida" }),
    ).toThrow();
  });
});

describe("markReceivableReceivedSchema", () => {
  it("aceita receivedDate sem amount", () => {
    expect(() =>
      markReceivableReceivedSchema.parse({ receivedDate: "2026-05-10" }),
    ).not.toThrow();
  });

  it("aceita receivedDate com receivedAmount", () => {
    expect(() =>
      markReceivableReceivedSchema.parse({
        receivedDate: "2026-05-10",
        receivedAmount: "1500.00",
      }),
    ).not.toThrow();
  });

  it("rejeita receivedAmount zero", () => {
    expect(() =>
      markReceivableReceivedSchema.parse({
        receivedDate: "2026-05-10",
        receivedAmount: "0",
      }),
    ).toThrow();
  });
});

describe("normalizeAmount", () => {
  it("converte BRL para US", () => {
    expect(normalizeAmount("1.500,75")).toBe("1500.75");
  });

  it("aceita US direto", () => {
    expect(normalizeAmount("1500.75")).toBe("1500.75");
  });
});
