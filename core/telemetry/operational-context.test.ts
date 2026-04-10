import { Platform } from "react-native";

import {
  buildAppOperationalContext,
  buildSentryOperationalContext,
  resetOperationalContextRuntimeForTests,
} from "@/core/telemetry/operational-context";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useSessionStore } from "@/core/session/session-store";

describe("operational telemetry context", () => {
  const originalPlatformVersion = Platform.Version;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, "Version", {
      configurable: true,
      value: "18.1",
    });
    resetOperationalContextRuntimeForTests();
    useAppShellStore.setState({
      fontsReady: true,
      reducedMotionEnabled: true,
      startupReady: true,
      appState: "active",
      connectivityStatus: "degraded",
      runtimeDegradedReason: "healthcheck-failed",
      entitlementsVersion: 3,
      pendingCheckoutReturn: null,
      lastHandledUrl: null,
      lastForegroundSyncAt: "2026-04-10T13:00:00.000Z",
      lastReachabilityCheckAt: "2026-04-10T13:05:00.000Z",
    });
    useSessionStore.setState({
      accessToken: "token",
      refreshToken: "refresh",
      user: {
        id: "user-1",
        name: "Italo",
        email: "italo@auraxis.dev",
        emailConfirmed: true,
      },
      userEmail: "italo@auraxis.dev",
      authenticatedAt: "2026-04-10T12:00:00.000Z",
      expiresAt: "2099-04-10T12:00:00.000Z",
      authFailureReason: null,
      lastValidatedAt: "2026-04-10T12:05:00.000Z",
      lastInvalidatedAt: null,
      hydrated: true,
      isAuthenticated: true,
      bootstrapSession: jest.fn().mockResolvedValue(undefined),
      signIn: jest.fn().mockResolvedValue(undefined),
      setSession: jest.fn().mockResolvedValue(undefined),
      updateUser: jest.fn(),
      markSessionValidated: jest.fn(),
      dismissAuthFailure: jest.fn(),
      invalidateSession: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, "Version", {
      configurable: true,
      value: originalPlatformVersion,
    });
    resetOperationalContextRuntimeForTests();
  });

  it("gera o contexto mínimo canônico para logs de cliente", () => {
    expect(buildAppOperationalContext()).toEqual({
      appEnv: "test",
      appVersion: "1.3.0",
      nativeBuildVersion: "100",
      executionEnvironment: "storeClient",
      appOwnership: "standalone",
      easProjectId: "eas-project-id",
      platform: "ios",
      platformVersion: "18.1",
      apiMode: "live",
      apiContractVersion: "v2",
      sessionHydrated: true,
      authenticated: true,
      authFailureReason: null,
      connectivityStatus: "degraded",
      runtimeDegradedReason: "healthcheck-failed",
      appState: "active",
      startupReady: true,
    });
  });

  it("gera contexto ampliado para sincronização do Sentry", () => {
    expect(buildSentryOperationalContext()).toEqual({
      release: {
        appEnv: "test",
        appVersion: "1.3.0",
        nativeBuildVersion: "100",
        executionEnvironment: "storeClient",
        appOwnership: "standalone",
        easProjectId: "eas-project-id",
        platform: "ios",
        platformVersion: "18.1",
        apiMode: "live",
        apiContractVersion: "v2",
      },
      runtime: {
        appState: "active",
        startupReady: true,
        fontsReady: true,
        reducedMotionEnabled: true,
        connectivityStatus: "degraded",
        runtimeDegradedReason: "healthcheck-failed",
        entitlementsVersion: 3,
        hasPendingCheckoutReturn: false,
        lastForegroundSyncAt: "2026-04-10T13:00:00.000Z",
        lastReachabilityCheckAt: "2026-04-10T13:05:00.000Z",
      },
      session: {
        hydrated: true,
        authenticated: true,
        authFailureReason: null,
        hasRefreshToken: true,
        authenticatedAt: "2026-04-10T12:00:00.000Z",
        expiresAt: "2099-04-10T12:00:00.000Z",
        lastValidatedAt: "2026-04-10T12:05:00.000Z",
        lastInvalidatedAt: null,
        emailConfirmed: true,
        hasUserId: true,
      },
    });
  });
});
