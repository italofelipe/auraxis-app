import {
  findConsoleUsageViolations,
  findDirectAppLoggerImportViolations,
} from "./check-client-logging-governance.cjs";

describe("check-client-logging-governance", () => {
  it("aceita baseline limpo com domain loggers e sem console ad-hoc", () => {
    const codeFiles = [
      {
        relativePath: "core/shell/use-app-startup.ts",
        fileContent:
          'import { startupLogger } from "@/core/telemetry/domain-loggers";\nstartupLogger.log("startup.ready");',
      },
      {
        relativePath: "app/services/sentry.ts",
        fileContent: 'console.warn("[Sentry] DSN not configured — skipping initialization");',
      },
      {
        relativePath: "core/telemetry/domain-loggers.ts",
        fileContent:
          'import { appLogger } from "@/core/telemetry/app-logger";\nappLogger.info({ domain: "startup", event: "startup.ready" });',
      },
    ];

    expect(findConsoleUsageViolations(codeFiles)).toEqual([]);
    expect(findDirectAppLoggerImportViolations(codeFiles)).toEqual([]);
  });

  it("bloqueia console fora da boundary canônica", () => {
    const errors = findConsoleUsageViolations([
      {
        relativePath: "core/shell/use-app-startup.ts",
        fileContent: 'console.info("startup");',
      },
    ]);

    expect(errors).toEqual([
      "console usage outside canonical logging boundary: core/shell/use-app-startup.ts:1",
    ]);
  });

  it("bloqueia import direto de appLogger fora de domain-loggers", () => {
    const errors = findDirectAppLoggerImportViolations([
      {
        relativePath: "core/shell/use-app-startup.ts",
        fileContent:
          'import { appLogger } from "@/core/telemetry/app-logger";',
      },
    ]);

    expect(errors).toEqual([
      "direct appLogger import outside domain logging boundary: core/shell/use-app-startup.ts:1",
    ]);
  });
});
