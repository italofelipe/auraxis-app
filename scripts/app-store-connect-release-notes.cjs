#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");

const APP_STORE_CONNECT_API_ROOT = "https://api.appstoreconnect.apple.com/v1";
const DEFAULT_MAX_ATTEMPTS = 40;
const DEFAULT_POLL_INTERVAL_MS = 30_000;

const encodeJson = (value) => {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
};

const createAppStoreConnectToken = ({
  issuerId,
  keyId,
  now = Date.now(),
  privateKey,
}) => {
  const issuedAt = Math.floor(now / 1000);
  const header = encodeJson({ alg: "ES256", kid: keyId, typ: "JWT" });
  const payload = encodeJson({
    aud: "appstoreconnect-v1",
    exp: issuedAt + 20 * 60,
    iat: issuedAt,
    iss: issuerId,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto.sign("sha256", Buffer.from(unsignedToken), {
    dsaEncoding: "ieee-p1363",
    key: privateKey,
  });

  return `${unsignedToken}.${signature.toString("base64url")}`;
};

const appStoreRequest = async ({
  accessToken,
  body,
  fetchImpl = fetch,
  method = "GET",
  path,
}) => {
  const response = await fetchImpl(`${APP_STORE_CONNECT_API_ROOT}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`App Store Connect ${method} ${path} failed (${response.status}): ${details}`);
  }

  if (response.status === 204) {
    return {};
  }

  return response.json();
};

const findBuildId = async ({
  accessToken,
  appId,
  buildNumber,
  fetchImpl = fetch,
}) => {
  const search = new URLSearchParams({
    "filter[app]": appId,
    "filter[version]": String(buildNumber),
    limit: "1",
    sort: "-uploadedDate",
  });
  const response = await appStoreRequest({
    accessToken,
    fetchImpl,
    path: `/builds?${search.toString()}`,
  });

  return response.data?.[0]?.id ?? null;
};

const upsertBetaBuildLocalization = async ({
  accessToken,
  buildId,
  fetchImpl = fetch,
  locale,
  releaseNotes,
}) => {
  const existing = await appStoreRequest({
    accessToken,
    fetchImpl,
    path: `/builds/${buildId}/betaBuildLocalizations`,
  });
  const localization = existing.data?.find((entry) => entry.attributes?.locale === locale);

  if (localization) {
    await appStoreRequest({
      accessToken,
      body: {
        data: {
          attributes: { whatsNew: releaseNotes },
          id: localization.id,
          type: "betaBuildLocalizations",
        },
      },
      fetchImpl,
      method: "PATCH",
      path: `/betaBuildLocalizations/${localization.id}`,
    });
    return localization.id;
  }

  const created = await appStoreRequest({
    accessToken,
    body: {
      data: {
        attributes: { locale, whatsNew: releaseNotes },
        relationships: {
          build: {
            data: { id: buildId, type: "builds" },
          },
        },
        type: "betaBuildLocalizations",
      },
    },
    fetchImpl,
    method: "POST",
    path: "/betaBuildLocalizations",
  });
  return created.data?.id ?? null;
};

const publishTestFlightReleaseNotes = async ({
  accessToken,
  appId,
  buildNumber,
  fetchImpl = fetch,
  locale = "pt-BR",
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  releaseNotes,
  sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration)),
}) => {
  let buildId = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    buildId = await findBuildId({
      accessToken,
      appId,
      buildNumber,
      fetchImpl,
    });
    if (buildId) {
      break;
    }
    if (attempt < maxAttempts) {
      await sleep(pollIntervalMs);
    }
  }

  if (!buildId) {
    throw new Error(
      `TestFlight build ${buildNumber} was not visible after ${maxAttempts} attempts`,
    );
  }

  await upsertBetaBuildLocalization({
    accessToken,
    buildId,
    fetchImpl,
    locale,
    releaseNotes,
  });
  return buildId;
};

const parseArguments = (argv) => {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    values[argv[index].replace(/^--/u, "")] = argv[index + 1];
  }
  return values;
};

const decodePrivateKey = (encodedKey) => {
  return Buffer.from(encodedKey, "base64").toString("utf8").replaceAll("\\n", "\n");
};

const run = async () => {
  const args = parseArguments(process.argv.slice(2));
  const metadata = JSON.parse(fs.readFileSync(args["metadata-file"], "utf8"));
  const privateKey = decodePrivateKey(process.env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64);
  const accessToken = createAppStoreConnectToken({
    issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID,
    keyId: process.env.APP_STORE_CONNECT_KEY_ID,
    privateKey,
  });

  const buildId = await publishTestFlightReleaseNotes({
    accessToken,
    appId: args["app-id"],
    buildNumber: args["build-number"],
    releaseNotes: metadata.releaseNotes,
  });
  process.stdout.write(
    `TestFlight build ${args["build-number"]} (${buildId}) updated with pt-BR release notes.\n`,
  );
};

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`[app-store-connect-release-notes] ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  APP_STORE_CONNECT_API_ROOT,
  appStoreRequest,
  createAppStoreConnectToken,
  findBuildId,
  publishTestFlightReleaseNotes,
  upsertBetaBuildLocalization,
};
