import * as Sentry from "@sentry/react-native";
import JailMonkey from "jail-monkey";

import {
  inspectDeviceIntegrity,
  reportDeviceIntegrity,
  resetDeviceIntegrityReportingForTests,
  runDeviceIntegrityCheck,
} from "@/core/security/integrity-check";

jest.mock("jail-monkey", () => ({
  __esModule: true,
  default: {
    isJailBroken: jest.fn(),
    isDebuggedMode: jest.fn(),
    canMockLocation: jest.fn(),
    isOnExternalStorage: jest.fn(),
    hookDetected: jest.fn(),
  },
}));

jest.mock("@sentry/react-native", () => ({
  captureMessage: jest.fn(),
}));

const mockedJM = JailMonkey as jest.Mocked<typeof JailMonkey>;
const mockedCaptureMessage = Sentry.captureMessage as jest.MockedFunction<
  typeof Sentry.captureMessage
>;

const setAllSignals = (value: boolean): void => {
  mockedJM.isJailBroken.mockReturnValue(value as never);
  mockedJM.isDebuggedMode.mockReturnValue(value as never);
  mockedJM.canMockLocation.mockReturnValue(value as never);
  mockedJM.isOnExternalStorage.mockReturnValue(value as never);
  mockedJM.hookDetected.mockReturnValue(value as never);
};

describe("integrity-check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDeviceIntegrityReportingForTests();
  });

  describe("inspectDeviceIntegrity", () => {
    it("reports trusted when every signal is clean", async () => {
      setAllSignals(false);
      const snapshot = await inspectDeviceIntegrity();
      expect(snapshot.status).toBe("trusted");
      expect(snapshot.jailBroken).toBe(false);
    });

    it("flags compromised when isJailBroken is true", async () => {
      setAllSignals(false);
      mockedJM.isJailBroken.mockReturnValue(true as never);
      const snapshot = await inspectDeviceIntegrity();
      expect(snapshot.status).toBe("compromised");
    });

    it("flags compromised when hookDetected is true", async () => {
      setAllSignals(false);
      mockedJM.hookDetected.mockReturnValue(true as never);
      const snapshot = await inspectDeviceIntegrity();
      expect(snapshot.status).toBe("compromised");
    });

    it("does not flip on weak signals alone (canMockLocation / externalStorage)", async () => {
      setAllSignals(false);
      mockedJM.canMockLocation.mockReturnValue(true as never);
      mockedJM.isOnExternalStorage.mockReturnValue(true as never);
      const snapshot = await inspectDeviceIntegrity();
      expect(snapshot.status).toBe("trusted");
    });

    it("never propagates a JNI bridge throw", async () => {
      mockedJM.isJailBroken.mockImplementation(() => {
        throw new Error("native");
      });
      mockedJM.isDebuggedMode.mockReturnValue(false as never);
      mockedJM.canMockLocation.mockReturnValue(false as never);
      mockedJM.isOnExternalStorage.mockReturnValue(false as never);
      mockedJM.hookDetected.mockReturnValue(false as never);
      const snapshot = await inspectDeviceIntegrity();
      expect(snapshot.status).toBe("trusted");
      expect(snapshot.jailBroken).toBe(false);
    });
  });

  describe("reportDeviceIntegrity", () => {
    it("captures a Sentry warning when device is compromised", () => {
      reportDeviceIntegrity({
        status: "compromised",
        jailBroken: true,
        debuggedMode: false,
        canMockLocation: false,
        externalStorage: false,
        hookDetected: false,
        checkedAt: "now",
      });
      expect(mockedCaptureMessage).toHaveBeenCalledWith(
        "device.compromised",
        expect.objectContaining({ level: "warning" }),
      );
    });

    it("does not call Sentry when device is trusted", () => {
      reportDeviceIntegrity({
        status: "trusted",
        jailBroken: false,
        debuggedMode: false,
        canMockLocation: false,
        externalStorage: false,
        hookDetected: false,
        checkedAt: "now",
      });
      expect(mockedCaptureMessage).not.toHaveBeenCalled();
    });

    it("dedups identical compromised snapshots within the lifecycle", () => {
      const snapshot = {
        status: "compromised" as const,
        jailBroken: true,
        debuggedMode: false,
        canMockLocation: false,
        externalStorage: false,
        hookDetected: false,
        checkedAt: "now",
      };
      reportDeviceIntegrity(snapshot);
      reportDeviceIntegrity(snapshot);
      expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("runDeviceIntegrityCheck", () => {
    it("never throws even when every native call fails", async () => {
      setAllSignals(false);
      mockedJM.isJailBroken.mockImplementation(() => {
        throw new Error("native");
      });
      await expect(runDeviceIntegrityCheck()).resolves.toBeUndefined();
    });
  });
});
