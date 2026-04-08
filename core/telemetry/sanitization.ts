import { sanitizeAppUrl } from "@/core/navigation/deep-linking";

const REDACTED_VALUE = "<redacted>";
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 300;

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|api[-_]?key|observability[-_]?key|email|ip(_address)?|dsn)/iu;

const shouldRedactKey = (key: string): boolean => {
  return SENSITIVE_KEY_PATTERN.test(key);
};

const trimString = (value: string): string => {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}…`;
};

const sanitizeString = (value: string): string => {
  if (value.includes("://")) {
    return trimString(sanitizeAppUrl(value));
  }

  return trimString(value);
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const sanitizeTelemetryValue = (
  value: unknown,
  depth = 0,
): unknown => {
  if (depth >= MAX_DEPTH) {
    return "[truncated]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeTelemetryValue(entry, depth + 1));
  }

  if (!isPlainRecord(value)) {
    return String(value);
  }

  const sanitizedEntries = Object.entries(value).map(([key, entryValue]) => {
    if (shouldRedactKey(key)) {
      return [key, REDACTED_VALUE] as const;
    }

    return [key, sanitizeTelemetryValue(entryValue, depth + 1)] as const;
  });

  return Object.fromEntries(sanitizedEntries);
};

export const sanitizeTelemetryContext = (
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined => {
  if (!value) {
    return undefined;
  }

  return sanitizeTelemetryValue(value) as Record<string, unknown>;
};
