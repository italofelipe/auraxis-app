import { Linking } from "react-native";

import * as Notifications from "expo-notifications";

import {
  PUSH_NOTIFICATION_CHANNEL_ID,
  registerPushNotificationListener,
} from "@/core/notifications/listener";
import { appRoutes } from "@/core/navigation/routes";
import { pushLogger } from "@/core/telemetry/domain-loggers";

const mockRemoveListener = jest.fn();

jest.mock(
  "expo-notifications",
  () => ({
    addNotificationResponseReceivedListener: jest.fn(() => ({
      remove: mockRemoveListener,
    })),
    setNotificationCategoryAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
  }),
  { virtual: true },
);

jest.mock("@/core/telemetry/domain-loggers", () => ({
  navigationLogger: {
    log: jest.fn(),
  },
  pushLogger: {
    log: jest.fn(),
  },
}));

const mockedNotifications = jest.mocked(Notifications);
const mockedPushLogger = jest.mocked(pushLogger);

const notificationResponse = (
  data: Record<string, unknown>,
): Notifications.NotificationResponse =>
  ({
    notification: {
      request: {
        content: { data },
      },
    },
  }) as Notifications.NotificationResponse;

const notification = (
  data: Record<string, unknown>,
): Notifications.Notification => notificationResponse(data).notification;

describe("push notification listener", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("exibe notificacoes em foreground e registra evento push.delivered", async () => {
    registerPushNotificationListener();

    expect(mockedNotifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      PUSH_NOTIFICATION_CHANNEL_ID,
      [
        {
          identifier: "open",
          buttonTitle: "Abrir",
          options: { opensAppToForeground: true },
        },
      ],
    );

    const handler = mockedNotifications.setNotificationHandler.mock.calls[0]?.[0];
    await expect(
      handler?.handleNotification(
        notification({
          type: "budget_alert",
          deeplink: "auraxisapp://dashboard",
        }),
      ),
    ).resolves.toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    });

    expect(mockedPushLogger.log).toHaveBeenCalledWith("push.delivered", {
      captureInSentry: true,
      context: {
        channelId: PUSH_NOTIFICATION_CHANNEL_ID,
        hasDeeplink: true,
        type: "budget_alert",
      },
    });
  });

  it("abre deeplink allowlisted ao tocar na notificacao e registra push.tapped", () => {
    registerPushNotificationListener();

    const listener = mockedNotifications.addNotificationResponseReceivedListener.mock
      .calls[0]?.[0];
    listener?.(
      notificationResponse({
        type: "weekly_insight",
        deeplink: "auraxisapp://dashboard?focus=weekly-insight",
      }),
    );

    expect(Linking.openURL).toHaveBeenCalledWith(
      "auraxisapp://dashboard?focus=weekly-insight",
    );
    expect(mockedPushLogger.log).toHaveBeenCalledWith("push.tapped", {
      captureInSentry: true,
      context: {
        channelId: PUSH_NOTIFICATION_CHANNEL_ID,
        hasDeeplink: true,
        href: appRoutes.private.dashboard,
        type: "weekly_insight",
      },
    });
  });

  it("abre dashboard quando payload legado informa screen Dashboard", () => {
    registerPushNotificationListener();

    const listener = mockedNotifications.addNotificationResponseReceivedListener.mock
      .calls[0]?.[0];
    listener?.(
      notificationResponse({
        type: "analysis_ready",
        screen: "Dashboard",
      }),
    );

    expect(Linking.openURL).toHaveBeenCalledWith("auraxisapp://dashboard");
    expect(mockedPushLogger.log).toHaveBeenCalledWith("push.tapped", {
      captureInSentry: true,
      context: {
        channelId: PUSH_NOTIFICATION_CHANNEL_ID,
        hasDeeplink: false,
        href: appRoutes.private.dashboard,
        type: "analysis_ready",
      },
    });
  });

  it("ignora deeplink fora da allowlist e remove subscription no cleanup", () => {
    const subscription = registerPushNotificationListener();

    const listener = mockedNotifications.addNotificationResponseReceivedListener.mock
      .calls[0]?.[0];
    listener?.(
      notificationResponse({
        type: "unknown",
        deeplink: "auraxisapp://admin",
      }),
    );
    subscription.remove();

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
  });
});
