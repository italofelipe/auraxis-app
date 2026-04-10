import {
  sanitizeTelemetryContext,
  sanitizeTelemetryValue,
} from "@/core/telemetry/sanitization";

describe("sanitizeTelemetryValue", () => {
  it("sanitiza urls, erros, arrays e objetos arbitrarios", () => {
    expect(
      sanitizeTelemetryValue({
        token: "secret-token",
        url: "auraxisapp://assinatura?token=secret&status=paid",
        error: new Error("boom"),
        array: ["safe", "auraxisapp://login?token=secret"],
        arbitraryObject: Symbol("custom-object"),
      }),
    ).toEqual({
      token: "<redacted>",
      url: "auraxisapp://assinatura?token=%3Credacted%3E&status=paid",
      error: {
        name: "Error",
        message: "boom",
      },
      array: ["safe", "auraxisapp://login?token=%3Credacted%3E"],
      arbitraryObject: "Symbol(custom-object)",
    });
  });

  it("trunca profundidade excessiva e strings muito longas", () => {
    const veryLongString = "a".repeat(305);

    expect(sanitizeTelemetryValue(veryLongString)).toBe(`${"a".repeat(300)}…`);
    expect(
      sanitizeTelemetryValue({
        nested: {
          level1: {
            level2: {
              level3: {
                level4: "too-deep",
              },
            },
          },
        },
      }),
    ).toEqual({
      nested: {
        level1: {
          level2: {
            level3: "[truncated]",
          },
        },
      },
    });
  });

  it("preserva tipos primitivos e contexto vazio", () => {
    expect(sanitizeTelemetryValue(42)).toBe(42);
    expect(sanitizeTelemetryValue(true)).toBe(true);
    expect(sanitizeTelemetryValue(null)).toBeNull();
    expect(sanitizeTelemetryValue(undefined)).toBeUndefined();
    expect(sanitizeTelemetryContext(undefined)).toBeUndefined();
  });

  it("nao redige chaves operacionais inocentes por falso positivo de substring", () => {
    expect(
      sanitizeTelemetryValue({
        appOwnership: "standalone",
        relationship: "owner",
      }),
    ).toEqual({
      appOwnership: "standalone",
      relationship: "owner",
    });
  });
});
