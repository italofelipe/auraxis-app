/**
 * Request-ID propagation context for app.
 *
 * Stores the most recent `x-request-id` returned by `auraxis-api` so that
 * subsequent client-side logs can be correlated with the corresponding
 * backend request. Maintained as a module-level singleton — single client
 * per runtime, so sharing is safe.
 *
 * Pairs with the future api side of Fase 3.2 (RequestIDMiddleware echoing
 * the id in every response). Until that lands, `currentRequestId()` returns
 * undefined and consumers gracefully omit the field.
 */

import type { AxiosResponse } from "axios";

let _currentRequestId: string | undefined;

/**
 * Returns the most recently captured request_id, or undefined.
 *
 * @returns Current request_id or undefined.
 */
export const currentRequestId = (): string | undefined => {
  return _currentRequestId;
};

/**
 * Sets the active request_id. Empty / whitespace-only ids are ignored.
 *
 * @param id Candidate request_id (typically from `x-request-id` header).
 */
export const setRequestId = (id: string | undefined): void => {
  if (typeof id !== "string" || id.trim().length === 0) {
    return;
  }
  _currentRequestId = id;
};

/**
 * Test utility — resets the captured id between tests.
 */
export const resetRequestIdForTests = (): void => {
  _currentRequestId = undefined;
};

/**
 * Axios response interceptor that captures the `x-request-id` header and
 * makes it available via {@link currentRequestId}. Re-exports the response
 * unchanged.
 *
 * Register on the HTTP client to enable propagation:
 *   client.interceptors.response.use(captureRequestIdInterceptor);
 *
 * @param response Axios response.
 * @returns The same response (unchanged).
 */
export const captureRequestIdInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  const headers = response.headers;
  if (headers && typeof headers === "object") {
    const id = (headers as Record<string, unknown>)["x-request-id"];
    if (typeof id === "string") {
      setRequestId(id);
    }
  }
  return response;
};

/**
 * Helper to inject the current request_id into a logger context.
 * Returns the context unchanged when no id is captured.
 *
 * Usage:
 *   appLogger.info({
 *     domain: "auth",
 *     event: "login.attempt",
 *     context: withCurrentRequestId({ email_hash: hashOf(email) }),
 *   });
 *
 * @param context Existing context object (may be undefined).
 * @returns Context augmented with `request_id` when one is captured.
 */
export const withCurrentRequestId = (
  context: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined => {
  const id = currentRequestId();
  if (!id) {
    return context;
  }
  return { ...(context ?? {}), request_id: id };
};
