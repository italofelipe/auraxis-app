import { type ComponentProps, type ReactElement, type ReactNode, useCallback } from "react";
import type { GestureResponderEvent } from "react-native";

import { Button, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import {
  type HapticImpactTone,
  triggerHapticImpact,
} from "@/shared/feedback/haptics";

const PrimaryButtonFrame = styled(Button, {
  backgroundColor: "$secondary",
  borderRadius: "$1",
  pressStyle: {
    backgroundColor: "$primary",
  },
});

const SecondaryButtonFrame = styled(Button, {
  backgroundColor: "transparent",
  borderRadius: "$1",
  borderColor: "$secondary",
  borderWidth: borderWidths.hairline,
  pressStyle: {
    backgroundColor: "$surfaceRaised",
  },
});

type FrameProps = ComponentProps<typeof PrimaryButtonFrame>;

export interface AppButtonProps extends Omit<FrameProps, "children"> {
  readonly children: ReactNode;
  readonly tone?: "primary" | "secondary";
  /**
   * Tactile feedback fired on press-in. Defaults to `"light"` for primary
   * tone and `"none"` for secondary, matching mobile UX conventions
   * (primary CTA = strongest signal). Pass `"none"` to opt out.
   */
  readonly hapticTone?: HapticImpactTone;
}

const defaultHapticTone = (
  tone: "primary" | "secondary",
): HapticImpactTone => {
  return tone === "primary" ? "light" : "none";
};

/**
 * Shared button wrapper aligned to the Auraxis Tamagui theme.
 *
 * Fires tactile feedback on press-in via {@link triggerHapticImpact} so
 * every CTA in the app gets free haptics without each call site needing
 * to import `expo-haptics` directly.
 *
 * @param props Button content, tone, and optional haptic override.
 * @returns Primary or secondary mobile button.
 */
const resolveAccessibilityLabel = (
  explicit: string | undefined,
  children: ReactNode,
): string | undefined => {
  if (explicit) {
    return explicit;
  }
  if (typeof children === "string") {
    return children;
  }
  if (typeof children === "number") {
    return String(children);
  }
  return undefined;
};

export function AppButton({
  children,
  tone = "primary",
  hapticTone,
  onPressIn,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
  accessibilityState,
  disabled,
  ...rest
}: AppButtonProps): ReactElement {
  const resolvedHapticTone = hapticTone ?? defaultHapticTone(tone);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent): void => {
      triggerHapticImpact(resolvedHapticTone);
      onPressIn?.(event);
    },
    [onPressIn, resolvedHapticTone],
  );

  const a11yLabel = resolveAccessibilityLabel(accessibilityLabel, children);
  const a11yRole = accessibilityRole ?? "button";
  const a11yState = {
    disabled: Boolean(disabled),
    ...accessibilityState,
  };

  if (tone === "secondary") {
    return (
      <SecondaryButtonFrame
        {...rest}
        disabled={disabled}
        accessibilityLabel={a11yLabel}
        accessibilityRole={a11yRole}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
        onPressIn={handlePressIn}
      >
        {children}
      </SecondaryButtonFrame>
    );
  }

  return (
    <PrimaryButtonFrame
      {...rest}
      disabled={disabled}
      accessibilityLabel={a11yLabel}
      accessibilityRole={a11yRole}
      accessibilityHint={accessibilityHint}
      accessibilityState={a11yState}
      onPressIn={handlePressIn}
    >
      {children}
    </PrimaryButtonFrame>
  );
}
