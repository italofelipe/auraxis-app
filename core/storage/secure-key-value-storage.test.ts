import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  deleteSecureValue,
  getSecureValue,
  setSecureValue,
} from "@/core/storage/secure-key-value-storage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const originalPlatform = Platform.OS;

const setPlatform = (platform: typeof Platform.OS): void => {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    get: () => platform,
  });
};

describe("secure-key-value-storage", () => {
  afterEach(async () => {
    setPlatform("web");
    await deleteSecureValue("test-key");
    setPlatform(originalPlatform);
    jest.clearAllMocks();
  });

  it("delegates storage to Expo SecureStore on native platforms", async () => {
    setPlatform("ios");
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("native-value");

    await expect(getSecureValue("test-key")).resolves.toBe("native-value");
    await setSecureValue("test-key", "next-value");
    await deleteSecureValue("test-key");

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("test-key");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "test-key",
      "next-value",
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("test-key");
  });

  it("keeps Expo Web preview values only in volatile memory", async () => {
    setPlatform("web");

    await setSecureValue("test-key", "web-value");
    await expect(getSecureValue("test-key")).resolves.toBe("web-value");
    await deleteSecureValue("test-key");
    await expect(getSecureValue("test-key")).resolves.toBeNull();

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});
