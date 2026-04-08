import { createReachabilityService } from "@/core/shell/reachability-service";

describe("reachabilityService", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("retorna online quando o healthcheck responde 200", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    let nowValue = 1_000;
    const service = createReachabilityService({
      fetch: fetchMock as unknown as typeof globalThis.fetch,
      apiBaseUrl: "https://api.auraxis.dev",
      probePath: "/healthz",
      now: (): number => {
        nowValue += 50;
        return nowValue;
      },
    });

    const result = await service.probe();

    expect(fetchMock).toHaveBeenCalledWith("https://api.auraxis.dev/healthz", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: expect.any(Object),
    });
    expect(result).toMatchObject({
      status: "online",
      degradedReason: null,
      statusCode: 200,
    });
  });

  it("retorna degraded quando o healthcheck responde status nao-ok", async () => {
    const service = createReachabilityService({
      fetch: jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }) as unknown as typeof globalThis.fetch,
      apiBaseUrl: "https://api.auraxis.dev",
      probePath: "/healthz",
    });

    const result = await service.probe();

    expect(result).toMatchObject({
      status: "degraded",
      degradedReason: "healthcheck-failed",
      statusCode: 503,
    });
  });

  it("retorna offline quando o fetch falha por erro de rede", async () => {
    const service = createReachabilityService({
      fetch: jest
        .fn()
        .mockRejectedValue(new Error("network failed")) as unknown as typeof globalThis.fetch,
      apiBaseUrl: "https://api.auraxis.dev",
      probePath: "/healthz",
    });

    const result = await service.probe();

    expect(result).toMatchObject({
      status: "offline",
      degradedReason: "offline",
      statusCode: null,
    });
  });

  it("retorna degraded quando o probe expira por timeout", async () => {
    jest.useFakeTimers();

    let rejectFetch: ((reason?: unknown) => void) | null = null;
    const abortController = {
      signal: {},
      abort: jest.fn(() => {
        const abortError = new Error("Request aborted");
        abortError.name = "AbortError";
        rejectFetch?.(abortError);
      }),
    } as unknown as AbortController;

    const fetchMock = jest.fn(
      () =>
        new Promise((_resolve, reject) => {
          rejectFetch = reject;
        }),
    );

    const service = createReachabilityService({
      fetch: fetchMock as unknown as typeof globalThis.fetch,
      apiBaseUrl: "https://api.auraxis.dev",
      probePath: "/healthz",
      timeoutMs: 10,
      createAbortController: (): AbortController => abortController,
    });

    const probePromise = service.probe();
    jest.advanceTimersByTime(10);

    const result = await probePromise;

    expect(abortController.abort).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "degraded",
      degradedReason: "probe-timeout",
      statusCode: null,
    });
  });
});
