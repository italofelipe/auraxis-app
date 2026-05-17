import { useCallback, useMemo, useRef, useState } from "react";

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import type { PushRegistrationStatus } from "@/features/notifications/contracts";
import { notificationsService } from "@/features/notifications/services/notifications-service";
import { isFeatureEnabled } from "@/shared/feature-flags";

export const PUSH_NOTIFICATIONS_FEATURE_FLAG_KEY = "app.notifications.push";
export const PUSH_NOTIFICATION_CHANNEL_ID = "auraxis-default";
export const LEGACY_ANALYSIS_READY_CHANNEL_ID = "analysis_ready";

export interface PushRegistrationController {
  readonly status: PushRegistrationStatus;
  readonly endpoint: string | null;
  readonly error: unknown | null;
  readonly isBusy: boolean;
  readonly isPushEnabled: boolean;
  readonly enablePush: () => Promise<boolean>;
  readonly disablePush: () => Promise<boolean>;
  readonly dismissError: () => void;
}

const resolveProjectId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as
    | { readonly eas?: { readonly projectId?: unknown } }
    | undefined;
  const expoProjectId = extra?.eas?.projectId;
  if (typeof expoProjectId === "string" && expoProjectId.length > 0) {
    return expoProjectId;
  }

  const easProjectId = Constants.easConfig?.projectId;
  return typeof easProjectId === "string" && easProjectId.length > 0
    ? easProjectId
    : undefined;
};

const resolveDeviceLabel = (): string => {
  if (typeof Device.deviceName === "string" && Device.deviceName.length > 0) {
    return Device.deviceName;
  }

  return `${process.env.EXPO_OS ?? "unknown"} device`;
};

const ensureAndroidChannel = async (): Promise<void> => {
  const channelConfig = {
    name: "Auraxis",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2F80ED",
  };

  const channelIds = [
    PUSH_NOTIFICATION_CHANNEL_ID,
    LEGACY_ANALYSIS_READY_CHANNEL_ID,
  ];

  await Promise.all(
    channelIds.map((channelId) =>
      Promise.resolve(
        Notifications.setNotificationChannelAsync(channelId, channelConfig),
      ),
    ),
  ).catch((error: unknown) => {
    if (process.env.EXPO_OS === "android") {
      throw error;
    }
  });
};

const readGrantedStatus = async (): Promise<boolean> => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
};

const requestPushSubscription = async (): Promise<string | null> => {
  const granted = await readGrantedStatus();
  if (!granted) {
    return null;
  }

  await ensureAndroidChannel();

  const projectId = resolveProjectId();
  const expoPushToken = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  await Notifications.getDevicePushTokenAsync().catch(() => null);

  const subscription = await notificationsService.subscribe({
    transport: "expo",
    endpoint: expoPushToken.data,
    deviceLabel: resolveDeviceLabel(),
  });

  return subscription.endpoint;
};

export function usePushRegistration(): PushRegistrationController {
  const isPushFeatureEnabled = isFeatureEnabled(PUSH_NOTIFICATIONS_FEATURE_FLAG_KEY);
  const initialStatus: PushRegistrationStatus =
    isPushFeatureEnabled && Device.isDevice ? "unregistered" : "unavailable";
  const [status, setStatus] = useState<PushRegistrationStatus>(initialStatus);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const endpointRef = useRef<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!isPushFeatureEnabled || !Device.isDevice) {
      setStatus("unavailable");
      return false;
    }

    setIsBusy(true);
    setError(null);

    try {
      const subscriptionEndpoint = await requestPushSubscription();
      if (!subscriptionEndpoint) {
        setStatus("permission-denied");
        return false;
      }

      endpointRef.current = subscriptionEndpoint;
      setEndpoint(subscriptionEndpoint);
      setStatus("registered");
      return true;
    } catch (caught) {
      setError(caught);
      setStatus("error");
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [isPushFeatureEnabled]);

  const disablePush = useCallback(async (): Promise<boolean> => {
    const currentEndpoint = endpoint ?? endpointRef.current;

    if (!currentEndpoint) {
      setStatus("unregistered");
      return true;
    }

    setIsBusy(true);
    setError(null);

    try {
      await notificationsService.unsubscribe({ endpoint: currentEndpoint });
      endpointRef.current = null;
      setEndpoint(null);
      setStatus("unregistered");
      return true;
    } catch (caught) {
      setError(caught);
      setStatus("error");
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [endpoint]);

  return useMemo(
    () => ({
      status,
      endpoint,
      error,
      isBusy,
      isPushEnabled: status === "registered",
      enablePush,
      disablePush,
      dismissError: () => {
        setError(null);
        if (status === "error") {
          setStatus(endpoint ? "registered" : "unregistered");
        }
      },
    }),
    [disablePush, enablePush, endpoint, error, isBusy, status],
  );
}
