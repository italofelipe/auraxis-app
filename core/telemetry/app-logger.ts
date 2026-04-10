import {
  captureSentryException,
  recordSentryBreadcrumb,
} from "@/app/services/sentry";
import { buildAppOperationalContext } from "@/core/telemetry/operational-context";
import { sanitizeTelemetryContext } from "@/core/telemetry/sanitization";
import type {
  AppBreadcrumb,
  AppLogEntry,
  AppLogLevel,
} from "@/core/telemetry/types";

const formatMessage = (entry: Pick<AppLogEntry, "domain" | "event">): string => {
  return `[auraxis:${entry.domain}] ${entry.event}`;
};

const consoleMethodByLevel: Record<
  AppLogLevel,
  (...args: ReadonlyArray<unknown>) => void
> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const shouldWriteDevConsole = (level: AppLogLevel): boolean => {
  if (typeof process !== "undefined" && process.env.JEST_WORKER_ID) {
    return false;
  }

  return __DEV__ || level === "warn" || level === "error";
};

const shouldRecordBreadcrumb = (level: AppLogLevel): boolean => {
  return level !== "debug";
};

const mergeContext = (
  context: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  return {
    ...buildAppOperationalContext(),
    ...(context ?? {}),
  };
};

const toBreadcrumb = (
  level: AppLogLevel,
  entry: AppLogEntry,
  context: Record<string, unknown> | undefined,
): AppBreadcrumb => {
  return {
    category: entry.domain,
    message: entry.event,
    level,
    data: context,
  };
};

export interface AppLogger {
  debug: (entry: AppLogEntry) => void;
  info: (entry: AppLogEntry) => void;
  warn: (entry: AppLogEntry) => void;
  error: (entry: AppLogEntry) => void;
}

export const createAppLogger = (): AppLogger => {
  const emit = (level: AppLogLevel, entry: AppLogEntry): void => {
    const context = sanitizeTelemetryContext(mergeContext(entry.context));

    if (shouldRecordBreadcrumb(level)) {
      recordSentryBreadcrumb(toBreadcrumb(level, entry, context));
    }

    if (shouldWriteDevConsole(level)) {
      const consoleMethod = consoleMethodByLevel[level];
      if (context) {
        consoleMethod(formatMessage(entry), context);
      } else {
        consoleMethod(formatMessage(entry));
      }
    }

    if (level === "error" && entry.error && entry.captureInSentry !== false) {
      captureSentryException(entry.error);
    }
  };

  return {
    debug: (entry: AppLogEntry): void => {
      emit("debug", entry);
    },
    info: (entry: AppLogEntry): void => {
      emit("info", entry);
    },
    warn: (entry: AppLogEntry): void => {
      emit("warn", entry);
    },
    error: (entry: AppLogEntry): void => {
      emit("error", entry);
    },
  };
};

export const appLogger = createAppLogger();
