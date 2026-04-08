import { ApiError } from "@/core/http/api-error";
import { useAppShellStore } from "@/core/shell/app-shell-store";

const RETRYABLE_STATUS_CODES = new Set([0, 408, 429, 502, 503, 504]);
const MAX_QUERY_RETRY_ATTEMPTS = 2;
const MAX_UNKNOWN_RETRY_ATTEMPTS = 1;

const readRetryableFlag = (error: ApiError): boolean | null => {
  const retryable = error.details.retryable;
  return typeof retryable === "boolean" ? retryable : null;
};

export const shouldRetryQuery = (
  failureCount: number,
  error: unknown,
): boolean => {
  if (useAppShellStore.getState().connectivityStatus === "offline") {
    return false;
  }

  if (!(error instanceof ApiError)) {
    return failureCount < MAX_UNKNOWN_RETRY_ATTEMPTS;
  }

  const retryableFlag = readRetryableFlag(error);

  if (retryableFlag === false) {
    return false;
  }

  if ([400, 401, 403, 404, 422].includes(error.status)) {
    return false;
  }

  if (retryableFlag === true || RETRYABLE_STATUS_CODES.has(error.status)) {
    return failureCount < MAX_QUERY_RETRY_ATTEMPTS;
  }

  return false;
};

export const resolveRetryDelay = (attemptIndex: number): number => {
  return Math.min(1_000 * 2 ** attemptIndex, 5_000);
};
