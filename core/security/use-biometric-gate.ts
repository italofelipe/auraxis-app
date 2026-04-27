import { useCallback } from "react";

import {
  type BiometricAuthOutcome,
  requestBiometricAuth,
} from "@/core/security/biometric-gate";
import { useAppShellStore } from "@/core/shell/app-shell-store";

export interface BiometricGateOptions {
  /**
   * Sentence shown in the OS biometric sheet. Keep it short — the OS
   * cuts off long copy. Required so the user sees what they are
   * authorising.
   */
  readonly promptMessage: string;
  /**
   * When `true`, the gate refuses the device PIN fallback and demands
   * a real biometric. Use for irreversible actions (account deletion,
   * password change). Default `false`.
   */
  readonly biometricsOnly?: boolean;
  /**
   * Force the gate even when the user has not enabled the lock toggle.
   * Reserved for irreversible flows that always require biometric
   * confirmation. Default `false`.
   */
  readonly required?: boolean;
}

export type BiometricGateResult =
  | { readonly authorised: true; readonly via: "skipped" | "biometric" }
  | { readonly authorised: false; readonly outcome: BiometricAuthOutcome };

/**
 * Hook that wraps {@link requestBiometricAuth} with the user's
 * `biometricLockEnabled` preference.
 *
 * Behaviour:
 * - If `options.required === true`, the prompt always runs.
 * - Otherwise, the prompt only runs when the user has enabled the
 *   lock in **Profile → Security**. Skipped flows resolve as
 *   `{ authorised: true, via: 'skipped' }`.
 * - Successful biometric prompts resolve as
 *   `{ authorised: true, via: 'biometric' }`.
 * - Cancellations, fallbacks and errors resolve as
 *   `{ authorised: false, outcome }` — never throws.
 *
 * Call sites use the result to decide whether to proceed with the
 * sensitive action. The shape of the result lets the UI distinguish
 * "user cancelled" from "biometric unavailable" so the right copy
 * is shown.
 */
export const useBiometricGate = (): ((
  options: BiometricGateOptions,
) => Promise<BiometricGateResult>) => {
  const lockEnabled = useAppShellStore((state) => state.biometricLockEnabled);

  return useCallback(
    async (options: BiometricGateOptions): Promise<BiometricGateResult> => {
      const required = options.required === true;
      if (!required && !lockEnabled) {
        return { authorised: true, via: "skipped" };
      }

      const outcome = await requestBiometricAuth({
        promptMessage: options.promptMessage,
        biometricsOnly: options.biometricsOnly,
      });

      if (outcome.outcome === "success" || outcome.outcome === "fallback_pin") {
        return { authorised: true, via: "biometric" };
      }
      return { authorised: false, outcome };
    },
    [lockEnabled],
  );
};
