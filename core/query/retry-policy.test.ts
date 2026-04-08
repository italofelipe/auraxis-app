import { ApiError } from "@/core/http/api-error";
import { resolveRetryDelay, shouldRetryQuery } from "@/core/query/retry-policy";
import { useAppShellStore } from "@/core/shell/app-shell-store";

const setConnectivityStatus = (
  status: "unknown" | "online" | "offline" | "degraded",
): void => {
  useAppShellStore.setState({
    connectivityStatus: status,
  });
};

describe("retryPolicy", () => {
  beforeEach(() => {
    setConnectivityStatus("online");
  });

  it("nao faz retry quando o app esta offline", () => {
    setConnectivityStatus("offline");

    const error = new ApiError({
      message: "Unavailable",
      status: 503,
    });

    expect(shouldRetryQuery(0, error)).toBe(false);
  });

  it("faz retry para erros retryable ate o limite configurado", () => {
    const error = new ApiError({
      message: "Unavailable",
      status: 503,
    });

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(false);
  });

  it("nao faz retry para erros autenticados ou explicitamente nao-retryable", () => {
    const unauthorized = new ApiError({
      message: "Forbidden",
      status: 403,
    });
    const nonRetryable = new ApiError({
      message: "Validation failed",
      status: 422,
      details: {
        retryable: false,
      },
    });

    expect(shouldRetryQuery(0, unauthorized)).toBe(false);
    expect(shouldRetryQuery(0, nonRetryable)).toBe(false);
  });

  it("aplica backoff exponencial com teto fixo", () => {
    expect(resolveRetryDelay(0)).toBe(1_000);
    expect(resolveRetryDelay(1)).toBe(2_000);
    expect(resolveRetryDelay(2)).toBe(4_000);
    expect(resolveRetryDelay(3)).toBe(5_000);
    expect(resolveRetryDelay(4)).toBe(5_000);
  });
});
