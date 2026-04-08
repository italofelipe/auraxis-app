import * as Sentry from "@sentry/react-native";

import { initSentry, sanitizeSentryEvent } from "@/app/services/sentry";

const expoConfigMock = {
  extra: {} as Record<string, unknown>,
};

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: expoConfigMock,
  },
}));

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: jest.fn((component) => component),
}));

const mockSentryInit = Sentry.init as jest.Mock;

describe("initSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    expoConfigMock.extra = {};
  });

  it("does nothing when DSN is empty", () => {
    expoConfigMock.extra = {
      sentryDsn: "",
      appEnv: "development",
    };

    expect(() => initSentry()).not.toThrow();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("does nothing when DSN is undefined", () => {
    expoConfigMock.extra = {};

    expect(() => initSentry()).not.toThrow();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("calls Sentry.init when DSN is present", () => {
    expoConfigMock.extra = {
      sentryDsn: "https://test-dsn@o0.ingest.sentry.io/0",
      appEnv: "production",
    };

    initSentry();

    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://test-dsn@o0.ingest.sentry.io/0",
        environment: "production",
        sendDefaultPii: false,
      }),
    );
  });

  it("does not call console.error when DSN is missing", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => initSentry()).not.toThrow();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("redacts sensitive values before enviar eventos ao Sentry", () => {
    const event = sanitizeSentryEvent({
      user: {
        email: "italo@auraxis.dev",
        ip_address: "127.0.0.1",
      },
      request: {
        url: "auraxisapp://assinatura?token=secret&status=paid",
        headers: {
          Authorization: "Bearer token",
          "X-Observability-Key": "public-key",
          Cookie: "session=abc",
        },
      },
    } as unknown as Sentry.Event);

    expect(event.user).toEqual({});
    expect(event.request?.url).toBe(
      "auraxisapp://assinatura?token=%3Credacted%3E&status=paid",
    );
    expect(event.request?.headers).toEqual({
      Authorization: "<redacted>",
      "X-Observability-Key": "<redacted>",
      Cookie: "<redacted>",
    });
  });
});
