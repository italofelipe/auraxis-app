import * as LocalAuthentication from "expo-local-authentication";

export type BiometricSupport =
  | "available"
  | "unavailable_no_hardware"
  | "unavailable_not_enrolled"
  | "unknown";

export interface BiometricSupportSnapshot {
  readonly status: BiometricSupport;
  readonly hasHardware: boolean;
  readonly isEnrolled: boolean;
  readonly types: readonly LocalAuthentication.AuthenticationType[];
}

export type BiometricAuthOutcome =
  | { readonly outcome: "success" }
  | { readonly outcome: "cancelled" }
  | { readonly outcome: "fallback_pin" }
  | { readonly outcome: "unavailable"; readonly reason: BiometricSupport }
  | { readonly outcome: "error"; readonly message: string };

const safeHasHardware = async (): Promise<boolean> => {
  try {
    return await LocalAuthentication.hasHardwareAsync();
  } catch {
    return false;
  }
};

const safeIsEnrolled = async (): Promise<boolean> => {
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
};

const safeSupportedTypes = async (): Promise<
  readonly LocalAuthentication.AuthenticationType[]
> => {
  try {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch {
    return [];
  }
};

/**
 * Inspects the device for biometric capability. Treats every native
 * failure as "unknown" rather than throwing, so callers never have to
 * wrap this in try/catch.
 *
 * @returns A discriminated snapshot of biometric capability.
 */
export const inspectBiometricSupport = async (): Promise<BiometricSupportSnapshot> => {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    safeHasHardware(),
    safeIsEnrolled(),
    safeSupportedTypes(),
  ]);

  let status: BiometricSupport = "unknown";
  if (!hasHardware) {
    status = "unavailable_no_hardware";
  } else if (!isEnrolled) {
    status = "unavailable_not_enrolled";
  } else {
    status = "available";
  }

  return { status, hasHardware, isEnrolled, types };
};

export interface RequestBiometricOptions {
  readonly promptMessage: string;
  readonly cancelLabel?: string;
  readonly fallbackLabel?: string;
  /**
   * When `true`, the OS will allow the user to fall back to their
   * device PIN/password. Defaults to `true` so users who momentarily
   * fail biometric (wet finger, sunglasses) can still authorise.
   */
  readonly allowDeviceFallback?: boolean;
  /**
   * When `true`, biometric prompts are required to use only biometrics
   * (no device PIN). Use for sensitive flows where a stolen device PIN
   * should not bypass the gate.
   */
  readonly biometricsOnly?: boolean;
}

/**
 * Prompts the user with the OS biometric sheet (Face ID / Touch ID /
 * fingerprint). Resolves with a discriminated outcome — never throws.
 *
 * @param options Prompt copy + fallback policy.
 * @returns Outcome describing whether the gate passed.
 */
export const requestBiometricAuth = async (
  options: RequestBiometricOptions,
): Promise<BiometricAuthOutcome> => {
  const support = await inspectBiometricSupport();
  if (support.status !== "available") {
    return { outcome: "unavailable", reason: support.status };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage,
      cancelLabel: options.cancelLabel,
      fallbackLabel: options.fallbackLabel,
      disableDeviceFallback: options.biometricsOnly === true,
    });

    if (result.success) {
      return { outcome: "success" };
    }
    if (result.error === "user_cancel" || result.error === "system_cancel") {
      return { outcome: "cancelled" };
    }
    if (result.error === "user_fallback") {
      return { outcome: "fallback_pin" };
    }
    return {
      outcome: "error",
      message: result.error ?? "biometric_error",
    };
  } catch (error) {
    return {
      outcome: "error",
      message: error instanceof Error ? error.message : "biometric_exception",
    };
  }
};
