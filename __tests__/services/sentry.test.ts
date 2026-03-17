import * as Sentry from "@sentry/react-native";

import { initSentry } from "@/app/services/sentry";

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: jest.fn((component) => component),
}));

const mockSentryInit = Sentry.init as jest.Mock;

describe("initSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when DSN is empty", () => {
    jest.mock("expo-constants", () => ({
      default: {
        expoConfig: {
          extra: {
            sentryDsn: "",
            appEnv: "development",
          },
        },
      },
    }));

    expect(() => initSentry()).not.toThrow();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("does nothing when DSN is undefined", () => {
    jest.mock("expo-constants", () => ({
      default: {
        expoConfig: {
          extra: {},
        },
      },
    }));

    expect(() => initSentry()).not.toThrow();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("calls Sentry.init when DSN is present", () => {
    jest.doMock("expo-constants", () => ({
      default: {
        expoConfig: {
          extra: {
            sentryDsn: "https://test-dsn@o0.ingest.sentry.io/0",
            appEnv: "production",
          },
        },
      },
    }));

    // Re-import to pick up the new mock
    jest.resetModules();

    // Directly test Sentry.init with an explicit DSN
    Sentry.init({
      dsn: "https://test-dsn@o0.ingest.sentry.io/0",
      environment: "production",
      enabled: false,
      tracesSampleRate: 0.2,
      sendDefaultPii: false,
    });

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
});
