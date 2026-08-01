#!/usr/bin/env node
/**
 * Publica um update OTA no nosso próprio servidor (épico platform#978).
 *
 * Substitui `eas update`. Nenhuma etapa depende de serviço da Expo: o
 * `expo export` roda local, o upload vai para o nosso bucket e o registro é
 * um POST no api-v2.
 *
 * Uso:
 *   node scripts/ota-publish.mjs --channel production
 *   node scripts/ota-publish.mjs --channel preview --dry-run
 *
 * Variáveis obrigatórias (exceto em --dry-run):
 *   OTA_PUBLISH_TOKEN   token do endpoint de publicação
 *   OTA_API_BASE        base do api-v2 (ex.: https://api.auraxis.com.br)
 *   OTA_BUCKET          bucket S3 dos assets
 *   OTA_CDN_BASE        origem pública dos assets (CloudFront)
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist";
const PLATFORMS = ["ios", "android"];

/**
 * Lê um argumento nomeado da linha de comando.
 *
 * @param {string} name Nome do argumento, sem os hífens.
 * @param {string} [fallback] Valor quando ausente.
 * @returns {string|undefined} Valor informado.
 */
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

const hasFlag = (name) => process.argv.includes(`--${name}`);

/**
 * Executa um comando repassando a saída para o terminal.
 *
 * @param {string} command Executável.
 * @param {string[]} args Argumentos.
 * @returns {string} Saída padrão.
 */
const run = (command, args) =>
  execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

/**
 * Hash sha256 em base64url sem padding — o campo `hash` do manifest.
 *
 * @param {Buffer} content Conteúdo do arquivo.
 * @returns {string} Hash codificado.
 */
const sha256Base64Url = (content) =>
  createHash("sha256").update(content).digest("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

/**
 * Hash md5 hex — o campo `key` do manifest.
 *
 * @param {Buffer} content Conteúdo do arquivo.
 * @returns {string} Hash hexadecimal.
 */
const md5Hex = (content) => createHash("md5").update(content).digest("hex");

/**
 * Calcula o runtimeVersion do binário — o mesmo que o app instalado usa.
 *
 * Divergir aqui é a falha mais provável e a mais silenciosa do fluxo: o
 * update existe, o servidor responde, e nenhum device recebe, porque o
 * fingerprint não casa. Por isso é impresso sempre.
 *
 * @returns {string} Fingerprint nativo.
 */
const resolveRuntimeVersion = () => {
  const raw = run("npx", ["expo-updates", "fingerprint:generate", "--platform", "ios"]);
  const parsed = JSON.parse(raw.trim().split("\n").at(-1));
  return parsed.hash ?? parsed.fingerprintHash;
};

/**
 * Monta o manifest do protocolo a partir do que o `expo export` gerou.
 *
 * @param {object} options Opções.
 * @param {string} options.platform Plataforma alvo.
 * @param {string} options.runtimeVersion Fingerprint nativo.
 * @param {string} options.cdnBase Origem pública dos assets.
 * @returns {{manifest: object, files: {key: string, path: string}[]}} Manifest e arquivos a subir.
 */
const buildManifest = ({ platform, runtimeVersion, cdnBase }) => {
  const metadata = JSON.parse(readFileSync(join(DIST_DIR, "metadata.json")));
  const updateId = createHash("sha256")
    .update(readFileSync(join(DIST_DIR, "metadata.json")))
    .digest("hex");

  const platformMeta = metadata.fileMetadata?.[platform];
  if (!platformMeta) {
    throw new Error(`export sem bundle para ${platform} — rode expo export para as duas plataformas`);
  }

  const prefix = `updates/${runtimeVersion}/${updateId}`;
  const files = [];

  const bundlePath = join(DIST_DIR, platformMeta.bundle);
  const bundleContent = readFileSync(bundlePath);
  const bundleKey = `${prefix}/bundle.${platform}.js`;
  files.push({ key: bundleKey, path: bundlePath });

  const assets = platformMeta.assets.map((asset) => {
    const assetPath = join(DIST_DIR, asset.path);
    const content = readFileSync(assetPath);
    const key = md5Hex(content);
    files.push({ key: `${prefix}/assets/${key}`, path: assetPath });
    return {
      hash: sha256Base64Url(content),
      key,
      contentType: asset.ext === "png" ? "image/png" : "application/octet-stream",
      fileExtension: `.${asset.ext}`,
      url: `${cdnBase}/${prefix}/assets/${key}`,
    };
  });

  const manifest = {
    id: updateId,
    createdAt: new Date().toISOString(),
    runtimeVersion,
    launchAsset: {
      hash: sha256Base64Url(bundleContent),
      key: md5Hex(bundleContent),
      contentType: "application/javascript",
      fileExtension: ".bundle",
      url: `${cdnBase}/${bundleKey}`,
    },
    assets,
    metadata: {},
    extra: {},
  };

  return { manifest, files };
};

/**
 * Sobe os arquivos para o bucket com cache imutável.
 *
 * @param {{key: string, path: string}[]} files Arquivos a enviar.
 * @param {string} bucket Bucket de destino.
 */
const upload = (files, bucket) => {
  for (const file of files) {
    // Cache longo e imutável: a URL carrega o updateId, então o conteúdo sob
    // uma chave nunca muda — o cliente pode cachear para sempre.
    run("aws", [
      "s3",
      "cp",
      file.path,
      `s3://${bucket}/${file.key}`,
      "--cache-control",
      "public, max-age=31536000, immutable",
    ]);
  }
};

/**
 * Registra o update no api-v2.
 *
 * @param {object} options Opções.
 * @param {object} options.manifest Manifest montado.
 * @param {string} options.platform Plataforma.
 * @param {string} options.channel Canal.
 * @param {string} options.runtimeVersion Fingerprint.
 * @param {string} options.apiBase Base do api-v2.
 * @param {string} options.token Token de publicação.
 * @returns {Promise<object>} Resposta do servidor.
 */
const register = async ({ manifest, platform, channel, runtimeVersion, apiBase, token }) => {
  const response = await fetch(`${apiBase}/v2/ota/updates`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      update_id: manifest.id,
      runtime_version: runtimeVersion,
      platform,
      channel,
      manifest,
    }),
  });

  if (!response.ok) {
    throw new Error(`registro falhou (${response.status}): ${await response.text()}`);
  }

  return response.json();
};

const main = async () => {
  const channel = arg("channel", "preview");
  const dryRun = hasFlag("dry-run");
  const bucket = process.env.OTA_BUCKET;
  const cdnBase = process.env.OTA_CDN_BASE;
  const apiBase = process.env.OTA_API_BASE;
  const token = process.env.OTA_PUBLISH_TOKEN;

  if (!dryRun && (!bucket || !cdnBase || !apiBase || !token)) {
    throw new Error("OTA_BUCKET, OTA_CDN_BASE, OTA_API_BASE e OTA_PUBLISH_TOKEN são obrigatórios");
  }

  console.log("→ exportando bundle (local, sem serviço da Expo)");
  run("npx", ["expo", "export", "--platform", "ios", "--platform", "android", "--output-dir", DIST_DIR]);

  if (!existsSync(join(DIST_DIR, "metadata.json"))) {
    throw new Error("export não gerou metadata.json");
  }

  const runtimeVersion = resolveRuntimeVersion();
  console.log(`→ runtimeVersion (fingerprint): ${runtimeVersion}`);
  console.log("  confira contra o binário publicado: divergir aqui faz o update");
  console.log("  existir e nenhum device recebê-lo, sem erro visível.");

  for (const platform of PLATFORMS) {
    const { manifest, files } = buildManifest({
      platform,
      runtimeVersion,
      cdnBase: cdnBase ?? "https://exemplo-dry-run",
    });

    console.log(`→ ${platform}: update ${manifest.id.slice(0, 12)} · ${files.length} arquivos`);

    if (dryRun) {
      console.log(`  [dry-run] nada foi enviado nem registrado`);
      continue;
    }

    upload(files, bucket);
    const result = await register({
      manifest,
      platform,
      channel,
      runtimeVersion,
      apiBase,
      token,
    });
    console.log(`  ${result.created ? "registrado" : "já existia (idempotente)"}`);
  }

  console.log(`✓ publicação concluída no canal ${channel}`);
};

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
