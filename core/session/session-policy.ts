import { appRuntimeConfig } from "@/shared/config/runtime";

import type {
  SessionInvalidationReason,
  StoredSession,
} from "@/core/session/types";

interface BufferLike {
  from(input: string, encoding: "base64"): {
    toString(encoding: "utf8"): string;
  };
}

const toBase64UrlPadded = (value: string): string => {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padding = normalized.length % 4;

  if (padding === 0) {
    return normalized;
  }

  return `${normalized}${"=".repeat(4 - padding)}`;
};

const decodeBase64Url = (value: string): string | null => {
  const normalized = toBase64UrlPadded(value);

  if (typeof globalThis.atob === "function") {
    try {
      const binary = globalThis.atob(normalized);
      const percentEncoded = Array.from(binary, (character) => {
        return `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
      }).join("");

      return decodeURIComponent(percentEncoded);
    } catch {
      return null;
    }
  }

  const bufferCtor = (globalThis as { Buffer?: BufferLike }).Buffer;
  if (!bufferCtor) {
    return null;
  }

  try {
    return bufferCtor.from(normalized, "base64").toString("utf8");
  } catch {
    return null;
  }
};

const readJwtExpiration = (accessToken: string): string | null => {
  const tokenParts = accessToken.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  const decodedPayload = decodeBase64Url(tokenParts[1]);
  if (!decodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(decodedPayload) as {
      readonly exp?: number;
    };
    if (!Number.isFinite(payload.exp) || typeof payload.exp !== "number") {
      return null;
    }

    return new Date(payload.exp * 1_000).toISOString();
  } catch {
    return null;
  }
};

const parseIsoTimestamp = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const withSessionMetadata = (
  session: StoredSession,
  now: Date = new Date(),
): StoredSession => {
  return {
    ...session,
    authenticatedAt: session.authenticatedAt ?? now.toISOString(),
    expiresAt: session.expiresAt ?? readJwtExpiration(session.accessToken),
  };
};

export const isStoredSessionExpired = (
  session: Pick<StoredSession, "expiresAt">,
  now: Date = new Date(),
): boolean => {
  const expiresAt = parseIsoTimestamp(session.expiresAt);
  if (expiresAt === null) {
    return false;
  }

  return now.getTime() + appRuntimeConfig.sessionExpiryLeewayMs >= expiresAt;
};

export const resolveSessionInvalidationReason = (
  status: number,
): SessionInvalidationReason | null => {
  if (status === 401) {
    return "unauthorized";
  }

  if (status === 403) {
    return "forbidden";
  }

  return null;
};
