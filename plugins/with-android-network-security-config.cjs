const fs = require("node:fs/promises");
const path = require("node:path");

const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");

const NETWORK_SECURITY_RESOURCE = "@xml/network_security_config";

const applyNetworkSecurityConfigToManifest = (androidManifest) => {
  const application = androidManifest.manifest.application?.[0];
  if (!application?.$) {
    throw new Error("AndroidManifest application node is missing");
  }

  application.$["android:networkSecurityConfig"] = NETWORK_SECURITY_RESOURCE;
  application.$["android:usesCleartextTraffic"] = "false";
  return androidManifest;
};

const copyNetworkSecurityConfig = async ({ platformProjectRoot, projectRoot }) => {
  const source = path.join(projectRoot, "assets/network-security-config.xml");
  const targetDirectory = path.join(platformProjectRoot, "app/src/main/res/xml");
  const target = path.join(targetDirectory, "network_security_config.xml");

  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.copyFile(source, target);
  return target;
};

const withAndroidNetworkSecurityConfig = (config) => {
  config = withAndroidManifest(config, (manifestConfig) => {
    manifestConfig.modResults = applyNetworkSecurityConfigToManifest(manifestConfig.modResults);
    return manifestConfig;
  });

  return withDangerousMod(config, [
    "android",
    async (dangerousConfig) => {
      await copyNetworkSecurityConfig(dangerousConfig.modRequest);
      return dangerousConfig;
    },
  ]);
};

module.exports = withAndroidNetworkSecurityConfig;
module.exports.applyNetworkSecurityConfigToManifest = applyNetworkSecurityConfigToManifest;
module.exports.copyNetworkSecurityConfig = copyNetworkSecurityConfig;
module.exports.NETWORK_SECURITY_RESOURCE = NETWORK_SECURITY_RESOURCE;
