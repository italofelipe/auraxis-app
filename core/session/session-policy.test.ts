import {
  isStoredSessionExpired,
  resolveSessionInvalidationReason,
  withSessionMetadata,
} from "@/core/session/session-policy";
import { makeStoredSession } from "@/shared/testing/runtime-fixtures";

const createJwt = (exp: number): string => {
  const encode = (value: unknown): string => {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  };

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp })}.signature`;
};

describe("session policy", () => {
  it("enriquece a sessao com metadados derivados do JWT", () => {
    const expiresAt = new Date("2026-04-08T12:00:00.000Z");
    const session = withSessionMetadata(
      makeStoredSession({
        accessToken: createJwt(Math.floor(expiresAt.getTime() / 1_000)),
        authenticatedAt: null,
        expiresAt: null,
      }),
      new Date("2026-04-08T10:00:00.000Z"),
    );

    expect(session.authenticatedAt).toBe("2026-04-08T10:00:00.000Z");
    expect(session.expiresAt).toBe("2026-04-08T12:00:00.000Z");
  });

  it("considera a sessao expirada quando o expiresAt ja passou", () => {
    expect(
      isStoredSessionExpired(
        {
          expiresAt: "2026-04-08T10:00:00.000Z",
        },
        new Date("2026-04-08T10:01:00.000Z"),
      ),
    ).toBe(true);
  });

  it("nao trata sessao sem expiresAt como expirada", () => {
    expect(
      isStoredSessionExpired(
        {
          expiresAt: null,
        },
        new Date("2026-04-08T10:01:00.000Z"),
      ),
    ).toBe(false);
  });

  it("mapeia falhas de auth para razoes canonicas", () => {
    expect(resolveSessionInvalidationReason(401)).toBe("unauthorized");
    expect(resolveSessionInvalidationReason(403)).toBe("forbidden");
    expect(resolveSessionInvalidationReason(500)).toBeNull();
  });
});
