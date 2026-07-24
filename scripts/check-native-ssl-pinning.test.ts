interface NativePinningCheckModule {
  readonly validateLivePins: (
    configuredPins: readonly string[],
    livePins: readonly string[],
  ) => void;
  readonly validateStaticConfig: (
    config: {
      readonly iosCaPins: readonly string[];
      readonly iosLeafPins: readonly string[];
      readonly androidPins: readonly string[];
      readonly androidExpiration: string;
      readonly androidIncludesSubdomains: string;
    },
    now?: number,
  ) => readonly string[];
}

const { validateLivePins, validateStaticConfig } =
  jest.requireActual<NativePinningCheckModule>("./check-native-ssl-pinning.cjs");

const NOW = Date.parse("2026-07-24T00:00:00Z");
const PINS = ["pin-current", "pin-backup"];

describe("check-native-ssl-pinning", () => {
  it("accepts aligned redundant CA pins with a safe expiration", () => {
    expect(
      validateStaticConfig(
        {
          iosCaPins: PINS,
          iosLeafPins: [],
          androidPins: PINS,
          androidExpiration: "2028-08-01",
          androidIncludesSubdomains: "false",
        },
        NOW,
      ),
    ).toEqual(PINS);
  });

  it("rejects short-lived iOS leaf pins", () => {
    expect(() =>
      validateStaticConfig(
        {
          iosCaPins: PINS,
          iosLeafPins: ["leaf"],
          androidPins: PINS,
          androidExpiration: "2028-08-01",
          androidIncludesSubdomains: "false",
        },
        NOW,
      ),
    ).toThrow("iOS leaf pins are forbidden");
  });

  it("rejects divergent native pin sets", () => {
    expect(() =>
      validateStaticConfig(
        {
          iosCaPins: PINS,
          iosLeafPins: [],
          androidPins: ["pin-current", "other"],
          androidExpiration: "2028-08-01",
          androidIncludesSubdomains: "false",
        },
        NOW,
      ),
    ).toThrow("iOS and Android pin sets are not aligned");
  });

  it("rejects expiration windows shorter than 30 days", () => {
    expect(() =>
      validateStaticConfig(
        {
          iosCaPins: PINS,
          iosLeafPins: [],
          androidPins: PINS,
          androidExpiration: "2026-08-01",
          androidIncludesSubdomains: "false",
        },
        NOW,
      ),
    ).toThrow("expires in less than 30 days");
  });

  it("rejects pinning that expands to API subdomains", () => {
    expect(() =>
      validateStaticConfig(
        {
          iosCaPins: PINS,
          iosLeafPins: [],
          androidPins: PINS,
          androidExpiration: "2028-08-01",
          androidIncludesSubdomains: "true",
        },
        NOW,
      ),
    ).toThrow("must not include subdomains");
  });

  it("requires every configured CA pin in the live chain", () => {
    expect(() => validateLivePins(PINS, ["pin-current"])).toThrow("1 configured pin(s) are absent");
    expect(() => validateLivePins(PINS, [...PINS, "leaf"])).not.toThrow();
  });
});
