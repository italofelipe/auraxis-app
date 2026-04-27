import * as Haptics from "expo-haptics";

import { useAppShellStore } from "@/core/shell/app-shell-store";

/**
 * Tactile feedback intensities for press / interaction events.
 *
 * Maps to {@link Haptics.ImpactFeedbackStyle} with one extra `none` value
 * that lets callers opt out without conditionals at the call site.
 */
export type HapticImpactTone = "none" | "light" | "medium" | "heavy";

/**
 * Tactile feedback for asynchronous outcomes (mutations, validations).
 *
 * Maps to {@link Haptics.NotificationFeedbackType} with a `none` opt-out.
 */
export type HapticNotificationTone =
  | "none"
  | "success"
  | "warning"
  | "error";

const impactStyleByTone: Record<
  Exclude<HapticImpactTone, "none">,
  Haptics.ImpactFeedbackStyle
> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const notificationTypeByTone: Record<
  Exclude<HapticNotificationTone, "none">,
  Haptics.NotificationFeedbackType
> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * Reads the runtime preference for haptics. Centralised here so call sites
 * never reach into the store directly.
 *
 * @returns `true` when haptic feedback is allowed in the current session.
 */
const isHapticsEnabled = (): boolean => {
  return useAppShellStore.getState().hapticsEnabled;
};

/**
 * Triggers tactile impact feedback. No-ops when haptics are disabled or
 * `tone` is `"none"`. Errors from `expo-haptics` are swallowed because
 * tactile feedback must never crash a user interaction.
 *
 * @param tone Intensity of the impact.
 */
export const triggerHapticImpact = (tone: HapticImpactTone): void => {
  if (tone === "none" || !isHapticsEnabled()) {
    return;
  }

  void Haptics.impactAsync(impactStyleByTone[tone]).catch(() => {
    /* swallow — haptics must never block UX */
  });
};

/**
 * Triggers tactile notification feedback. No-ops when haptics are disabled
 * or `tone` is `"none"`. Errors from `expo-haptics` are swallowed.
 *
 * @param tone Outcome being signalled.
 */
export const triggerHapticNotification = (
  tone: HapticNotificationTone,
): void => {
  if (tone === "none" || !isHapticsEnabled()) {
    return;
  }

  void Haptics.notificationAsync(notificationTypeByTone[tone]).catch(() => {
    /* swallow — haptics must never block UX */
  });
};

/**
 * Convenience helpers for the most common call sites. Prefer these over
 * passing string tones around your codebase.
 */
export const haptics = {
  light: (): void => {
    triggerHapticImpact("light");
  },
  medium: (): void => {
    triggerHapticImpact("medium");
  },
  heavy: (): void => {
    triggerHapticImpact("heavy");
  },
  success: (): void => {
    triggerHapticNotification("success");
  },
  warning: (): void => {
    triggerHapticNotification("warning");
  },
  error: (): void => {
    triggerHapticNotification("error");
  },
} as const;
