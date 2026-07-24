#!/usr/bin/env node

const fs = require("node:fs");

const ACTIVE_BUILD_STATUSES = new Set(["NEW", "IN_QUEUE", "IN_PROGRESS", "PENDING_CANCEL"]);
const FINISHED_BUILD_STATUS = "FINISHED";
const PLATFORMS = ["android", "ios"];

const normalizePlatform = (platform) => {
  return String(platform ?? "")
    .trim()
    .toLowerCase();
};

const matchingBuilds = ({ appVersion = "", builds, fingerprint, platform }) => {
  return builds.filter((build) => {
    return (
      normalizePlatform(build.platform) === platform &&
      build.runtimeVersion === fingerprint &&
      (!appVersion || build.appVersion === appVersion) &&
      build.buildProfile
    );
  });
};

const platformState = ({ appVersion = "", builds, fingerprint, platform, profile }) => {
  const matches = matchingBuilds({ appVersion, builds, fingerprint, platform }).filter(
    (build) => build.buildProfile === profile,
  );

  if (matches.some((build) => build.status === FINISHED_BUILD_STATUS)) {
    return "ready";
  }

  if (matches.some((build) => ACTIVE_BUILD_STATUSES.has(build.status))) {
    return "building";
  }

  return "missing";
};

const selectFinishedBuildId = ({ appVersion = "", builds, fingerprint, platform, profile }) => {
  const matches = matchingBuilds({ appVersion, builds, fingerprint, platform })
    .filter((build) => build.buildProfile === profile && build.status === FINISHED_BUILD_STATUS)
    .sort((left, right) =>
      String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")),
    );
  return matches[0]?.id ?? null;
};

const resolveDeliveryMode = ({
  appVersion = "",
  builds,
  fingerprints,
  platforms = PLATFORMS,
  profile,
}) => {
  const states = Object.fromEntries(
    platforms.map((platform) => [
      platform,
      platformState({
        appVersion,
        builds,
        fingerprint: fingerprints[platform],
        platform,
        profile,
      }),
    ]),
  );
  const buildIds = Object.fromEntries(
    platforms.map((platform) => [
      platform,
      selectFinishedBuildId({
        appVersion,
        builds,
        fingerprint: fingerprints[platform],
        platform,
        profile,
      }),
    ]),
  );

  if (platforms.every((platform) => states[platform] === "ready")) {
    return { buildIds, mode: "ota", states };
  }

  if (platforms.some((platform) => states[platform] === "building")) {
    return { buildIds, mode: "wait", states };
  }

  return { buildIds, mode: "build", states };
};

const parseArguments = (argv) => {
  const values = {};

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/u, "");
    values[key] = argv[index + 1];
  }

  return values;
};

const run = () => {
  const args = parseArguments(process.argv.slice(2));
  const builds = JSON.parse(fs.readFileSync(args["builds-file"], "utf8"));
  const result = resolveDeliveryMode({
    appVersion: args["app-version"],
    builds,
    fingerprints: {
      android: args["android-fingerprint"],
      ios: args["ios-fingerprint"],
    },
    platforms: args.platform && args.platform !== "all" ? [args.platform] : PLATFORMS,
    profile: args.profile,
  });

  process.stdout.write(`${JSON.stringify(result)}\n`);
};

if (require.main === module) {
  run();
}

module.exports = {
  ACTIVE_BUILD_STATUSES,
  FINISHED_BUILD_STATUS,
  matchingBuilds,
  platformState,
  resolveDeliveryMode,
  selectFinishedBuildId,
};
