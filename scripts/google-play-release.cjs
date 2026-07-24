#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const GOOGLE_API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const encodeBase64Url = (value) => {
  return Buffer.from(value).toString("base64url");
};

const createServiceAccountAssertion = ({ credentials, now = Date.now() }) => {
  const issuedAt = Math.floor(now / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      aud: GOOGLE_TOKEN_URL,
      exp: issuedAt + 3600,
      iat: issuedAt,
      iss: credentials.client_email,
      scope: ANDROID_PUBLISHER_SCOPE,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsignedToken), credentials.private_key);
  return `${unsignedToken}.${signature.toString("base64url")}`;
};

const requestAccessToken = async ({ credentials, fetchImpl = fetch }) => {
  const assertion = createServiceAccountAssertion({ credentials });
  const body = new URLSearchParams({
    assertion,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  });
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Google OAuth failed (${response.status})`);
  }

  const token = await response.json();
  return token.access_token;
};

const googleRequest = async ({ accessToken, body, fetchImpl, method = "GET", url }) => {
  const response = await fetchImpl(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Play API ${method} failed (${response.status}): ${details}`);
  }

  if (response.status === 204) {
    return {};
  }

  return response.json();
};

const updateRelease = ({ release, releaseNotes, version, versionCode }) => {
  return {
    ...release,
    name: `${version} (${versionCode})`,
    releaseNotes: [
      {
        language: "pt-BR",
        text: releaseNotes,
      },
    ],
    status: "completed",
  };
};

const updateTrackForVersion = ({ track, releaseNotes, version, versionCode }) => {
  const trackReleases = track.releases ?? [];
  const matchingIndexes = trackReleases
    .map((release, index) => (release.versionCodes?.includes(String(versionCode)) ? index : -1))
    .filter((index) => index >= 0);

  if (matchingIndexes.length !== 1) {
    throw new Error(
      `Expected one ${track.track} release for versionCode ${versionCode}, found ${matchingIndexes.length}`,
    );
  }

  const releases = trackReleases.map((release, index) => {
    if (index !== matchingIndexes[0]) {
      return release;
    }

    return updateRelease({ release, releaseNotes, version, versionCode });
  });

  return { ...track, releases };
};

const publishGooglePlayRelease = async ({
  accessToken,
  fetchImpl = fetch,
  packageName,
  releaseNotes,
  trackName = "internal",
  version,
  versionCode,
}) => {
  const applicationUrl = `${GOOGLE_API_ROOT}/applications/${packageName}`;
  const edit = await googleRequest({
    accessToken,
    fetchImpl,
    method: "POST",
    url: `${applicationUrl}/edits`,
  });
  const trackUrl = `${applicationUrl}/edits/${edit.id}/tracks/${trackName}`;
  const track = await googleRequest({ accessToken, fetchImpl, url: trackUrl });
  const updatedTrack = updateTrackForVersion({
    releaseNotes,
    track,
    version,
    versionCode,
  });

  await googleRequest({
    accessToken,
    body: updatedTrack,
    fetchImpl,
    method: "PUT",
    url: trackUrl,
  });
  await googleRequest({
    accessToken,
    fetchImpl,
    method: "POST",
    url: `${applicationUrl}/edits/${edit.id}:commit`,
  });

  return updatedTrack;
};

const parseArguments = (argv) => {
  const values = {};

  for (let index = 0; index < argv.length; index += 2) {
    values[argv[index].replace(/^--/u, "")] = argv[index + 1];
  }

  return values;
};

const run = async () => {
  const args = parseArguments(process.argv.slice(2));
  const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
  const metadata = JSON.parse(fs.readFileSync(args["metadata-file"], "utf8"));
  const accessToken = await requestAccessToken({ credentials });

  await publishGooglePlayRelease({
    accessToken,
    packageName: args.package,
    releaseNotes: metadata.releaseNotes,
    trackName: args.track ?? "internal",
    version: metadata.version,
    versionCode: args["version-code"],
  });
  process.stdout.write(
    `Google Play ${args.track ?? "internal"} release ${metadata.version} (${args["version-code"]}) completed with pt-BR notes.\n`,
  );
};

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`[google-play-release] ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  ANDROID_PUBLISHER_SCOPE,
  GOOGLE_API_ROOT,
  GOOGLE_TOKEN_URL,
  createServiceAccountAssertion,
  publishGooglePlayRelease,
  requestAccessToken,
  updateRelease,
  updateTrackForVersion,
};
