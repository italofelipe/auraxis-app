import { useEffect } from "react";
import { Linking } from "react-native";

import * as Notifications from "expo-notifications";

import {
  buildAppUrl,
  parseAppUrl,
} from "@/core/navigation/deep-linking";
import { appRoutes } from "@/core/navigation/routes";
import { pushLogger } from "@/core/telemetry/domain-loggers";

export const PUSH_NOTIFICATION_CHANNEL_ID = "auraxis-default";

type NotificationData = Notifications.NotificationContent["data"];

const readString = (
  data: NotificationData,
  key: string,
): string | null => {
  const value = data?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const readType = (data: NotificationData): string | null => readString(data, "type");

const readDeeplink = (data: NotificationData): string | null => {
  return readString(data, "deeplink") ?? readString(data, "deep_link");
};

const resolveLegacyScreenUrl = (data: NotificationData): string | null => {
  const screen = readString(data, "screen")?.trim().toLowerCase();
  if (screen === "dashboard") {
    return buildAppUrl(appRoutes.private.dashboard);
  }

  return null;
};

const resolveNotificationUrl = (data: NotificationData): string | null => {
  return readDeeplink(data) ?? resolveLegacyScreenUrl(data);
};

const buildTelemetryContext = (
  data: NotificationData,
  href?: string,
): Record<string, unknown> => ({
  channelId: PUSH_NOTIFICATION_CHANNEL_ID,
  hasDeeplink: readDeeplink(data) !== null,
  type: readType(data),
  ...(href ? { href } : {}),
});

const configureNotificationCategories = (): void => {
  void Promise.resolve(
    Notifications.setNotificationCategoryAsync(PUSH_NOTIFICATION_CHANNEL_ID, [
      {
        identifier: "open",
        buttonTitle: "Abrir",
        options: { opensAppToForeground: true },
      },
    ]),
  ).catch(() => {
    // Category setup is best-effort; push tap routing still works via deeplink.
  });
};

export const registerPushNotificationListener = (): {
  readonly remove: () => void;
} => {
  configureNotificationCategories();

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data;
      pushLogger.log("push.delivered", {
        captureInSentry: true,
        context: buildTelemetryContext(data),
      });

      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      };
    },
  });

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const url = resolveNotificationUrl(data);
    const intent = url ? parseAppUrl(url) : null;

    pushLogger.log("push.tapped", {
      captureInSentry: true,
      context: buildTelemetryContext(data, intent?.href),
    });

    if (!url || !intent) {
      return;
    }

    void Linking.openURL(url);
  });
};

export function usePushNotificationListener(): void {
  useEffect(() => {
    const subscription = registerPushNotificationListener();
    return () => {
      subscription.remove();
    };
  }, []);
}
