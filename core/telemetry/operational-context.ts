import Constants from "expo-constants";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";
import { appRuntimeConfig } from "@/shared/config/runtime";

interface ExpoOperationalConstants {
  readonly appOwnership?: unknown;
  readonly easConfig?: {
    readonly projectId?: unknown;
  } | null;
  readonly executionEnvironment?: unknown;
  readonly expoConfig?: {
    readonly version?: unknown;
    readonly extra?: {
      readonly appEnv?: unknown;
    } | null;
  } | null;
  readonly nativeBuildVersion?: unknown;
}

interface PlatformRuntimeModule {
  readonly OS?: unknown;
  readonly Version?: unknown;
}

export interface AppOperationalContext {
  readonly appEnv: string;
  readonly appVersion: string | null;
  readonly nativeBuildVersion: string | null;
  readonly executionEnvironment: string;
  readonly appOwnership: string | null;
  readonly easProjectId: string | null;
  readonly platform: string;
  readonly platformVersion: string;
  readonly apiMode: string;
  readonly apiContractVersion: string;
  readonly sessionHydrated: boolean;
  readonly authenticated: boolean;
  readonly authFailureReason: string | null;
  readonly connectivityStatus: string;
  readonly runtimeDegradedReason: string | null;
  readonly appState: string;
  readonly startupReady: boolean;
}

export interface SentryOperationalContext {
  readonly release: Record<string, unknown>;
  readonly runtime: Record<string, unknown>;
  readonly session: Record<string, unknown>;
}

const readOptionalString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const readPlatformRuntimeModule = (): PlatformRuntimeModule => {
  try {
    return (
      require("react-native") as {
        Platform?: PlatformRuntimeModule;
      }
    ).Platform ?? {};
  } catch {
    return {};
  }
};

const resolvePlatformMetadata = (): {
  readonly os: string;
  readonly version: string;
} => {
  const platform = readPlatformRuntimeModule();

  return {
    os: readOptionalString(platform.OS) ?? "unknown",
    version:
      typeof platform.Version === "string" || typeof platform.Version === "number"
        ? String(platform.Version)
        : "unknown",
  };
};

let platformMetadata = resolvePlatformMetadata();

export const resetOperationalContextRuntimeForTests = (): void => {
  platformMetadata = resolvePlatformMetadata();
};

const readReleaseMetadata = (): AppOperationalContext => {
  const constants = Constants as unknown as ExpoOperationalConstants;
  const sessionState = useSessionStore.getState();
  const shellState = useAppShellStore.getState();

  return {
    appEnv:
      readOptionalString(constants.expoConfig?.extra?.appEnv) ?? "development",
    appVersion: readOptionalString(constants.expoConfig?.version),
    nativeBuildVersion: readOptionalString(constants.nativeBuildVersion),
    executionEnvironment:
      readOptionalString(constants.executionEnvironment) ?? "unknown",
    appOwnership: readOptionalString(constants.appOwnership),
    easProjectId: readOptionalString(constants.easConfig?.projectId),
    platform: platformMetadata.os,
    platformVersion: platformMetadata.version,
    apiMode: appRuntimeConfig.apiMode,
    apiContractVersion: appRuntimeConfig.apiContractVersion,
    sessionHydrated: sessionState.hydrated,
    authenticated: sessionState.isAuthenticated,
    authFailureReason: sessionState.authFailureReason,
    connectivityStatus: shellState.connectivityStatus,
    runtimeDegradedReason: shellState.runtimeDegradedReason,
    appState: shellState.appState,
    startupReady: shellState.startupReady,
  };
};

export const buildAppOperationalContext = (): AppOperationalContext => {
  return readReleaseMetadata();
};

export const buildSentryOperationalContext = (): SentryOperationalContext => {
  const metadata = readReleaseMetadata();
  const sessionState = useSessionStore.getState();
  const shellState = useAppShellStore.getState();

  return {
    release: {
      appEnv: metadata.appEnv,
      appVersion: metadata.appVersion,
      nativeBuildVersion: metadata.nativeBuildVersion,
      executionEnvironment: metadata.executionEnvironment,
      appOwnership: metadata.appOwnership,
      easProjectId: metadata.easProjectId,
      platform: metadata.platform,
      platformVersion: metadata.platformVersion,
      apiMode: metadata.apiMode,
      apiContractVersion: metadata.apiContractVersion,
    },
    runtime: {
      appState: shellState.appState,
      startupReady: shellState.startupReady,
      fontsReady: shellState.fontsReady,
      reducedMotionEnabled: shellState.reducedMotionEnabled,
      connectivityStatus: shellState.connectivityStatus,
      runtimeDegradedReason: shellState.runtimeDegradedReason,
      entitlementsVersion: shellState.entitlementsVersion,
      hasPendingCheckoutReturn: shellState.pendingCheckoutReturn !== null,
      lastForegroundSyncAt: shellState.lastForegroundSyncAt,
      lastReachabilityCheckAt: shellState.lastReachabilityCheckAt,
    },
    session: {
      hydrated: sessionState.hydrated,
      authenticated: sessionState.isAuthenticated,
      authFailureReason: sessionState.authFailureReason,
      hasRefreshToken: sessionState.refreshToken !== null,
      authenticatedAt: sessionState.authenticatedAt,
      expiresAt: sessionState.expiresAt,
      lastValidatedAt: sessionState.lastValidatedAt,
      lastInvalidatedAt: sessionState.lastInvalidatedAt,
      emailConfirmed: sessionState.user?.emailConfirmed ?? null,
      hasUserId: sessionState.user?.id !== null,
    },
  };
};
