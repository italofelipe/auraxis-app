import * as Sentry from "@sentry/react-native";
import JailMonkey from "jail-monkey";

import { startupLogger } from "@/core/telemetry/domain-loggers";

export type DeviceIntegrityStatus =
  | "trusted"
  | "compromised"
  | "indeterminate";

export interface DeviceIntegritySnapshot {
  readonly status: DeviceIntegrityStatus;
  readonly jailBroken: boolean;
  readonly debuggedMode: boolean;
  readonly canMockLocation: boolean;
  readonly externalStorage: boolean;
  readonly hookDetected: boolean;
  readonly checkedAt: string;
}

const safeBooleanAsync = async (
  call: () => Promise<boolean> | boolean,
): Promise<boolean> => {
  try {
    return Boolean(await call());
  } catch {
    return false;
  }
};

/**
 * Inspects the device for signs of jailbreak / root / hooking.
 *
 * Returns a snapshot rather than a boolean so the caller can decide
 * how to react (warn, log, gate). Each native call is wrapped so a
 * failing JNI / ObjC bridge cannot crash the startup flow.
 *
 * Notes on accuracy:
 * - `jailBroken` is the strong signal — file/system probes that flag
 *   Cydia / Magisk / suspicious binaries.
 * - `debuggedMode` only triggers when actively attached to a debugger
 *   in a release build, which always implies tampering.
 * - `hookDetected` flags Frida / Substrate-style hooking on iOS.
 * - `canMockLocation` and `externalStorage` are weak signals on
 *   Android — a rooted device usually exposes them but a regular
 *   developer build can too. They are reported but do not flip the
 *   status to `compromised` on their own.
 */
export const inspectDeviceIntegrity = async (): Promise<DeviceIntegritySnapshot> => {
  const [jailBroken, debuggedMode, canMockLocation, externalStorage, hookDetected] =
    await Promise.all([
      safeBooleanAsync(() => JailMonkey.isJailBroken()),
      safeBooleanAsync(() => JailMonkey.isDebuggedMode()),
      safeBooleanAsync(() => JailMonkey.canMockLocation()),
      safeBooleanAsync(() => JailMonkey.isOnExternalStorage()),
      safeBooleanAsync(() => JailMonkey.hookDetected()),
    ]);

  const strongSignal = jailBroken || debuggedMode || hookDetected;
  const status: DeviceIntegrityStatus = strongSignal
    ? "compromised"
    : "trusted";

  return {
    status,
    jailBroken,
    debuggedMode,
    canMockLocation,
    externalStorage,
    hookDetected,
    checkedAt: new Date().toISOString(),
  };
};

let lastReportedSnapshotKey: string | null = null;

const buildSnapshotKey = (snapshot: DeviceIntegritySnapshot): string => {
  return [
    snapshot.status,
    snapshot.jailBroken ? "j" : "",
    snapshot.debuggedMode ? "d" : "",
    snapshot.hookDetected ? "h" : "",
  ].join(":");
};

/**
 * Reports the integrity snapshot once per app lifecycle (deduplicated
 * by signal shape). Compromised devices generate a Sentry event with
 * tag `device.compromised: true` so monitoring can distinguish them
 * from regular sessions; trusted devices only emit a debug log.
 *
 * The runtime keeps serving the user — this is a *visibility* tool,
 * not a gate. Users on rooted devices may legitimately be developers
 * or power users, and silently locking them out punishes a real cohort
 * with little marginal security gain over the rest of the stack.
 */
export const reportDeviceIntegrity = (
  snapshot: DeviceIntegritySnapshot,
): void => {
  const key = buildSnapshotKey(snapshot);
  if (lastReportedSnapshotKey === key) {
    return;
  }
  lastReportedSnapshotKey = key;

  if (snapshot.status === "compromised") {
    Sentry.captureMessage("device.compromised", {
      level: "warning",
      tags: {
        "device.compromised": "true",
        "device.jail_broken": String(snapshot.jailBroken),
        "device.debugged_mode": String(snapshot.debuggedMode),
        "device.hook_detected": String(snapshot.hookDetected),
      },
    });
    startupLogger.log("startup.bootstrap_requested", {
      level: "warn",
      context: {
        deviceCompromised: true,
        jailBroken: snapshot.jailBroken,
        debuggedMode: snapshot.debuggedMode,
        hookDetected: snapshot.hookDetected,
      },
    });
    return;
  }

  startupLogger.log("startup.bootstrap_requested", {
    level: "debug",
    context: { deviceCompromised: false },
  });
};

/**
 * Test utility — clears the dedup memo so subsequent
 * {@link reportDeviceIntegrity} calls in the same suite report again.
 */
export const resetDeviceIntegrityReportingForTests = (): void => {
  lastReportedSnapshotKey = null;
};

/**
 * One-call helper used by the startup bridge: inspects the device
 * and reports the result. Errors are swallowed so a misbehaving
 * native module can never block the app from booting.
 */
export const runDeviceIntegrityCheck = async (): Promise<void> => {
  try {
    const snapshot = await inspectDeviceIntegrity();
    reportDeviceIntegrity(snapshot);
  } catch {
    /* swallow — integrity check is best-effort and must never block boot */
  }
};
