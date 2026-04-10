import * as Sentry from "@sentry/react-native";

import {
  captureSentryException,
  initSentry,
  recordSentryBreadcrumb,
  resetSentryRuntimeForTests,
  syncSentryOperationalContext,
  sanitizeSentryEvent,
} from "@/app/services/sentry";

const expoConfigMock = {
  extra: {} as Record<string, unknown>,
};

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: expoConfigMock,
  },
}));

jest.mock("@sentry/react-native", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  init: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  wrap: jest.fn((component) => component),
}));

const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;
const mockSentryInit = Sentry.init as jest.Mock;
const mockSetContext = Sentry.setContext as jest.Mock;
const mockSetTag = Sentry.setTag as jest.Mock;

describe("initSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSentryRuntimeForTests();
    expoConfigMock.extra = {};
  });

  it("does nothing when DSN is empty", () => {
    expoConfigMock.extra = {
      sentryDsn: "",
      appEnv: "development",
    };

    expect(() => initSentry()).not.toThrow();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("does nothing when DSN is undefined", () => {
    expoConfigMock.extra = {};

    expect(() => initSentry()).not.toThrow();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("calls Sentry.init when DSN is present", () => {
    expoConfigMock.extra = {
      sentryDsn: "https://test-dsn@o0.ingest.sentry.io/0",
      appEnv: "production",
    };

    initSentry();

    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://test-dsn@o0.ingest.sentry.io/0",
        environment: "production",
        sendDefaultPii: false,
      }),
    );
  });

  it("does not call console.error when DSN is missing", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => initSentry()).not.toThrow();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("redacts sensitive values before enviar eventos ao Sentry", () => {
    const event = sanitizeSentryEvent({
      user: {
        email: "italo@auraxis.dev",
        ip_address: "127.0.0.1",
      },
      request: {
        url: "auraxisapp://assinatura?token=secret&status=paid",
        headers: {
          Authorization: "Bearer token",
          "X-Observability-Key": "public-key",
          Cookie: "session=abc",
        },
      },
    } as unknown as Sentry.Event);

    expect(event.user).toEqual({});
    expect(event.request?.url).toBe(
      "auraxisapp://assinatura?token=%3Credacted%3E&status=paid",
    );
    expect(event.request?.headers).toEqual({
      Authorization: "<redacted>",
      "X-Observability-Key": "<redacted>",
      Cookie: "<redacted>",
    });
  });

  it("nao registra breadcrumb quando o sentry ainda nao foi inicializado", () => {
    recordSentryBreadcrumb({
      category: "runtime",
      message: "runtime.started",
      level: "info",
      data: {
        token: "secret",
      },
    });

    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it("registra breadcrumb sanitizado quando o sentry esta ativo", () => {
    expoConfigMock.extra = {
      sentryDsn: "https://test-dsn@o0.ingest.sentry.io/0",
      appEnv: "production",
    };
    initSentry();

    recordSentryBreadcrumb({
      category: "network",
      message: "network.request_failed",
      level: "warn",
      data: {
        accessToken: "secret-token",
        url: "auraxisapp://assinatura?token=checkout-secret",
      },
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith({
      category: "network",
      message: "network.request_failed",
      level: "warning",
      data: {
        accessToken: "<redacted>",
        url: "auraxisapp://assinatura?token=%3Credacted%3E",
      },
    });
  });

  it("captura excecao somente quando o sentry esta ativo", () => {
    captureSentryException(new Error("noop"));
    expect(mockCaptureException).not.toHaveBeenCalled();

    expoConfigMock.extra = {
      sentryDsn: "https://test-dsn@o0.ingest.sentry.io/0",
      appEnv: "production",
    };
    initSentry();

    const error = new Error("boom");
    captureSentryException(error);

    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });

  it("sincroniza contexto operacional sanitizado quando o sentry esta ativo", () => {
    syncSentryOperationalContext({
      release: {
        appEnv: "production",
        appVersion: "1.3.0",
        platform: "ios",
        apiMode: "live",
      },
      runtime: {
        connectivityStatus: "degraded",
        runtimeDegradedReason: "offline",
      },
      session: {
        authenticated: true,
        email: "italo@auraxis.dev",
      },
    });
    expect(mockSetContext).not.toHaveBeenCalled();

    expoConfigMock.extra = {
      sentryDsn: "https://test-dsn@o0.ingest.sentry.io/0",
      appEnv: "production",
    };
    initSentry();

    syncSentryOperationalContext({
      release: {
        appEnv: "production",
        appVersion: "1.3.0",
        platform: "ios",
        apiMode: "live",
      },
      runtime: {
        connectivityStatus: "degraded",
        runtimeDegradedReason: "offline",
      },
      session: {
        authenticated: true,
        email: "italo@auraxis.dev",
      },
    });

    expect(mockSetContext).toHaveBeenNthCalledWith(1, "release", {
      appEnv: "production",
      appVersion: "1.3.0",
      platform: "ios",
      apiMode: "live",
    });
    expect(mockSetContext).toHaveBeenNthCalledWith(2, "runtime", {
      connectivityStatus: "degraded",
      runtimeDegradedReason: "offline",
    });
    expect(mockSetContext).toHaveBeenNthCalledWith(3, "session", {
      authenticated: true,
      email: "<redacted>",
    });
    expect(mockSetTag).toHaveBeenCalledWith("app_env", "production");
    expect(mockSetTag).toHaveBeenCalledWith("app_version", "1.3.0");
    expect(mockSetTag).toHaveBeenCalledWith("platform", "ios");
    expect(mockSetTag).toHaveBeenCalledWith("api_mode", "live");
    expect(mockSetTag).toHaveBeenCalledWith("authenticated", "true");
    expect(mockSetTag).toHaveBeenCalledWith(
      "connectivity_status",
      "degraded",
    );
  });
});
