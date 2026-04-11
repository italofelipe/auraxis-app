import * as SecureStore from "expo-secure-store";

import {
  clearLegacyStoredSession,
  clearStoredSession,
  loadStoredSession,
  persistStoredSession,
} from "@/core/session/session-storage";
import { makeStoredSession } from "@/shared/testing/runtime-fixtures";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);
const mockDeleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);

const createJwt = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>): string => {
    return Buffer.from(JSON.stringify(value))
      .toString("base64url")
      .replace(/=/gu, "");
  };

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("session-storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("carrega a sessao canônica e normaliza os metadados", async () => {
    const storedSession = makeStoredSession({
      accessToken: createJwt({ exp: 4_102_444_800 }),
      refreshToken: undefined as unknown as null,
      user: {
        id: undefined as unknown as string | null,
        name: undefined as unknown as string | null,
        email: "italo@auraxis.dev",
        emailConfirmed: false,
      },
      authenticatedAt: null,
      expiresAt: null,
    });

    mockGetItemAsync.mockResolvedValueOnce(JSON.stringify(storedSession));

    const loaded = await loadStoredSession();

    expect(loaded).toEqual({
      session: expect.objectContaining({
        accessToken: storedSession.accessToken,
        refreshToken: null,
        user: {
          id: null,
          name: null,
          email: "italo@auraxis.dev",
          emailConfirmed: false,
        },
        authenticatedAt: expect.any(String),
        expiresAt: "2100-01-01T00:00:00.000Z",
      }),
      source: "canonical",
      invalidStoredPayload: false,
    });
  });

  it("faz fallback para a sessao legada quando o payload canônico está inválido", async () => {
    mockGetItemAsync
      .mockResolvedValueOnce("{invalid-json")
      .mockResolvedValueOnce("legacy-token")
      .mockResolvedValueOnce("italo@auraxis.dev");

    const loaded = await loadStoredSession();

    expect(loaded).toEqual({
      session: expect.objectContaining({
        accessToken: "legacy-token",
        refreshToken: null,
        user: {
          id: null,
          name: null,
          email: "italo@auraxis.dev",
          emailConfirmed: false,
        },
      }),
      source: "legacy",
      invalidStoredPayload: true,
    });
  });

  it("marca payload inválido sem fallback legado como inconsistente", async () => {
    mockGetItemAsync
      .mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 123,
          user: null,
        }),
      )
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const loaded = await loadStoredSession();

    expect(loaded).toEqual({
      session: null,
      source: "none",
      invalidStoredPayload: true,
    });
  });

  it("retorna source none quando nao existe nenhuma sessao salva", async () => {
    mockGetItemAsync.mockResolvedValue(null);

    const loaded = await loadStoredSession();

    expect(loaded).toEqual({
      session: null,
      source: "none",
      invalidStoredPayload: false,
    });
  });

  it("persiste a sessao normalizada apenas no storage canônico", async () => {
    await persistStoredSession(
      makeStoredSession({
        accessToken: createJwt({ exp: 4_102_444_800 }),
        authenticatedAt: null,
        expiresAt: null,
      }),
    );

    expect(mockSetItemAsync).toHaveBeenCalledTimes(1);
    expect(mockSetItemAsync).toHaveBeenCalledWith(
      "auraxis.session",
      expect.stringContaining("\"authenticatedAt\""),
    );
  });

  it("limpa apenas os artefatos legados quando requisitado", async () => {
    await clearLegacyStoredSession();

    expect(mockDeleteItemAsync).toHaveBeenCalledTimes(2);
    expect(mockDeleteItemAsync).toHaveBeenNthCalledWith(
      1,
      "auraxis.access-token",
    );
    expect(mockDeleteItemAsync).toHaveBeenNthCalledWith(
      2,
      "auraxis.user-email",
    );
  });

  it("limpa o storage canônico e legado no sign-out", async () => {
    await clearStoredSession();

    expect(mockDeleteItemAsync).toHaveBeenCalledTimes(3);
    expect(mockDeleteItemAsync).toHaveBeenNthCalledWith(1, "auraxis.session");
    expect(mockDeleteItemAsync).toHaveBeenNthCalledWith(2, "auraxis.access-token");
    expect(mockDeleteItemAsync).toHaveBeenNthCalledWith(3, "auraxis.user-email");
  });
});
