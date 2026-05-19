import { type ComponentProps, type ReactElement, type ReactNode, useCallback } from "react";
import type { GestureResponderEvent } from "react-native";

import { Button, Paragraph, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import {
  type HapticImpactTone,
  triggerHapticImpact,
} from "@/shared/feedback/haptics";

const PrimaryButtonFrame = styled(Button, {
  backgroundColor: "$primary",
  borderRadius: "$1",
  pressStyle: {
    backgroundColor: "$primaryPressed",
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

const DangerButtonFrame = styled(Button, {
  backgroundColor: "$danger",
  borderRadius: "$1",
  pressStyle: {
    backgroundColor: "$dangerStrong",
  },
});

const ButtonLabel = styled(Paragraph, {
  fontFamily: "$body",
  fontSize: "$4",
  fontWeight: "$6",
  textAlign: "center",
});

type FrameProps = ComponentProps<typeof PrimaryButtonFrame>;

export type AppButtonTone = "primary" | "secondary" | "danger";

export interface AppButtonProps extends Omit<FrameProps, "children"> {
  readonly children: ReactNode;
  readonly tone?: AppButtonTone;
  /**
   * Tactile feedback fired on press-in. Defaults to `"light"` for primary
   * tone, `"medium"` for danger and `"none"` for secondary — matching
   * mobile UX conventions (primary CTA = strongest signal, destructive
   * action = stronger). Pass `"none"` to opt out.
   */
  readonly hapticTone?: HapticImpactTone;
}

const defaultHapticTone = (tone: AppButtonTone): HapticImpactTone => {
  if (tone === "primary") {
    return "light";
  }
  if (tone === "danger") {
    return "medium";
  }
  return "none";
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

const renderButtonContent = (
  children: ReactNode,
  color: "$actionPrimaryForeground" | "$color",
): ReactNode => {
  if (typeof children === "string" || typeof children === "number") {
    return <ButtonLabel color={color}>{children}</ButtonLabel>;
  }
  return children;
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
        {renderButtonContent(children, "$color")}
      </SecondaryButtonFrame>
    );
  }

  if (tone === "danger") {
    return (
      <DangerButtonFrame
        {...rest}
        disabled={disabled}
        accessibilityLabel={a11yLabel}
        accessibilityRole={a11yRole}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
        onPressIn={handlePressIn}
      >
        {renderButtonContent(children, "$color")}
      </DangerButtonFrame>
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
      {renderButtonContent(children, "$actionPrimaryForeground")}
    </PrimaryButtonFrame>
  );
}
