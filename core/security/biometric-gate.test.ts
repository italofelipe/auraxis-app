import * as LocalAuthentication from "expo-local-authentication";

import {
  inspectBiometricSupport,
  requestBiometricAuth,
} from "@/core/security/biometric-gate";

jest.mock("expo-local-authentication", () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const mockedHasHardware = LocalAuthentication.hasHardwareAsync as jest.MockedFunction<
  typeof LocalAuthentication.hasHardwareAsync
>;
const mockedIsEnrolled = LocalAuthentication.isEnrolledAsync as jest.MockedFunction<
  typeof LocalAuthentication.isEnrolledAsync
>;
const mockedSupportedTypes =
  LocalAuthentication.supportedAuthenticationTypesAsync as jest.MockedFunction<
    typeof LocalAuthentication.supportedAuthenticationTypesAsync
  >;
const mockedAuthenticate = LocalAuthentication.authenticateAsync as jest.MockedFunction<
  typeof LocalAuthentication.authenticateAsync
>;

describe("biometric-gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSupportedTypes.mockResolvedValue([]);
  });

  describe("inspectBiometricSupport", () => {
    it("retorna available quando hardware presente e enrolled", async () => {
      mockedHasHardware.mockResolvedValue(true);
      mockedIsEnrolled.mockResolvedValue(true);
      const result = await inspectBiometricSupport();
      expect(result.status).toBe("available");
    });

    it("retorna unavailable_no_hardware quando nao ha hardware", async () => {
      mockedHasHardware.mockResolvedValue(false);
      mockedIsEnrolled.mockResolvedValue(false);
      const result = await inspectBiometricSupport();
      expect(result.status).toBe("unavailable_no_hardware");
    });

    it("retorna unavailable_not_enrolled quando hardware sem cadastro", async () => {
      mockedHasHardware.mockResolvedValue(true);
      mockedIsEnrolled.mockResolvedValue(false);
      const result = await inspectBiometricSupport();
      expect(result.status).toBe("unavailable_not_enrolled");
    });

    it("nao propaga falha do native module", async () => {
      mockedHasHardware.mockRejectedValue(new Error("native"));
      mockedIsEnrolled.mockRejectedValue(new Error("native"));
      const result = await inspectBiometricSupport();
      expect(result.status).toBe("unavailable_no_hardware");
    });
  });

  describe("requestBiometricAuth", () => {
    it("retorna unavailable quando hardware ausente", async () => {
      mockedHasHardware.mockResolvedValue(false);
      mockedIsEnrolled.mockResolvedValue(false);
      const result = await requestBiometricAuth({
        promptMessage: "Auth",
      });
      expect(result.outcome).toBe("unavailable");
    });

    it("retorna success quando OS confirma identidade", async () => {
      mockedHasHardware.mockResolvedValue(true);
      mockedIsEnrolled.mockResolvedValue(true);
      mockedAuthenticate.mockResolvedValue({ success: true } as never);
      const result = await requestBiometricAuth({
        promptMessage: "Auth",
      });
      expect(result.outcome).toBe("success");
    });

    it("traduz user_cancel em cancelled", async () => {
      mockedHasHardware.mockResolvedValue(true);
      mockedIsEnrolled.mockResolvedValue(true);
      mockedAuthenticate.mockResolvedValue({
        success: false,
        error: "user_cancel",
      } as never);
      const result = await requestBiometricAuth({
        promptMessage: "Auth",
      });
      expect(result.outcome).toBe("cancelled");
    });

    it("traduz user_fallback em fallback_pin", async () => {
      mockedHasHardware.mockResolvedValue(true);
      mockedIsEnrolled.mockResolvedValue(true);
      mockedAuthenticate.mockResolvedValue({
        success: false,
        error: "user_fallback",
      } as never);
      const result = await requestBiometricAuth({
        promptMessage: "Auth",
      });
      expect(result.outcome).toBe("fallback_pin");
    });

    it("propaga biometricsOnly via disableDeviceFallback", async () => {
      mockedHasHardware.mockResolvedValue(true);
      mockedIsEnrolled.mockResolvedValue(true);
      mockedAuthenticate.mockResolvedValue({ success: true } as never);
      await requestBiometricAuth({
        promptMessage: "Auth",
        biometricsOnly: true,
      });
      expect(mockedAuthenticate).toHaveBeenCalledWith(
        expect.objectContaining({ disableDeviceFallback: true }),
      );
    });
  });
});
