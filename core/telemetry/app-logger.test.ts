import {
  createAppLogger,
} from "@/core/telemetry/app-logger";

jest.mock("@/app/services/sentry", () => ({
  captureSentryException: jest.fn(),
  recordSentryBreadcrumb: jest.fn(),
}));

jest.mock("@/core/telemetry/operational-context", () => ({
  buildAppOperationalContext: jest.fn(() => ({
    appEnv: "test",
    appVersion: "1.3.0",
    nativeBuildVersion: "20260410",
    executionEnvironment: "storeClient",
    appOwnership: "standalone",
    easProjectId: "project-1",
    platform: "ios",
    platformVersion: "18.1",
    apiMode: "live",
    apiContractVersion: "v2",
    sessionHydrated: false,
    authenticated: false,
    authFailureReason: null,
    connectivityStatus: "unknown",
    runtimeDegradedReason: null,
    appState: "unknown",
    startupReady: false,
  })),
}));

const {
  captureSentryException,
  recordSentryBreadcrumb,
} = jest.requireMock("@/app/services/sentry") as {
  captureSentryException: jest.Mock;
  recordSentryBreadcrumb: jest.Mock;
};

describe("appLogger", () => {
  const runtimeGlobals = globalThis as typeof globalThis & {
    __DEV__?: boolean;
  };
  const originalDev = runtimeGlobals.__DEV__;
  const originalJestWorkerId = process.env.JEST_WORKER_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    runtimeGlobals.__DEV__ = originalDev;
    process.env.JEST_WORKER_ID = originalJestWorkerId;
    jest.restoreAllMocks();
  });

  it("redige contexto sensível antes de registrar breadcrumb", () => {
    const logger = createAppLogger();

    logger.info({
      domain: "auth",
      event: "auth.session_established",
      context: {
        email: "italo@auraxis.dev",
        accessToken: "secret-token",
        url: "auraxisapp://assinatura?token=secret&status=paid",
      },
    });

    expect(recordSentryBreadcrumb).toHaveBeenCalledWith({
      category: "auth",
      message: "auth.session_established",
      level: "info",
      data: expect.objectContaining({
        email: "<redacted>",
        accessToken: "<redacted>",
        url: "auraxisapp://assinatura?token=%3Credacted%3E&status=paid",
        appEnv: "test",
        authenticated: false,
        connectivityStatus: "unknown",
      }),
    });
  });

  it("captura exceções no Sentry em logs de erro por padrão", () => {
    const logger = createAppLogger();
    const error = new Error("network down");

    logger.error({
      domain: "network",
      event: "network.request_failed",
      error,
      context: {
        path: "/dashboard",
      },
    });

    expect(recordSentryBreadcrumb).toHaveBeenCalledWith({
      category: "network",
      message: "network.request_failed",
      level: "error",
      data: expect.objectContaining({
        path: "/dashboard",
        appEnv: "test",
      }),
    });
    expect(captureSentryException).toHaveBeenCalledWith(error);
  });

  it("permite suprimir captura de erro mantendo breadcrumb", () => {
    const logger = createAppLogger();
    const error = new Error("expected auth failure");

    logger.error({
      domain: "auth",
      event: "auth.session_invalidated",
      error,
      captureInSentry: false,
    });

    expect(recordSentryBreadcrumb).toHaveBeenCalledTimes(1);
    expect(captureSentryException).not.toHaveBeenCalled();
  });

  it("nao envia breadcrumb para logs debug", () => {
    const logger = createAppLogger();

    logger.debug({
      domain: "runtime",
      event: "runtime.reachability_probe_started",
    });

    expect(recordSentryBreadcrumb).not.toHaveBeenCalled();
  });

  it("escreve no console para warnings em runtime fora de Jest e sem contexto", () => {
    runtimeGlobals.__DEV__ = false;
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    let isolatedLogger: ReturnType<typeof createAppLogger> | null = null;

    jest.isolateModules(() => {
      const isolatedModule = require("@/core/telemetry/app-logger") as {
        createAppLogger: typeof createAppLogger;
      };
      isolatedLogger = isolatedModule.createAppLogger();
    });

    isolatedLogger!.warn({
      domain: "runtime",
      event: "runtime.revalidation_failed",
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[auraxis:runtime] runtime.revalidation_failed",
      expect.objectContaining({
        appEnv: "test",
        connectivityStatus: "unknown",
      }),
    );
  });

  it("nao escreve info no console em runtime de producao fora de Jest", () => {
    runtimeGlobals.__DEV__ = false;
    delete process.env.JEST_WORKER_ID;
    const logger = createAppLogger();

    logger.info({
      domain: "runtime",
      event: "runtime.revalidation_completed",
      context: {
        mode: "production",
      },
    });

    expect(console.info).not.toHaveBeenCalled();
  });
});
