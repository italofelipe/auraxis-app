import type { AxiosResponse } from "axios";

import {
  captureRequestIdInterceptor,
  currentRequestId,
  resetRequestIdForTests,
  setRequestId,
  withCurrentRequestId,
} from "@/core/telemetry/request-id-context";

/**
 * Build a minimal AxiosResponse for tests.
 *
 * @param headers Headers object to use in the response.
 * @returns Constructed AxiosResponse.
 */
const makeResponse = (headers: Record<string, unknown>): AxiosResponse => ({
  data: {},
  status: 200,
  statusText: "OK",
  headers,
  config: {} as AxiosResponse["config"],
});

describe("request-id context (app)", () => {
  beforeEach(() => {
    resetRequestIdForTests();
  });

  afterEach(() => {
    resetRequestIdForTests();
  });

  it("starts with no captured id", () => {
    expect(currentRequestId()).toBeUndefined();
  });

  it("setRequestId stores a valid id", () => {
    setRequestId("req-abc-123");
    expect(currentRequestId()).toBe("req-abc-123");
  });

  it("setRequestId ignores empty / whitespace / undefined", () => {
    setRequestId("");
    expect(currentRequestId()).toBeUndefined();
    setRequestId("   ");
    expect(currentRequestId()).toBeUndefined();
    setRequestId(undefined);
    expect(currentRequestId()).toBeUndefined();
  });
});

describe("captureRequestIdInterceptor (app)", () => {
  beforeEach(() => {
    resetRequestIdForTests();
  });
  afterEach(() => {
    resetRequestIdForTests();
  });

  it("captures x-request-id from response headers", () => {
    const response = makeResponse({ "x-request-id": "req-xyz-789" });
    const returned = captureRequestIdInterceptor(response);
    expect(returned).toBe(response);
    expect(currentRequestId()).toBe("req-xyz-789");
  });

  it("does not capture when x-request-id is missing", () => {
    const response = makeResponse({ "content-type": "application/json" });
    captureRequestIdInterceptor(response);
    expect(currentRequestId()).toBeUndefined();
  });

  it("ignores non-string x-request-id values defensively", () => {
    const response = makeResponse({ "x-request-id": 42 });
    captureRequestIdInterceptor(response);
    expect(currentRequestId()).toBeUndefined();
  });

  it("does not throw when headers is missing", () => {
    const response = {
      data: {},
      status: 200,
      statusText: "OK",
      headers: undefined,
      config: {} as AxiosResponse["config"],
    } as unknown as AxiosResponse;
    expect(() => captureRequestIdInterceptor(response)).not.toThrow();
    expect(currentRequestId()).toBeUndefined();
  });
});

describe("withCurrentRequestId helper", () => {
  beforeEach(() => {
    resetRequestIdForTests();
  });
  afterEach(() => {
    resetRequestIdForTests();
  });

  it("returns context unchanged when no id is captured", () => {
    const ctx = { user_id: "abc" };
    expect(withCurrentRequestId(ctx)).toEqual({ user_id: "abc" });
  });

  it("returns undefined when no id and no context", () => {
    expect(withCurrentRequestId(undefined)).toBeUndefined();
  });

  it("merges request_id into context when id is captured", () => {
    setRequestId("req-merge-1");
    expect(withCurrentRequestId({ feature: "wallet" })).toEqual({
      feature: "wallet",
      request_id: "req-merge-1",
    });
  });

  it("returns just { request_id } when context is undefined and id captured", () => {
    setRequestId("req-bare");
    expect(withCurrentRequestId(undefined)).toEqual({ request_id: "req-bare" });
  });
});
