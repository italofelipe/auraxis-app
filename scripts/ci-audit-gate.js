#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const { execSync } = require("node:child_process");

const allowedIds = new Set([
  "GHSA-3ppc-4f35-3m26",
  "GHSA-7r86-cg39-jmmj",
  "GHSA-23c5-xmqv-rm74",
  "1113371",
]);

const runAudit = () => {
  try {
    return execSync("npm audit --omit=dev --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    if (stdout.trim().length > 0) {
      return stdout;
    }

    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    throw new Error(`npm audit failed without JSON output: ${stderr}`);
  }
};

const parseAudit = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const preview = raw.slice(0, 500);
    throw new Error(`Unable to parse npm audit output as JSON. Preview: ${preview}`);
  }
};

const collectFindings = (audit) => {
  const vulnerabilities = audit.vulnerabilities || {};
  const findings = [];

  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    const vias = Array.isArray(info.via) ? info.via : [];

    for (const via of vias) {
      if (!via || typeof via === "string") {
        continue;
      }

      const severity = via.severity || info.severity || "unknown";
      if (severity !== "high" && severity !== "critical") {
        continue;
      }

      const ghsa = typeof via.url === "string" ? via.url.split("/").pop() : "";
      const source = String(via.source ?? "");
      const isAllowed = allowedIds.has(ghsa) || allowedIds.has(source);

      if (!isAllowed) {
        findings.push({
          pkg,
          severity,
          id: ghsa || source || via.title || "unknown",
        });
      }
    }
  }

  return findings;
};

const main = () => {
  const rawAudit = runAudit();
  fs.writeFileSync("audit.json", rawAudit);

  const audit = parseAudit(rawAudit);
  const findings = collectFindings(audit);

  if (findings.length > 0) {
    console.error("Disallowed high/critical vulnerabilities found:");
    for (const finding of findings) {
      console.error(`- [${finding.severity}] ${finding.pkg}: ${finding.id}`);
    }
    process.exit(1);
  }

  console.log("Audit gate passed (only allowlisted Expo minimatch advisory detected).");
};

main();
