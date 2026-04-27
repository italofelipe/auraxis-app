import { type ReactElement, useCallback } from "react";

import { Paragraph, Switch, XStack, YStack } from "tamagui";

import { triggerHapticImpact } from "@/shared/feedback/haptics";

export interface AppToggleRowProps {
  readonly label: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly testID?: string;
  readonly onCheckedChange: (checked: boolean) => void;
}

/**
 * Shared labeled toggle row with optional support copy. Fires a light
 * haptic impact every time the toggle changes so the user gets a tactile
 * confirmation alongside the visual switch animation.
 *
 * @param props Toggle state and descriptive copy.
 * @returns A reusable switch row aligned to the Tamagui theme.
 */
export function AppToggleRow({
  label,
  description,
  checked,
  disabled = false,
  testID,
  onCheckedChange,
}: AppToggleRowProps): ReactElement {
  const handleCheckedChange = useCallback(
    (value: boolean | "indeterminate"): void => {
      const next = Boolean(value);
      triggerHapticImpact("light");
      onCheckedChange(next);
    },
    [onCheckedChange],
  );

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3" testID={testID}>
      <YStack flex={1} gap="$1">
        <Paragraph color="$color" fontFamily="$body" fontSize="$4">
          {label}
        </Paragraph>
        {description ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {description}
          </Paragraph>
        ) : null}
      </YStack>
      <Switch
        checked={checked}
        disabled={disabled}
        testID={testID ? `${testID}-switch` : undefined}
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled }}
        onCheckedChange={handleCheckedChange}
      >
        <Switch.Thumb />
      </Switch>
    </XStack>
  );
}
