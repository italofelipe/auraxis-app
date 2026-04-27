import * as Haptics from "expo-haptics";

import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";
import {
  haptics,
  triggerHapticImpact,
  triggerHapticNotification,
} from "@/shared/feedback/haptics";

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: {
    Light: "Light",
    Medium: "Medium",
    Heavy: "Heavy",
  },
  NotificationFeedbackType: {
    Success: "Success",
    Warning: "Warning",
    Error: "Error",
  },
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockedImpactAsync = Haptics.impactAsync as jest.MockedFunction<
  typeof Haptics.impactAsync
>;
const mockedNotificationAsync = Haptics.notificationAsync as jest.MockedFunction<
  typeof Haptics.notificationAsync
>;

describe("haptics", () => {
  beforeEach(() => {
    resetAppShellStore();
    mockedImpactAsync.mockClear();
    mockedNotificationAsync.mockClear();
  });

  describe("triggerHapticImpact", () => {
    it.each(["light", "medium", "heavy"] as const)(
      "dispara impacto %s quando habilitado",
      (tone) => {
        triggerHapticImpact(tone);
        expect(mockedImpactAsync).toHaveBeenCalledTimes(1);
        expect(mockedImpactAsync).toHaveBeenCalledWith(
          tone.charAt(0).toUpperCase() + tone.slice(1),
        );
      },
    );

    it("nao dispara quando tone é none", () => {
      triggerHapticImpact("none");
      expect(mockedImpactAsync).not.toHaveBeenCalled();
    });

    it("nao dispara quando hapticsEnabled é false", () => {
      useAppShellStore.getState().setHapticsEnabled(false);
      triggerHapticImpact("medium");
      expect(mockedImpactAsync).not.toHaveBeenCalled();
    });

    it("não propaga falha do expo-haptics", async () => {
      mockedImpactAsync.mockRejectedValueOnce(new Error("simulated"));
      expect(() => triggerHapticImpact("light")).not.toThrow();
      // wait microtask to let the swallowed promise settle
      await Promise.resolve();
    });
  });

  describe("triggerHapticNotification", () => {
    it.each(["success", "warning", "error"] as const)(
      "dispara notificação %s quando habilitado",
      (tone) => {
        triggerHapticNotification(tone);
        expect(mockedNotificationAsync).toHaveBeenCalledTimes(1);
        expect(mockedNotificationAsync).toHaveBeenCalledWith(
          tone.charAt(0).toUpperCase() + tone.slice(1),
        );
      },
    );

    it("nao dispara quando hapticsEnabled é false", () => {
      useAppShellStore.getState().setHapticsEnabled(false);
      triggerHapticNotification("success");
      expect(mockedNotificationAsync).not.toHaveBeenCalled();
    });

    it("não propaga falha do expo-haptics", async () => {
      mockedNotificationAsync.mockRejectedValueOnce(new Error("simulated"));
      expect(() => triggerHapticNotification("error")).not.toThrow();
      await Promise.resolve();
    });
  });

  describe("haptics convenience helpers", () => {
    it("light/medium/heavy delegam para triggerHapticImpact", () => {
      haptics.light();
      haptics.medium();
      haptics.heavy();
      expect(mockedImpactAsync).toHaveBeenCalledTimes(3);
    });

    it("success/warning/error delegam para triggerHapticNotification", () => {
      haptics.success();
      haptics.warning();
      haptics.error();
      expect(mockedNotificationAsync).toHaveBeenCalledTimes(3);
    });
  });
});
