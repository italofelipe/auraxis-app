#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";

const buildHeaders = () => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "auraxis-contracts-tooling",
  };

  if (GITHUB_TOKEN.trim().length > 0) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN.trim()}`;
  }

  return headers;
};

const ensureParentDirectory = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const writeJsonFile = (filePath, payload) => {
  ensureParentDirectory(filePath);
  fs.writeFileSync(`${filePath}`, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const readJsonFile = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const sha256 = (rawValue) => {
  return crypto.createHash("sha256").update(rawValue, "utf8").digest("hex");
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`request failed: ${url} (${response.status})`);
  }

  return response.text();
};

const fetchJson = async (url) => {
  const rawText = await fetchText(url);
  return JSON.parse(rawText);
};

const readOpenApiFromSource = async (snapshotUrl, localFilePath) => {
  if (localFilePath.trim().length > 0) {
    const absolutePath = path.resolve(localFilePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`local openapi source not found: ${absolutePath}`);
    }
    return readJsonFile(absolutePath);
  }

  return fetchJson(snapshotUrl);
};

const listRemoteContractPacks = async (contractsApiUrl) => {
  const response = await fetch(contractsApiUrl, {
    headers: buildHeaders(),
  });

  if (response.status === 404) {
    process.stdout.write(
      `[contracts] remote contract directory not found (${contractsApiUrl}); treating as empty baseline.\n`,
    );
    return [];
  }

  if (!response.ok) {
    throw new Error(`request failed: ${contractsApiUrl} (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("contracts endpoint did not return a JSON array");
  }

  const jsonFiles = payload.filter((entry) => {
    const name = String(entry?.name ?? "");
    const type = String(entry?.type ?? "");
    return type === "file" && name.endsWith(".json");
  });

  const packs = [];

  for (const fileEntry of jsonFiles) {
    const taskFileName = String(fileEntry.name);
    const downloadUrl = String(fileEntry.download_url ?? "");

    if (downloadUrl.length === 0) {
      throw new Error(`missing download_url for ${taskFileName}`);
    }

    const rawContent = await fetchText(downloadUrl);
    const parsed = JSON.parse(rawContent);
    const taskId = String(parsed.task_id ?? taskFileName.replace(".json", "")).trim();

    packs.push({
      hash: sha256(rawContent),
      taskId,
      payload: parsed,
    });
  }

  packs.sort((left, right) => {
    return left.taskId.localeCompare(right.taskId);
  });

  return packs;
};

const computeContractBaseline = (
  packs,
  sourceOwner,
  sourceRepo,
  sourceRef,
) => {
  return {
    generatedAt: new Date().toISOString(),
    source: {
      owner: sourceOwner,
      repo: sourceRepo,
      ref: sourceRef,
    },
    packs: packs.map((pack) => {
      return {
        taskId: pack.taskId,
        sha256: pack.hash,
      };
    }),
  };
};

const normalizePath = (rawPath) => {
  return String(rawPath ?? "").trim();
};

const validateRestEndpointsAgainstOpenApi = (openApiDocument, packs) => {
  const errors = [];
  const documentedPaths = openApiDocument?.paths ?? {};

  for (const pack of packs) {
    const restEndpoints = Array.isArray(pack.payload?.rest_endpoints)
      ? pack.payload.rest_endpoints
      : [];

    for (const endpoint of restEndpoints) {
      const endpointPath = normalizePath(endpoint?.path);
      const endpointMethod = String(endpoint?.method ?? "").trim().toLowerCase();

      if (endpointPath.length === 0 || endpointMethod.length === 0) {
        errors.push(
          `[${pack.taskId}] invalid rest endpoint shape in contract pack`,
        );
        continue;
      }

      const pathDefinition = documentedPaths[endpointPath];
      if (!pathDefinition) {
        errors.push(
          `[${pack.taskId}] OpenAPI missing path ${endpointPath}`,
        );
        continue;
      }

      if (!Object.prototype.hasOwnProperty.call(pathDefinition, endpointMethod)) {
        errors.push(
          `[${pack.taskId}] OpenAPI missing method ${endpointMethod.toUpperCase()} on ${endpointPath}`,
        );
      }
    }
  }

  return errors;
};

module.exports = {
  computeContractBaseline,
  ensureParentDirectory,
  fetchJson,
  listRemoteContractPacks,
  readJsonFile,
  readOpenApiFromSource,
  sha256,
  validateRestEndpointsAgainstOpenApi,
  writeJsonFile,
};
