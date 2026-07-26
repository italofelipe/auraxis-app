import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";

/** Props for the assistant's primary action buttons. */
export interface PaymentAssistantActionsBarProps {
  readonly payLabel: string;
  readonly onPay: () => void;
  readonly onDelete: () => void;
  readonly onSkip: () => void;
  readonly isActing: boolean;
}

/**
 * Accessible button row mirroring the swipe gestures (pay / delete / skip).
 *
 * @param props Pay label and the three handlers.
 * @returns The stacked action buttons.
 */
export function PaymentAssistantActionsBar({
  payLabel,
  onPay,
  onDelete,
  onSkip,
  isActing,
}: PaymentAssistantActionsBarProps): ReactElement {
  const { t } = useT();
  const theme = useTheme();
  const primaryForeground =
    theme.actionPrimaryForeground?.val ?? theme.background?.val ?? "#ffffff";
  const secondaryForeground = theme.color?.val ?? "#111111";
  return (
    <YStack gap="$2">
      <AppButton
        tone="primary"
        fullWidth
        onPress={onPay}
        disabled={isActing}
        accessibilityLabel={
          isActing ? t("paymentsAssistant.actions.processing") : payLabel
        }
      >
        <ActionContent
          icon="check-circle-outline"
          label={isActing ? t("paymentsAssistant.actions.processing") : payLabel}
          color={primaryForeground}
        />
      </AppButton>
      <AppButton
        tone="danger"
        fullWidth
        onPress={onDelete}
        disabled={isActing}
        accessibilityLabel={t("paymentsAssistant.actions.delete")}
      >
        <ActionContent
          icon="trash-can-outline"
          label={t("paymentsAssistant.actions.delete")}
          color={primaryForeground}
        />
      </AppButton>
      <AppButton
        tone="secondary"
        fullWidth
        onPress={onSkip}
        disabled={isActing}
        accessibilityLabel={t("paymentsAssistant.actions.skip")}
      >
        <ActionContent
          icon="skip-next-outline"
          label={t("paymentsAssistant.actions.skip")}
          color={secondaryForeground}
        />
      </AppButton>
    </YStack>
  );
}

function ActionContent({
  color,
  icon,
  label,
}: {
  readonly color: string;
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly label: string;
}): ReactElement {
  return (
    <XStack alignItems="center" justifyContent="center" gap="$2">
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Paragraph color={color} fontFamily="$body" fontSize="$3" fontWeight="$6">
        {label}
      </Paragraph>
    </XStack>
  );
}
