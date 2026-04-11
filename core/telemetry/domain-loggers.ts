import { appLogger } from "@/core/telemetry/app-logger";
import { getAppEventLoggingPolicy } from "@/core/telemetry/logging-policy";
import type {
  AppLogLevel,
  AppLogOptions,
  AppTelemetryDomain,
  AppTelemetryEventByDomain,
} from "@/core/telemetry/types";

export interface AppDomainLogger<TDomain extends AppTelemetryDomain> {
  log: <TEvent extends AppTelemetryEventByDomain<TDomain>>(
    event: TEvent,
    options?: AppLogOptions & {
      readonly level?: AppLogLevel;
    },
  ) => void;
}

const assertEventDomain = (
  domain: AppTelemetryDomain,
  event: string,
): void => {
  if (event.startsWith(`${domain}.`)) {
    return;
  }

  throw new Error(
    `Telemetry event '${event}' does not belong to domain '${domain}'.`,
  );
};

export const createDomainLogger = <TDomain extends AppTelemetryDomain>(
  domain: TDomain,
): AppDomainLogger<TDomain> => {
  return {
    log: <TEvent extends AppTelemetryEventByDomain<TDomain>>(
      event: TEvent,
      options: AppLogOptions & {
        readonly level?: AppLogLevel;
      } = {},
    ): void => {
      assertEventDomain(domain, event);
      const policy = getAppEventLoggingPolicy(event);
      const resolvedLevel = options.level ?? policy.level;

      appLogger[resolvedLevel]({
        domain,
        event,
        context: options.context,
        error: options.error,
        captureInSentry: options.captureInSentry,
      });
    },
  };
};

export const authLogger = createDomainLogger("auth");
export const checkoutLogger = createDomainLogger("checkout");
export const navigationLogger = createDomainLogger("navigation");
export const networkLogger = createDomainLogger("network");
export const observabilityLogger = createDomainLogger("observability");
export const performanceLogger = createDomainLogger("performance");
export const runtimeLogger = createDomainLogger("runtime");
export const startupLogger = createDomainLogger("startup");
