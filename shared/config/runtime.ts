import Constants from "expo-constants";

export type ApiMode = "live" | "mock";

export interface AppRuntimeConfig {
  readonly apiBaseUrl: string;
  readonly apiMode: ApiMode;
  readonly apiContractVersion: string;
  readonly requestTimeoutMs: number;
  readonly reachabilityProbeTimeoutMs: number;
  readonly reachabilityProbePath: string;
  readonly sessionExpiryLeewayMs: number;
  readonly appScheme: string;
  readonly checkoutReturnPath: string;
  readonly observabilityExportEnabled: boolean;
  readonly observabilityExportPublicKey: string | null;
  readonly mockLatencyMs: number;
}

const DEFAULT_API_BASE_URL = "http://localhost:5000";
const DEFAULT_API_CONTRACT_VERSION = "v2";
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_REACHABILITY_PROBE_TIMEOUT_MS = 5_000;
const DEFAULT_REACHABILITY_PROBE_PATH = "/healthz";
const DEFAULT_SESSION_EXPIRY_LEEWAY_MS = 30_000;
const DEFAULT_MOCK_LATENCY_MS = 150;
const DEFAULT_APP_SCHEME = "auraxisapp";
const DEFAULT_CHECKOUT_RETURN_PATH = "/assinatura";

const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

type RuntimeEnvKey =
  | "EXPO_PUBLIC_API_URL"
  | "EXPO_PUBLIC_API_MODE"
  | "EXPO_PUBLIC_API_CONTRACT_VERSION"
  | "EXPO_PUBLIC_API_TIMEOUT_MS"
  | "EXPO_PUBLIC_REACHABILITY_PROBE_TIMEOUT_MS"
  | "EXPO_PUBLIC_REACHABILITY_PROBE_PATH"
  | "EXPO_PUBLIC_SESSION_EXPIRY_LEEWAY_MS"
  | "EXPO_PUBLIC_APP_SCHEME"
  | "EXPO_PUBLIC_CHECKOUT_RETURN_PATH"
  | "EXPO_PUBLIC_OBSERVABILITY_EXPORT_ENABLED"
  | "EXPO_PUBLIC_OBSERVABILITY_EXPORT_KEY"
  | "EXPO_PUBLIC_API_MOCK_LATENCY_MS";

const readExpoEnv = (envKey: RuntimeEnvKey): string | undefined => {
  switch (envKey) {
    case "EXPO_PUBLIC_API_URL":
      return process.env.EXPO_PUBLIC_API_URL;
    case "EXPO_PUBLIC_API_MODE":
      return process.env.EXPO_PUBLIC_API_MODE;
    case "EXPO_PUBLIC_API_CONTRACT_VERSION":
      return process.env.EXPO_PUBLIC_API_CONTRACT_VERSION;
    case "EXPO_PUBLIC_API_TIMEOUT_MS":
      return process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
    case "EXPO_PUBLIC_REACHABILITY_PROBE_TIMEOUT_MS":
      return process.env.EXPO_PUBLIC_REACHABILITY_PROBE_TIMEOUT_MS;
    case "EXPO_PUBLIC_REACHABILITY_PROBE_PATH":
      return process.env.EXPO_PUBLIC_REACHABILITY_PROBE_PATH;
    case "EXPO_PUBLIC_SESSION_EXPIRY_LEEWAY_MS":
      return process.env.EXPO_PUBLIC_SESSION_EXPIRY_LEEWAY_MS;
    case "EXPO_PUBLIC_APP_SCHEME":
      return process.env.EXPO_PUBLIC_APP_SCHEME;
    case "EXPO_PUBLIC_CHECKOUT_RETURN_PATH":
      return process.env.EXPO_PUBLIC_CHECKOUT_RETURN_PATH;
    case "EXPO_PUBLIC_OBSERVABILITY_EXPORT_ENABLED":
      return process.env.EXPO_PUBLIC_OBSERVABILITY_EXPORT_ENABLED;
    case "EXPO_PUBLIC_OBSERVABILITY_EXPORT_KEY":
      return process.env.EXPO_PUBLIC_OBSERVABILITY_EXPORT_KEY;
    case "EXPO_PUBLIC_API_MOCK_LATENCY_MS":
      return process.env.EXPO_PUBLIC_API_MOCK_LATENCY_MS;
    default:
      return undefined;
  }
};

const readString = (
  envKey: RuntimeEnvKey,
  extraKey: string,
  fallback: string,
): string => {
  const envValue = readExpoEnv(envKey);
  if (typeof envValue === "string" && envValue.trim().length > 0) {
    return envValue.trim();
  }

  const extraValue = expoExtra[extraKey];
  if (typeof extraValue === "string" && extraValue.trim().length > 0) {
    return extraValue.trim();
  }

  return fallback;
};

const readOptionalString = (
  envKey: RuntimeEnvKey,
  extraKey: string,
): string | null => {
  const resolved = readString(envKey, extraKey, "");
  return resolved.length > 0 ? resolved : null;
};

const readOptionalStringFromAliases = (
  aliases: ReadonlyArray<{
    readonly envKey: RuntimeEnvKey;
    readonly extraKey: string;
  }>,
): string | null => {
  for (const alias of aliases) {
    const resolved = readOptionalString(alias.envKey, alias.extraKey);
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

const readNumber = (
  envKey: RuntimeEnvKey,
  extraKey: string,
  fallback: number,
): number => {
  const rawValue = readString(envKey, extraKey, String(fallback));
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const readBoolean = (
  envKey: RuntimeEnvKey,
  extraKey: string,
  fallback: boolean,
): boolean => {
  const rawValue = readString(envKey, extraKey, String(fallback)).toLowerCase();
  return ["1", "true", "yes", "on"].includes(rawValue);
};

export const normalizeBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

const readApiMode = (): ApiMode => {
  const rawValue = readString("EXPO_PUBLIC_API_MODE", "apiMode", "live").toLowerCase();
  return rawValue === "mock" ? "mock" : "live";
};

export const appRuntimeConfig: AppRuntimeConfig = Object.freeze({
  apiBaseUrl: normalizeBaseUrl(
    readString("EXPO_PUBLIC_API_URL", "apiUrl", DEFAULT_API_BASE_URL),
  ),
  apiMode: readApiMode(),
  apiContractVersion: readString(
    "EXPO_PUBLIC_API_CONTRACT_VERSION",
    "apiContractVersion",
    DEFAULT_API_CONTRACT_VERSION,
  ),
  requestTimeoutMs: readNumber(
    "EXPO_PUBLIC_API_TIMEOUT_MS",
    "apiTimeoutMs",
    DEFAULT_REQUEST_TIMEOUT_MS,
  ),
  reachabilityProbeTimeoutMs: readNumber(
    "EXPO_PUBLIC_REACHABILITY_PROBE_TIMEOUT_MS",
    "reachabilityProbeTimeoutMs",
    DEFAULT_REACHABILITY_PROBE_TIMEOUT_MS,
  ),
  reachabilityProbePath: readString(
    "EXPO_PUBLIC_REACHABILITY_PROBE_PATH",
    "reachabilityProbePath",
    DEFAULT_REACHABILITY_PROBE_PATH,
  ),
  sessionExpiryLeewayMs: readNumber(
    "EXPO_PUBLIC_SESSION_EXPIRY_LEEWAY_MS",
    "sessionExpiryLeewayMs",
    DEFAULT_SESSION_EXPIRY_LEEWAY_MS,
  ),
  appScheme: readString(
    "EXPO_PUBLIC_APP_SCHEME",
    "appScheme",
    DEFAULT_APP_SCHEME,
  ),
  checkoutReturnPath: readString(
    "EXPO_PUBLIC_CHECKOUT_RETURN_PATH",
    "checkoutReturnPath",
    DEFAULT_CHECKOUT_RETURN_PATH,
  ),
  observabilityExportEnabled: readBoolean(
    "EXPO_PUBLIC_OBSERVABILITY_EXPORT_ENABLED",
    "observabilityExportEnabled",
    false,
  ),
  observabilityExportPublicKey: readOptionalStringFromAliases([
    {
      envKey: "EXPO_PUBLIC_OBSERVABILITY_EXPORT_KEY",
      extraKey: "observabilityExportKey",
    },
  ]),
  mockLatencyMs: readNumber(
    "EXPO_PUBLIC_API_MOCK_LATENCY_MS",
    "apiMockLatencyMs",
    DEFAULT_MOCK_LATENCY_MS,
  ),
});
