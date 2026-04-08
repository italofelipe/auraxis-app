import {
  createAppLogger,
} from "@/core/telemetry/app-logger";

jest.mock("@/app/services/sentry", () => ({
  captureSentryException: jest.fn(),
  recordSentryBreadcrumb: jest.fn(),
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
      event: "auth.session_checked",
      context: {
        email: "italo@auraxis.dev",
        accessToken: "secret-token",
        url: "auraxisapp://assinatura?token=secret&status=paid",
      },
    });

    expect(recordSentryBreadcrumb).toHaveBeenCalledWith({
      category: "auth",
      message: "auth.session_checked",
      level: "info",
      data: {
        email: "<redacted>",
        accessToken: "<redacted>",
        url: "auraxisapp://assinatura?token=%3Credacted%3E&status=paid",
      },
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
      data: {
        path: "/dashboard",
      },
    });
    expect(captureSentryException).toHaveBeenCalledWith(error);
  });

  it("permite suprimir captura de erro mantendo breadcrumb", () => {
    const logger = createAppLogger();
    const error = new Error("expected auth failure");

    logger.error({
      domain: "auth",
      event: "auth.expected_failure",
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
      event: "runtime.noisy_debug",
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
      event: "runtime.degraded_mode",
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[auraxis:runtime] runtime.degraded_mode",
    );
  });

  it("nao escreve info no console em runtime de producao fora de Jest", () => {
    runtimeGlobals.__DEV__ = false;
    delete process.env.JEST_WORKER_ID;
    const logger = createAppLogger();

    logger.info({
      domain: "runtime",
      event: "runtime.ready",
      context: {
        mode: "production",
      },
    });

    expect(console.info).not.toHaveBeenCalled();
  });
});
