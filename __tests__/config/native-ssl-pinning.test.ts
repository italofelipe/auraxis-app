import fs from "node:fs";
import path from "node:path";

import appConfig from "@/app.json";

const API_HOST = "api.auraxis.com.br";
const PIN_CURRENT = "6ZqZa5LRfTimLYEkGrZ9Pja4ku36AtNGVJ9NbD13GgI=";
const PIN_BACKUP = "y7xVm0TVJNahMr2sZydE2jQH8SquXV9yLF9seROHHHU=";
const ANDROID_PIN_EXPIRATION = "2026-08-01";

const extractSpkiPins = (
  identities: readonly Record<string, unknown>[] | undefined,
): readonly string[] => {
  return (identities ?? [])
    .map((identity) => identity["SPKI-SHA256-BASE64"])
    .filter((value): value is string => typeof value === "string");
};

describe("native SSL pinning config", () => {
  it("pins the iOS API host with a current leaf and backup CA SPKI", () => {
    const ats = appConfig.expo.ios.infoPlist.NSAppTransportSecurity;
    const pinnedDomain = ats.NSPinnedDomains[API_HOST];

    expect(ats.NSAllowsArbitraryLoads).toBe(false);
    expect(pinnedDomain.NSIncludesSubdomains).toBe(false);
    expect(extractSpkiPins(pinnedDomain.NSPinnedLeafIdentities)).toEqual([
      PIN_CURRENT,
    ]);
    expect(extractSpkiPins(pinnedDomain.NSPinnedCAIdentities)).toEqual([
      PIN_BACKUP,
    ]);
  });

  it("pins the Android API host with the same current and backup SPKI", () => {
    const xml = fs.readFileSync(
      path.join(process.cwd(), "assets/network-security-config.xml"),
      "utf8",
    );

    expect(xml).toContain("<domain>api.auraxis.com.br</domain>");
    expect(xml).toContain(
      `<pin-set expiration="${ANDROID_PIN_EXPIRATION}">`,
    );
    expect(xml).toContain(`<pin digest="SHA-256">${PIN_CURRENT}</pin>`);
    expect(xml).toContain(`<pin digest="SHA-256">${PIN_BACKUP}</pin>`);
    expect(xml).toContain("<base-config cleartextTrafficPermitted=\"false\">");
    expect(xml).toContain("<certificates src=\"system\" />");
  });
});
