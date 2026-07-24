import fs from "node:fs";
import os from "node:os";
import path from "node:path";

interface NetworkSecurityPluginModule {
  readonly NETWORK_SECURITY_RESOURCE: string;
  readonly applyNetworkSecurityConfigToManifest: (
    manifest: AndroidManifestFixture,
  ) => AndroidManifestFixture;
  readonly copyNetworkSecurityConfig: (request: {
    readonly platformProjectRoot: string;
    readonly projectRoot: string;
  }) => Promise<string>;
}

interface AndroidManifestFixture {
  readonly manifest: {
    readonly application: readonly [
      {
        readonly $: Record<string, string>;
      },
    ];
  };
}

const {
  NETWORK_SECURITY_RESOURCE,
  applyNetworkSecurityConfigToManifest,
  copyNetworkSecurityConfig,
} = jest.requireActual<NetworkSecurityPluginModule>(
  "../../plugins/with-android-network-security-config.cjs",
);

describe("withAndroidNetworkSecurityConfig", () => {
  it("references the native resource and blocks cleartext traffic", () => {
    const manifest: AndroidManifestFixture = {
      manifest: {
        application: [{ $: {} }],
      },
    };

    const result = applyNetworkSecurityConfigToManifest(manifest);

    expect(result.manifest.application[0].$).toEqual({
      "android:networkSecurityConfig": NETWORK_SECURITY_RESOURCE,
      "android:usesCleartextTraffic": "false",
    });
  });

  it("copies the canonical XML into the generated Android project", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "auraxis-pins-"));
    const projectRoot = path.join(root, "project");
    const platformProjectRoot = path.join(root, "android");
    const sourceDirectory = path.join(projectRoot, "assets");
    fs.mkdirSync(sourceDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(sourceDirectory, "network-security-config.xml"),
      "<network-security-config />",
    );

    const target = await copyNetworkSecurityConfig({
      platformProjectRoot,
      projectRoot,
    });

    expect(target).toBe(
      path.join(
        platformProjectRoot,
        "app/src/main/res/xml/network_security_config.xml",
      ),
    );
    expect(fs.readFileSync(target, "utf8")).toBe(
      "<network-security-config />",
    );
  });
});
