import {
  clearStoredSession,
  loadStoredSession,
  persistStoredSession,
} from "@/core/session/session-storage";
import { useSessionStore } from "@/core/session/session-store";
import type { StoredSession } from "@/core/session/types";

jest.mock("@/core/session/session-storage", () => ({
  loadStoredSession: jest.fn(),
  persistStoredSession: jest.fn(),
  clearStoredSession: jest.fn().mockResolvedValue(undefined),
}));

const mockLoadStoredSession = jest.mocked(loadStoredSession);
const mockPersistStoredSession = jest.mocked(persistStoredSession);
const mockClearStoredSession = jest.mocked(clearStoredSession);

const resetSessionStore = (): void => {
  useSessionStore.setState((state) => ({
    ...state,
    accessToken: null,
    refreshToken: null,
    user: null,
    userEmail: null,
    authenticatedAt: null,
    expiresAt: null,
    authFailureReason: null,
    lastValidatedAt: null,
    lastInvalidatedAt: null,
    hydrated: false,
    isAuthenticated: false,
  }));
};

const createStoredSession = (
  overrides: Partial<StoredSession> = {},
): StoredSession => {
  return {
    accessToken: "header.payload.signature",
    refreshToken: "refresh-token",
    user: {
      id: "user-1",
      name: "Italo",
      email: "italo@auraxis.dev",
      emailConfirmed: true,
    },
    authenticatedAt: "2026-04-08T10:00:00.000Z",
    expiresAt: "2099-04-08T12:00:00.000Z",
    ...overrides,
  };
};

describe("session store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionStore();
  });

  it("invalida a sessao expirada durante o bootstrap", async () => {
    mockLoadStoredSession.mockResolvedValue({
      session: createStoredSession({
        expiresAt: "2026-04-08T09:00:00.000Z",
      }),
      source: "canonical",
      invalidStoredPayload: false,
    });

    await useSessionStore.getState().bootstrapSession();

    expect(mockClearStoredSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      hydrated: true,
      isAuthenticated: false,
      authFailureReason: "expired",
    });
  });

  it("marca payload invalido de storage como bootstrap-invalid", async () => {
    mockLoadStoredSession.mockResolvedValue({
      session: null,
      source: "none",
      invalidStoredPayload: true,
    });

    await useSessionStore.getState().bootstrapSession();

    expect(mockClearStoredSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      hydrated: true,
      isAuthenticated: false,
      authFailureReason: "bootstrap-invalid",
    });
  });

  it("enriquece a sessao no signIn e limpa falhas anteriores", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      authFailureReason: "unauthorized",
      lastInvalidatedAt: "2026-04-08T09:59:00.000Z",
    }));

    await useSessionStore.getState().signIn(
      createStoredSession({
        authenticatedAt: null,
        expiresAt: null,
      }),
    );

    expect(mockPersistStoredSession).toHaveBeenCalledTimes(1);
    expect(mockPersistStoredSession.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        authenticatedAt: expect.any(String),
      }),
    );
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: true,
      authFailureReason: null,
    });
  });

  it("ignora bootstrap redundante quando o store já está hidratado", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      hydrated: true,
    }));

    await useSessionStore.getState().bootstrapSession();

    expect(mockLoadStoredSession).not.toHaveBeenCalled();
  });

  it("aceita signIn com access token puro e cria uma sessao mínima", async () => {
    await useSessionStore
      .getState()
      .signIn("plain-access-token", "italo@auraxis.dev", "Italo");

    expect(mockPersistStoredSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "plain-access-token",
        refreshToken: null,
        user: {
          id: null,
          name: "Italo",
          email: "italo@auraxis.dev",
          emailConfirmed: false,
        },
      }),
    );
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: true,
      userEmail: "italo@auraxis.dev",
    });
  });

  it("regrava a sessao legada no storage canônico durante o bootstrap", async () => {
    mockLoadStoredSession.mockResolvedValue({
      session: createStoredSession(),
      source: "legacy",
      invalidStoredPayload: false,
    });

    await useSessionStore.getState().bootstrapSession();

    expect(mockPersistStoredSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "header.payload.signature",
      }),
    );
    expect(useSessionStore.getState()).toMatchObject({
      hydrated: true,
      isAuthenticated: true,
      userEmail: "italo@auraxis.dev",
    });
  });

  it("seta a sessao explicitamente e mantém o estado autenticado", async () => {
    const session = createStoredSession();

    await useSessionStore.getState().setSession(session);

    expect(mockPersistStoredSession).toHaveBeenCalledWith(session);
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: true,
      userEmail: "italo@auraxis.dev",
    });
  });

  it("limpa a sessao no setSession(null)", async () => {
    await useSessionStore.getState().setSession(null);

    expect(mockClearStoredSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
    });
  });

  it("nao persiste updateUser sem sessao autenticada", () => {
    useSessionStore.getState().updateUser({
      id: "user-2",
      name: "Novo Nome",
      email: "novo@auraxis.dev",
      emailConfirmed: true,
    });

    expect(mockPersistStoredSession).not.toHaveBeenCalled();
  });

  it("persiste updateUser preservando metadados da sessao", async () => {
    await useSessionStore.getState().setSession(createStoredSession());
    mockPersistStoredSession.mockClear();

    useSessionStore.getState().updateUser({
      id: "user-1",
      name: "Auraxis",
      email: "auraxis@auraxis.dev",
      emailConfirmed: true,
    });

    expect(mockPersistStoredSession).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticatedAt: "2026-04-08T10:00:00.000Z",
        expiresAt: "2099-04-08T12:00:00.000Z",
        user: expect.objectContaining({
          email: "auraxis@auraxis.dev",
        }),
      }),
    );
    expect(useSessionStore.getState()).toMatchObject({
      userEmail: "auraxis@auraxis.dev",
    });
  });

  it("marca a sessao como validada sem derrubar autenticacao", async () => {
    await useSessionStore.getState().setSession(createStoredSession());
    useSessionStore.setState((state) => ({
      ...state,
      authFailureReason: "unauthorized",
    }));

    useSessionStore
      .getState()
      .markSessionValidated("2026-04-08T11:30:00.000Z");

    expect(useSessionStore.getState()).toMatchObject({
      lastValidatedAt: "2026-04-08T11:30:00.000Z",
      authFailureReason: null,
      isAuthenticated: true,
    });
  });

  it("signOut usa invalidacao manual por padrão", async () => {
    await useSessionStore.getState().setSession(createStoredSession());
    mockClearStoredSession.mockClear();

    await useSessionStore.getState().signOut();

    expect(mockClearStoredSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: "manual",
    });
  });
});
