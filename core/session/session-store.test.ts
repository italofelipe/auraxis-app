import {
  clearLegacyStoredSession,
  clearStoredSession,
  loadStoredSession,
  persistStoredSession,
} from "@/core/session/session-storage";
import { useSessionStore } from "@/core/session/session-store";
import {
  makeStoredSession,
  resetRuntimeStores,
} from "@/shared/testing/runtime-fixtures";

jest.mock("@/core/telemetry/app-logger", () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@/core/session/session-storage", () => ({
  clearLegacyStoredSession: jest.fn().mockResolvedValue(undefined),
  loadStoredSession: jest.fn(),
  persistStoredSession: jest.fn(),
  clearStoredSession: jest.fn().mockResolvedValue(undefined),
}));

const { appLogger } = jest.requireMock("@/core/telemetry/app-logger") as {
  appLogger: {
    info: jest.Mock;
  };
};

const mockClearLegacyStoredSession = jest.mocked(clearLegacyStoredSession);
const mockLoadStoredSession = jest.mocked(loadStoredSession);
const mockPersistStoredSession = jest.mocked(persistStoredSession);
const mockClearStoredSession = jest.mocked(clearStoredSession);

// eslint-disable-next-line max-lines-per-function
describe("session store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRuntimeStores();
  });

  it("invalida a sessao expirada durante o bootstrap", async () => {
    mockLoadStoredSession.mockResolvedValue({
      session: makeStoredSession({
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
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "startup",
      event: "startup.session_rehydrated",
      context: {
        authenticated: false,
        source: "canonical",
        migratedLegacySession: false,
        invalidStoredPayload: false,
        invalidationReason: "expired",
      },
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
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "startup",
      event: "startup.session_rehydrated",
      context: {
        authenticated: false,
        source: "none",
        migratedLegacySession: false,
        invalidStoredPayload: true,
        invalidationReason: "bootstrap-invalid",
      },
    });
  });

  it("enriquece a sessao no signIn e limpa falhas anteriores", async () => {
    useSessionStore.setState((state) => ({
      ...state,
      authFailureReason: "unauthorized",
      lastInvalidatedAt: "2026-04-08T09:59:00.000Z",
    }));

    await useSessionStore.getState().signIn(
      makeStoredSession({
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
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "auth",
      event: "auth.session_established",
      context: {
        hasRefreshToken: true,
        emailConfirmed: true,
        hasUserId: true,
      },
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
      session: makeStoredSession(),
      source: "legacy",
      invalidStoredPayload: false,
    });

    await useSessionStore.getState().bootstrapSession();

    expect(mockPersistStoredSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "header.payload.signature",
      }),
    );
    expect(mockClearLegacyStoredSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      hydrated: true,
      isAuthenticated: true,
      userEmail: "italo@auraxis.dev",
    });
    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "startup",
      event: "startup.session_rehydrated",
      context: {
        authenticated: true,
        source: "legacy",
        migratedLegacySession: true,
        invalidStoredPayload: false,
        hasRefreshToken: true,
        emailConfirmed: true,
      },
    });
  });

  it("seta a sessao explicitamente e mantém o estado autenticado", async () => {
    const session = makeStoredSession();

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
    await useSessionStore.getState().setSession(makeStoredSession());
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
    await useSessionStore.getState().setSession(makeStoredSession());
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

  it("permite dispensar o aviso de falha sem restaurar a sessao", async () => {
    await useSessionStore.getState().invalidateSession("unauthorized");

    useSessionStore.getState().dismissAuthFailure();

    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: null,
      lastInvalidatedAt: expect.any(String),
    });
  });

  it("signOut usa invalidacao manual por padrão", async () => {
    await useSessionStore.getState().setSession(makeStoredSession());
    mockClearStoredSession.mockClear();

    await useSessionStore.getState().signOut();

    expect(mockClearStoredSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: "manual",
    });
  });

  describe("rotateTokens", () => {
    it("persiste novos tokens atomicamente preservando o usuario", async () => {
      const baseSession = makeStoredSession({
        accessToken: "access-1",
        refreshToken: "refresh-1",
      });
      mockLoadStoredSession.mockResolvedValue({
        session: baseSession,
        source: "canonical",
        invalidStoredPayload: false,
      });
      await useSessionStore.getState().bootstrapSession();
      mockPersistStoredSession.mockClear();

      await useSessionStore
        .getState()
        .rotateTokens("access-2", "refresh-2", "2099-01-01T00:00:00.000Z");

      expect(mockPersistStoredSession).toHaveBeenCalledTimes(1);
      const persisted = mockPersistStoredSession.mock.calls[0]?.[0];
      expect(persisted).toMatchObject({
        accessToken: "access-2",
        refreshToken: "refresh-2",
        expiresAt: "2099-01-01T00:00:00.000Z",
        user: baseSession.user,
      });
      expect(useSessionStore.getState()).toMatchObject({
        accessToken: "access-2",
        refreshToken: "refresh-2",
        isAuthenticated: true,
      });
    });

    it("recusa rotacao quando nao ha usuario na sessao", async () => {
      await useSessionStore.getState().rotateTokens("access-2", "refresh-2");
      expect(mockPersistStoredSession).not.toHaveBeenCalled();
      expect(useSessionStore.getState().accessToken).toBeNull();
    });
  });
});
