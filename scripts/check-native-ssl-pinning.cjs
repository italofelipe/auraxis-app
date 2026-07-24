#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const tls = require("node:tls");

const API_HOST = "api.auraxis.com.br";
const MINIMUM_PIN_COUNT = 2;
const MINIMUM_EXPIRATION_LEEWAY_MS = 30 * 24 * 60 * 60 * 1000;

const readNativePinningConfig = (rootDir = process.cwd()) => {
  const appJson = JSON.parse(fs.readFileSync(path.join(rootDir, "app.json"), "utf8"));
  const pinnedDomain =
    appJson.expo?.ios?.infoPlist?.NSAppTransportSecurity?.NSPinnedDomains?.[API_HOST];
  if (!pinnedDomain) {
    throw new Error(`iOS pinning config is missing for ${API_HOST}`);
  }

  const androidXml = fs.readFileSync(
    path.join(rootDir, "assets/network-security-config.xml"),
    "utf8",
  );
  const androidExpiration = androidXml.match(/<pin-set expiration="([^"]+)">/u)?.[1];
  const androidIncludesSubdomains = androidXml.match(
    /<domain includeSubdomains="([^"]+)">api\.auraxis\.com\.br<\/domain>/u,
  )?.[1];
  if (!androidExpiration) {
    throw new Error("Android pin-set expiration is missing");
  }
  if (!androidIncludesSubdomains) {
    throw new Error("Android domain includeSubdomains policy is missing");
  }

  return {
    iosCaPins: (pinnedDomain.NSPinnedCAIdentities ?? []).map(
      (identity) => identity["SPKI-SHA256-BASE64"],
    ),
    iosLeafPins: (pinnedDomain.NSPinnedLeafIdentities ?? []).map(
      (identity) => identity["SPKI-SHA256-BASE64"],
    ),
    androidPins: Array.from(
      androidXml.matchAll(/<pin digest="SHA-256">([^<]+)<\/pin>/gu),
      (match) => match[1],
    ),
    androidExpiration,
    androidIncludesSubdomains,
  };
};

const validateStaticConfig = (config, now = Date.now()) => {
  if (config.iosLeafPins.length > 0) {
    throw new Error(
      "iOS leaf pins are forbidden because the production leaf rotates every 90 days",
    );
  }

  const distinctIosPins = [...new Set(config.iosCaPins)];
  if (distinctIosPins.length < MINIMUM_PIN_COUNT) {
    throw new Error(`iOS requires at least ${MINIMUM_PIN_COUNT} distinct CA pins`);
  }

  if (JSON.stringify(config.iosCaPins) !== JSON.stringify(config.androidPins)) {
    throw new Error("iOS and Android pin sets are not aligned");
  }
  if (config.androidIncludesSubdomains !== "false") {
    throw new Error("Android pinning must not include subdomains");
  }

  const expirationTimestamp = Date.parse(`${config.androidExpiration}T00:00:00Z`);
  if (!Number.isFinite(expirationTimestamp)) {
    throw new Error("Android pin-set expiration is invalid");
  }
  if (expirationTimestamp - now < MINIMUM_EXPIRATION_LEEWAY_MS) {
    throw new Error("Android pin-set expires in less than 30 days");
  }

  return distinctIosPins;
};

const toSpkiPin = (rawCertificate) => {
  const certificate = new crypto.X509Certificate(rawCertificate);
  const publicKey = certificate.publicKey.export({
    format: "der",
    type: "spki",
  });
  return crypto.createHash("sha256").update(publicKey).digest("base64");
};

const readLiveChainPins = (host = API_HOST, connect = tls.connect) => {
  return new Promise((resolve, reject) => {
    const socket = connect(
      {
        host,
        port: 443,
        rejectUnauthorized: true,
        servername: host,
      },
      () => {
        const pins = [];
        const seenFingerprints = new Set();
        let certificate = socket.getPeerCertificate(true);

        while (certificate?.raw) {
          const fingerprint = certificate.fingerprint256 ?? toSpkiPin(certificate.raw);
          if (seenFingerprints.has(fingerprint)) {
            break;
          }
          seenFingerprints.add(fingerprint);
          pins.push(toSpkiPin(certificate.raw));

          if (!certificate.issuerCertificate || certificate.issuerCertificate === certificate) {
            break;
          }
          certificate = certificate.issuerCertificate;
        }

        socket.end();
        resolve(pins);
      },
    );

    socket.setTimeout(10_000, () => {
      socket.destroy(new Error(`TLS probe timed out for ${host}`));
    });
    socket.once("error", reject);
  });
};

const validateLivePins = (configuredPins, livePins) => {
  const missingPins = configuredPins.filter((pin) => !livePins.includes(pin));
  if (missingPins.length > 0) {
    throw new Error(`${missingPins.length} configured pin(s) are absent from the live TLS chain`);
  }
};

const run = async () => {
  const config = readNativePinningConfig();
  const configuredPins = validateStaticConfig(config);
  const livePins = await readLiveChainPins();
  validateLivePins(configuredPins, livePins);

  process.stdout.write(
    [
      `[ssl-pinning] ${API_HOST}: OK`,
      `[ssl-pinning] ${configuredPins.length} CA pins aligned on iOS/Android`,
      `[ssl-pinning] Android expiration: ${config.androidExpiration}`,
      `[ssl-pinning] Live chain matches every configured pin`,
    ].join("\n") + "\n",
  );
};

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`[ssl-pinning] ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  API_HOST,
  readLiveChainPins,
  readNativePinningConfig,
  toSpkiPin,
  validateLivePins,
  validateStaticConfig,
};
