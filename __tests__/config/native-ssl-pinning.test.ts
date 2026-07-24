import fs from "node:fs";
import path from "node:path";

const EXPECTED_CA_PINS = [
  "s/tdAOmUzd8syaTuqfgGvFcn6DzA5Cmb+Vby1ST+U3Y=",
  "sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=",
];

interface PinIdentity {
  readonly "SPKI-SHA256-BASE64": string;
}

interface PinnedDomain {
  readonly NSPinnedLeafIdentities?: readonly PinIdentity[];
  readonly NSPinnedCAIdentities?: readonly PinIdentity[];
}

const readAppJson = (): {
  readonly expo: {
    readonly android: {
      readonly networkSecurityConfig?: string;
    };
    readonly ios: {
      readonly infoPlist: {
        readonly NSAppTransportSecurity: {
          readonly NSPinnedDomains: {
            readonly "api.auraxis.com.br": PinnedDomain;
          };
        };
      };
    };
    readonly plugins: readonly unknown[];
  };
} => {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "app.json"), "utf8")) as ReturnType<
    typeof readAppJson
  >;
};

const readAndroidPins = (): {
  readonly expiration: string;
  readonly includesSubdomains: string;
  readonly pins: readonly string[];
} => {
  const xml = fs.readFileSync(
    path.resolve(process.cwd(), "assets/network-security-config.xml"),
    "utf8",
  );
  const expiration = xml.match(/<pin-set expiration="([^"]+)">/u)?.[1];
  const includesSubdomains = xml.match(
    /<domain includeSubdomains="([^"]+)">api\.auraxis\.com\.br<\/domain>/u,
  )?.[1];
  const pins = Array.from(
    xml.matchAll(/<pin digest="SHA-256">([^<]+)<\/pin>/gu),
    (match) => match[1],
  );

  if (!expiration) {
    throw new Error("Android pin-set expiration is missing");
  }
  if (!includesSubdomains) {
    throw new Error("Android domain includeSubdomains policy is missing");
  }

  return { expiration, includesSubdomains, pins };
};

describe("native SSL pinning configuration", () => {
  it("uses redundant CA pins on iOS without a short-lived leaf requirement", () => {
    const domain =
      readAppJson().expo.ios.infoPlist.NSAppTransportSecurity.NSPinnedDomains["api.auraxis.com.br"];

    expect(domain.NSPinnedLeafIdentities).toBeUndefined();
    expect(domain.NSPinnedCAIdentities?.map((identity) => identity["SPKI-SHA256-BASE64"])).toEqual(
      EXPECTED_CA_PINS,
    );
  });

  it("keeps Android aligned with the same CA pins and rotation window", () => {
    const android = readAndroidPins();

    expect(android.pins).toEqual(EXPECTED_CA_PINS);
    expect(android.expiration).toBe("2028-08-01");
    expect(android.includesSubdomains).toBe("false");
  });

  it("wires the Android XML through the native Expo config plugin", () => {
    const appJson = readAppJson();

    expect(appJson.expo.plugins).toContain("./plugins/with-android-network-security-config.cjs");
    expect(appJson.expo.android.networkSecurityConfig).toBeUndefined();
  });
});
