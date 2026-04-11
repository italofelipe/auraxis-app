import { appLogger } from "@/core/telemetry/app-logger";
import {
  createDomainLogger,
  runtimeLogger,
} from "@/core/telemetry/domain-loggers";

jest.mock("@/core/telemetry/app-logger", () => ({
  appLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("domain loggers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolve o nivel padrão a partir da política do evento", () => {
    runtimeLogger.log("runtime.revalidation_started", {
      context: {
        reason: "foreground",
      },
    });

    expect(appLogger.info).toHaveBeenCalledWith({
      domain: "runtime",
      event: "runtime.revalidation_started",
      context: {
        reason: "foreground",
      },
      error: undefined,
      captureInSentry: undefined,
    });
  });

  it("permite override explícito de nível quando o callsite precisa variar", () => {
    runtimeLogger.log("runtime.reachability_probe_completed", {
      level: "warn",
      context: {
        reason: "foreground",
        status: "offline",
        degradedReason: "offline",
      },
    });

    expect(appLogger.warn).toHaveBeenCalledWith({
      domain: "runtime",
      event: "runtime.reachability_probe_completed",
      context: {
        reason: "foreground",
        status: "offline",
        degradedReason: "offline",
      },
      error: undefined,
      captureInSentry: undefined,
    });
  });

  it("rejeita evento fora do domínio canônico", () => {
    const startupDomainLogger = createDomainLogger("startup");

    expect(() => {
      startupDomainLogger.log(
        "runtime.revalidation_started" as never,
      );
    }).toThrow(
      "Telemetry event 'runtime.revalidation_started' does not belong to domain 'startup'.",
    );
  });
});
