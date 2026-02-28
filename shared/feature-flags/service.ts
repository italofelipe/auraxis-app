import featureFlagsCatalogJson from "@/config/feature-flags.json";

import type { FeatureFlagCatalog, FeatureFlagDefinition } from "@/shared/feature-flags/types";

const featureFlagsCatalog: FeatureFlagCatalog = featureFlagsCatalogJson as FeatureFlagCatalog;
const enabledStatuses = new Set<string>(["active", "released", "enabled"]);
const overridePrefix = "EXPO_PUBLIC_FLAG_";
const defaultUnleashAppName = "auraxis-app";
const defaultUnleashEnvironment = "development";
const defaultUnleashInstanceId = "auraxis-app";
const defaultUnleashCacheTtlMs = 30000;

let unleashCacheExpireAtMs = 0;
let unleashCacheSnapshot: Record<string, boolean> = {};

const getKnownEnvValues = (): Record<string, string | undefined> => {
  return {
    EXPO_PUBLIC_UNLEASH_CACHE_TTL_MS: process.env.EXPO_PUBLIC_UNLEASH_CACHE_TTL_MS,
    AURAXIS_UNLEASH_CACHE_TTL_MS: process.env.AURAXIS_UNLEASH_CACHE_TTL_MS,
    EXPO_PUBLIC_FLAG_PROVIDER: process.env.EXPO_PUBLIC_FLAG_PROVIDER,
    AURAXIS_FLAG_PROVIDER: process.env.AURAXIS_FLAG_PROVIDER,
    EXPO_PUBLIC_UNLEASH_APP_NAME: process.env.EXPO_PUBLIC_UNLEASH_APP_NAME,
    AURAXIS_UNLEASH_APP_NAME: process.env.AURAXIS_UNLEASH_APP_NAME,
    EXPO_PUBLIC_UNLEASH_ENVIRONMENT: process.env.EXPO_PUBLIC_UNLEASH_ENVIRONMENT,
    AURAXIS_UNLEASH_ENVIRONMENT: process.env.AURAXIS_UNLEASH_ENVIRONMENT,
    AURAXIS_RUNTIME_ENV: process.env.AURAXIS_RUNTIME_ENV,
    EXPO_PUBLIC_UNLEASH_INSTANCE_ID: process.env.EXPO_PUBLIC_UNLEASH_INSTANCE_ID,
    AURAXIS_UNLEASH_INSTANCE_ID: process.env.AURAXIS_UNLEASH_INSTANCE_ID,
    EXPO_PUBLIC_UNLEASH_CLIENT_KEY: process.env.EXPO_PUBLIC_UNLEASH_CLIENT_KEY,
    AURAXIS_UNLEASH_CLIENT_KEY: process.env.AURAXIS_UNLEASH_CLIENT_KEY,
    AURAXIS_UNLEASH_API_TOKEN: process.env.AURAXIS_UNLEASH_API_TOKEN,
    EXPO_PUBLIC_UNLEASH_PROXY_URL: process.env.EXPO_PUBLIC_UNLEASH_PROXY_URL,
    AURAXIS_UNLEASH_URL: process.env.AURAXIS_UNLEASH_URL,
  };
};

/**
 * Resolve variável de ambiente por ordem de precedência.
 * @param keys Lista ordenada de chaves candidatas.
 * @param defaultValue Valor padrão quando nenhuma chave está definida.
 * @returns Valor normalizado (trim).
 */
const readRuntimeEnv = (keys: string[], defaultValue = ""): string => {
  const knownEnvValues = getKnownEnvValues();
  for (const key of keys) {
    const rawValue = knownEnvValues[key];
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      return rawValue.trim();
    }
  }
  return defaultValue;
};

/**
 * Determina se valor desconhecido e objeto indexavel.
 * @param value Valor de entrada.
 * @returns `true` quando for um objeto valido.
 */
const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/**
 * Gera fallback seguro para TTL do cache do provider.
 * @returns TTL em milissegundos.
 */
const getSafeCacheTtlMs = (): number => {
  const rawCacheTtlMs = Number(
    readRuntimeEnv(
      ["EXPO_PUBLIC_UNLEASH_CACHE_TTL_MS", "AURAXIS_UNLEASH_CACHE_TTL_MS"],
      "30000",
    ),
  );
  if (Number.isFinite(rawCacheTtlMs) && rawCacheTtlMs > 0) {
    return Math.trunc(rawCacheTtlMs);
  }
  return defaultUnleashCacheTtlMs;
};

/**
 * Limpa cache do snapshot remoto para testes e invalidacao manual.
 * @returns `void`.
 */
export const resetProviderCache = (): void => {
  unleashCacheSnapshot = {};
  unleashCacheExpireAtMs = 0;
};

/**
 * Retorna o modo de provider configurado para runtime.
 * @returns Modo do provider (`local` ou `unleash`).
 */
export const getProviderMode = (): "local" | "unleash" => {
  const providerModeEnv = readRuntimeEnv(
    ["EXPO_PUBLIC_FLAG_PROVIDER", "AURAXIS_FLAG_PROVIDER"],
    "local",
  )
    .trim()
    .toLowerCase();
  if (providerModeEnv === "unleash") {
    return "unleash";
  }
  return "local";
};

/**
 * Monta headers padrao para consulta ao provider Unleash.
 * @returns Dicionario de headers HTTP.
 */
const buildUnleashHeaders = (): Record<string, string> => {
  const unleashAppName = readRuntimeEnv(
    ["EXPO_PUBLIC_UNLEASH_APP_NAME", "AURAXIS_UNLEASH_APP_NAME"],
    defaultUnleashAppName,
  );
  const unleashEnvironment = readRuntimeEnv(
    [
      "EXPO_PUBLIC_UNLEASH_ENVIRONMENT",
      "AURAXIS_UNLEASH_ENVIRONMENT",
      "AURAXIS_RUNTIME_ENV",
    ],
    defaultUnleashEnvironment,
  );
  const unleashInstanceId = readRuntimeEnv(
    ["EXPO_PUBLIC_UNLEASH_INSTANCE_ID", "AURAXIS_UNLEASH_INSTANCE_ID"],
    defaultUnleashInstanceId,
  );
  const unleashClientKey = readRuntimeEnv(
    [
      "EXPO_PUBLIC_UNLEASH_CLIENT_KEY",
      "AURAXIS_UNLEASH_CLIENT_KEY",
      "AURAXIS_UNLEASH_API_TOKEN",
    ],
    "",
  );
  const headers: Record<string, string> = {
    Accept: "application/json",
    "UNLEASH-APPNAME": unleashAppName,
    "UNLEASH-INSTANCEID": unleashInstanceId,
    "UNLEASH-ENVIRONMENT": unleashEnvironment,
  };

  if (unleashClientKey.length > 0) {
    headers.Authorization = unleashClientKey;
  }

  return headers;
};

/**
 * Extrai snapshot de flags do payload do provider Unleash.
 * @param payload Payload bruto retornado pelo provider.
 * @returns Mapa `flag -> enabled`.
 */
const parseUnleashPayload = (payload: unknown): Record<string, boolean> => {
  if (!isObjectRecord(payload) || !Array.isArray(payload.features)) {
    return {};
  }

  const snapshot: Record<string, boolean> = {};
  payload.features.forEach((feature: unknown): void => {
    if (!isObjectRecord(feature)) {
      return;
    }

    const name = String(feature.name ?? "").trim();
    const enabled = feature.enabled;
    if (name.length > 0 && typeof enabled === "boolean") {
      snapshot[name] = enabled;
    }
  });

  return snapshot;
};

/**
 * Consulta snapshot remoto do provider com cache curto em memoria.
 * @returns Mapa `flag -> enabled` obtido do provider.
 */
export const fetchUnleashSnapshot = async (): Promise<Record<string, boolean>> => {
  const unleashProxyUrl = readRuntimeEnv(
    ["EXPO_PUBLIC_UNLEASH_PROXY_URL", "AURAXIS_UNLEASH_URL"],
    "",
  );
  if (getProviderMode() !== "unleash" || unleashProxyUrl.length === 0) {
    return {};
  }

  const now = Date.now();
  if (now < unleashCacheExpireAtMs) {
    return unleashCacheSnapshot;
  }

  const response = await fetch(`${unleashProxyUrl}/api/client/features`, {
    method: "GET",
    headers: buildUnleashHeaders(),
  });

  if (!response.ok) {
    return {};
  }

  const payload = await response.json();
  const parsedSnapshot = parseUnleashPayload(payload);
  unleashCacheSnapshot = parsedSnapshot;
  unleashCacheExpireAtMs = now + getSafeCacheTtlMs();
  return parsedSnapshot;
};

/**
 * Resolve decisao do provider remoto para uma flag.
 * @param flagKey Chave logica da flag.
 * @returns Valor booleano do provider quando disponivel.
 */
export const resolveProviderDecision = async (
  flagKey: string,
): Promise<boolean | undefined> => {
  if (getProviderMode() !== "unleash") {
    return undefined;
  }

  try {
    const snapshot = await fetchUnleashSnapshot();
    const providerValue = snapshot[flagKey];
    if (typeof providerValue === "boolean") {
      return providerValue;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Normaliza a chave de flag para o padrao de env var.
 * @param flagKey Chave logica da flag.
 * @returns Sufixo de variavel de ambiente.
 */
export const toEnvSuffix = (flagKey: string): string => {
  return flagKey.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
};

/**
 * Resolve override de ambiente para uma flag.
 * @param flagKey Chave logica da flag.
 * @returns Valor booleano explicito ou `undefined` quando ausente/invalido.
 */
export const resolveEnvOverride = (flagKey: string): boolean | undefined => {
  const variableName = `${overridePrefix}${toEnvSuffix(flagKey)}`;
  const rawValue = String(process.env[variableName] ?? "").trim().toLowerCase();

  if (rawValue.length === 0) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(rawValue)) {
    return false;
  }

  return undefined;
};

/**
 * Busca uma flag no catalogo local versionado.
 * @param flagKey Chave logica da flag.
 * @returns Definicao da flag quando encontrada.
 */
export const getLocalFlag = (flagKey: string): FeatureFlagDefinition | undefined => {
  return featureFlagsCatalog.flags.find((flag: FeatureFlagDefinition): boolean => {
    return flag.key === flagKey;
  });
};

/**
 * Resolve o estado efetivo de uma flag.
 * Prioridade: provider externo -> env override -> catalogo local.
 * @param flagKey Chave logica da flag.
 * @param providerDecision Decisao opcional de provider externo.
 * @returns `true` quando a feature esta habilitada.
 */
export const isFeatureEnabled = (
  flagKey: string,
  providerDecision?: boolean,
): boolean => {
  if (typeof providerDecision === "boolean") {
    return providerDecision;
  }

  const envOverride = resolveEnvOverride(flagKey);
  if (typeof envOverride === "boolean") {
    return envOverride;
  }

  const localFlag = getLocalFlag(flagKey);
  if (!localFlag) {
    return false;
  }

  return enabledStatuses.has(localFlag.status.trim().toLowerCase());
};
