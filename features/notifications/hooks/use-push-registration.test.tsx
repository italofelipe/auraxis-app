import { act, renderHook } from "@testing-library/react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

import {
  LEGACY_ANALYSIS_READY_CHANNEL_ID,
  usePushRegistration,
} from "@/features/notifications/hooks/use-push-registration";
import { notificationsService } from "@/features/notifications/services/notifications-service";
import { isFeatureEnabled } from "@/shared/feature-flags";

const mockDeviceState = {
  isDevice: true,
  deviceName: "iPhone 15",
};

jest.mock(
  "expo-notifications",
  () => ({
    AndroidImportance: { HIGH: "high" },
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    getDevicePushTokenAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  "expo-device",
  () => ({
    get isDevice() {
      return mockDeviceState.isDevice;
    },
    get deviceName() {
      return mockDeviceState.deviceName;
    },
  }),
  { virtual: true },
);

jest.mock(
  "expo-constants",
  () => {
    const constants = {
      expoConfig: { extra: { eas: { projectId: "project-1" } } },
      easConfig: { projectId: "project-1" },
    };
    return {
      __esModule: true,
      default: constants,
      ...constants,
    };
  },
  { virtual: true },
);

jest.mock("@/features/notifications/services/notifications-service", () => ({
  notificationsService: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedNotifications = jest.mocked(Notifications);
const mockedService = jest.mocked(notificationsService);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

describe("usePushRegistration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_OS = "android";
    mockDeviceState.isDevice = true;
    mockDeviceState.deviceName = "iPhone 15";
    mockedIsFeatureEnabled.mockReturnValue(true);
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined" } as never);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({ status: "granted" } as never);
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[test]",
    } as never);
    mockedNotifications.getDevicePushTokenAsync.mockResolvedValue({
      data: "native-token",
      type: "ios",
    } as never);
    mockedService.subscribe.mockResolvedValue({
      id: "sub-1",
      transport: "expo",
      endpoint: "ExponentPushToken[test]",
      deviceLabel: "iPhone 15",
    });
    mockedService.unsubscribe.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.EXPO_OS;
  });

  it("pede permissao just-in-time, registra canal Android e envia token Expo ao backend", async () => {
    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.enablePush();
    });

    expect(mockedNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockedNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "auraxis-default",
      expect.objectContaining({ importance: Notifications.AndroidImportance.HIGH }),
    );
    expect(mockedNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      LEGACY_ANALYSIS_READY_CHANNEL_ID,
      expect.objectContaining({ importance: Notifications.AndroidImportance.HIGH }),
    );
    expect(mockedNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    expect(mockedService.subscribe).toHaveBeenCalledWith({
      transport: "expo",
      endpoint: "ExponentPushToken[test]",
      deviceLabel: "iPhone 15",
    });
    expect(result.current.status).toBe("registered");
    expect(result.current.endpoint).toBe("ExponentPushToken[test]");
  });

  it("nao chama backend quando a permissao e negada", async () => {
    mockedNotifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    } as never);

    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.enablePush();
    });

    expect(mockedService.subscribe).not.toHaveBeenCalled();
    expect(result.current.status).toBe("permission-denied");
  });

  it("remove token atual ao desativar push", async () => {
    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.enablePush();
      await result.current.disablePush();
    });

    expect(mockedService.unsubscribe).toHaveBeenCalledWith({
      endpoint: "ExponentPushToken[test]",
    });
    expect(result.current.status).toBe("unregistered");
    expect(result.current.endpoint).toBeNull();
  });

  it("fica indisponivel quando a feature flag esta desligada", async () => {
    mockedIsFeatureEnabled.mockReturnValue(false);
    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.enablePush();
    });

    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(result.current.status).toBe("unavailable");
  });

  it("fica indisponivel em simulador sem device token real", async () => {
    mockDeviceState.isDevice = false;
    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.enablePush();
    });

    expect(mockedService.subscribe).not.toHaveBeenCalled();
    expect(result.current.status).toBe("unavailable");
  });
});
