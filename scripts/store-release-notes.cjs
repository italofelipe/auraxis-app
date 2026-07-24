#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const APPLE_MAX_LENGTH = 4000;
const GOOGLE_MAX_LENGTH = 500;
const MIN_LENGTH = 100;
const MIN_BULLETS = 2;
const STORE_CHANGELOG_HEADING = "Changelog de loja";
const PLACEHOLDER_PATTERN = /\b(?:n\/a|não se aplica|sem alterações|todo|tbd|placeholder)\b/iu;

const extractStoreChangelog = (body) => {
  const heading = new RegExp(`^##\\s+${STORE_CHANGELOG_HEADING}\\s*$`, "imu");
  const match = heading.exec(body ?? "");

  if (!match) {
    return "";
  }

  const tail = body.slice(match.index + match[0].length);
  const nextHeading = tail.search(/^##\s+/mu);
  return (nextHeading === -1 ? tail : tail.slice(0, nextHeading)).trim();
};

const normalizeNotes = (notes) => {
  return String(notes ?? "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/u, "- "))
    .join("\n");
};

const getBullets = (notes) => {
  return normalizeNotes(notes)
    .split("\n")
    .filter((line) => /^-\s+\S/u.test(line));
};

const validateStoreNotes = (notes, { maxLength = GOOGLE_MAX_LENGTH } = {}) => {
  const normalized = normalizeNotes(notes);
  const bullets = getBullets(normalized);
  const errors = [];

  if (normalized.length < MIN_LENGTH) {
    errors.push(`changelog must contain at least ${MIN_LENGTH} characters`);
  }

  if (normalized.length > maxLength) {
    errors.push(`changelog exceeds the ${maxLength} character store limit`);
  }

  if (bullets.length < MIN_BULLETS) {
    errors.push(`changelog must contain at least ${MIN_BULLETS} detailed bullets`);
  }

  if (bullets.some((bullet) => bullet.length < 25)) {
    errors.push("every changelog bullet must contain at least 25 characters");
  }

  if (PLACEHOLDER_PATTERN.test(normalized)) {
    errors.push("changelog contains a placeholder or non-applicable answer");
  }

  return { errors, notes: normalized };
};

const validatePullRequestBody = (body) => {
  const extracted = extractStoreChangelog(body);

  if (!extracted) {
    return {
      errors: [`PR body must include a "## ${STORE_CHANGELOG_HEADING}" section`],
      notes: "",
    };
  }

  return validateStoreNotes(extracted, { maxLength: GOOGLE_MAX_LENGTH });
};

const extractReleaseSection = (changelog, version) => {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const heading = new RegExp(`^##\\s+\\[?${escapedVersion}\\]?\\b.*$`, "mu");
  const match = heading.exec(changelog);

  if (!match) {
    throw new Error(`CHANGELOG.md has no section for version ${version}`);
  }

  const tail = changelog.slice(match.index + match[0].length);
  const nextVersion = tail.search(/^##\s+\[?\d+\.\d+\.\d+/mu);
  return (nextVersion === -1 ? tail : tail.slice(0, nextVersion)).trim();
};

const extractPullRequestNumbers = (releaseSection) => {
  const matches = releaseSection.matchAll(/(?:\[#|\(#|\/(?:issues|pull)\/)(\d+)(?:\]|\)|\b)/gu);
  return [...new Set(Array.from(matches, (match) => Number(match[1])))];
};

const loadPullRequestNotes = async ({
  fetchImpl = fetch,
  repository,
  token,
  pullRequestNumbers,
}) => {
  const pullRequests = [];

  for (const number of pullRequestNumbers) {
    const response = await fetchImpl(`https://api.github.com/repos/${repository}/pulls/${number}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new Error(`GitHub PR #${number} lookup failed (${response.status})`);
    }

    const pullRequest = await response.json();
    const validation = validatePullRequestBody(pullRequest.body);

    if (validation.errors.length > 0) {
      throw new Error(`PR #${number}: ${validation.errors.join("; ")}`);
    }

    pullRequests.push({ notes: validation.notes, number });
  }

  return pullRequests;
};

const createReleaseMetadata = ({ pullRequests, version }) => {
  const releaseNotes = [...new Set(pullRequests.map(({ notes }) => notes))]
    .flatMap((notes) => notes.split("\n"))
    .filter((line, index, lines) => lines.indexOf(line) === index)
    .join("\n");
  const validation = validateStoreNotes(releaseNotes, {
    maxLength: GOOGLE_MAX_LENGTH,
  });

  if (validation.errors.length > 0) {
    throw new Error(`Release ${version}: ${validation.errors.join("; ")}`);
  }

  return {
    language: "pt-BR",
    releaseNotes: validation.notes,
    sourcePullRequests: pullRequests.map(({ number }) => number),
    version,
  };
};

const writeReleaseArtifacts = ({ metadata, outputDirectory }) => {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(outputDirectory, "metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outputDirectory, "google-play-pt-BR.txt"),
    `${metadata.releaseNotes}\n`,
  );
  fs.writeFileSync(path.join(outputDirectory, "app-store-pt-BR.txt"), `${metadata.releaseNotes}\n`);
  fs.writeFileSync(
    path.join(outputDirectory, "what-to-test-pt-BR.txt"),
    `${metadata.releaseNotes}\n`,
  );
};

const parseArguments = (argv) => {
  const [command, ...pairs] = argv;
  const values = { command };

  for (let index = 0; index < pairs.length; index += 2) {
    values[pairs[index].replace(/^--/u, "")] = pairs[index + 1];
  }

  return values;
};

const assertValid = (validation) => {
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("; "));
  }
};

const isReleasePleasePullRequest = (title) => {
  return /^chore\(main\): release \d+\.\d+\.\d+/u.test(title ?? "");
};

const runValidatePullRequest = (eventPath) => {
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));

  if (isReleasePleasePullRequest(event.pull_request?.title)) {
    process.stdout.write("Release Please PR inherits validated source changelogs.\n");
    return;
  }

  const validation = validatePullRequestBody(event.pull_request?.body);
  assertValid(validation);
  process.stdout.write(`${validation.notes}\n`);
};

const runGenerateRelease = async (args) => {
  const changelog = fs.readFileSync(args.changelog ?? "CHANGELOG.md", "utf8");
  const section = extractReleaseSection(changelog, args.version);
  const pullRequestNumbers = extractPullRequestNumbers(section);

  if (pullRequestNumbers.length === 0) {
    throw new Error(`Release ${args.version} does not reference any source PR`);
  }

  const pullRequests = await loadPullRequestNotes({
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
    pullRequestNumbers,
  });
  if (pullRequests.length === 0) {
    throw new Error(`Release ${args.version} has no source PR with store notes`);
  }

  const metadata = createReleaseMetadata({ pullRequests, version: args.version });
  writeReleaseArtifacts({
    metadata,
    outputDirectory: args["output-dir"],
  });
};

const runFromText = (args) => {
  const validation = validateStoreNotes(process.env.STORE_RELEASE_NOTES);
  assertValid(validation);
  const metadata = createReleaseMetadata({
    pullRequests: [{ notes: validation.notes, number: "manual" }],
    version: args.version,
  });
  writeReleaseArtifacts({
    metadata,
    outputDirectory: args["output-dir"],
  });
};

const run = async () => {
  const args = parseArguments(process.argv.slice(2));

  if (args.command === "validate-pr") {
    runValidatePullRequest(process.env.GITHUB_EVENT_PATH);
    return;
  }

  if (args.command === "generate-release") {
    await runGenerateRelease(args);
    return;
  }

  if (args.command === "from-text") {
    runFromText(args);
    return;
  }

  throw new Error(`Unsupported command: ${args.command ?? "<missing>"}`);
};

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`[store-release-notes] ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  APPLE_MAX_LENGTH,
  GOOGLE_MAX_LENGTH,
  MIN_BULLETS,
  MIN_LENGTH,
  STORE_CHANGELOG_HEADING,
  createReleaseMetadata,
  extractPullRequestNumbers,
  extractReleaseSection,
  extractStoreChangelog,
  isReleasePleasePullRequest,
  loadPullRequestNotes,
  normalizeNotes,
  validatePullRequestBody,
  validateStoreNotes,
  writeReleaseArtifacts,
};
