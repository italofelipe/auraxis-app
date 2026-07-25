import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";

/** Props for the assistant footer (undo / process-all). */
export interface PaymentAssistantFooterProps {
  readonly canUndo: boolean;
  readonly showMarkAll: boolean;
  readonly onUndo: () => void;
  readonly onMarkAll: () => void;
  readonly isActing: boolean;
}

/**
 * Footer row: undo (when an action can be reverted) and process-all (when
 * there is more than one card).
 *
 * @param props Footer visibility flags and handlers.
 * @returns The footer row.
 */
export function PaymentAssistantFooter({
  canUndo,
  showMarkAll,
  onUndo,
  onMarkAll,
  isActing,
}: PaymentAssistantFooterProps): ReactElement {
  const { t } = useT();
  const theme = useTheme();
  const color = theme.color?.val ?? "#111111";
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$2">
      {canUndo ? (
        <AppButton
          tone="secondary"
          onPress={onUndo}
          disabled={isActing}
          accessibilityLabel={t("paymentsAssistant.actions.undo")}
        >
          <FooterContent
            icon="undo-variant"
            label={t("paymentsAssistant.actions.undo")}
            color={color}
          />
        </AppButton>
      ) : (
        <YStack />
      )}
      <XStack gap="$2">
        {showMarkAll ? (
          <AppButton
            tone="secondary"
            onPress={onMarkAll}
            disabled={isActing}
            accessibilityLabel={t("paymentsAssistant.actions.markAllPaid")}
          >
            <FooterContent
              icon="check-all"
              label={t("paymentsAssistant.actions.markAllPaid")}
              color={color}
            />
          </AppButton>
        ) : null}
      </XStack>
    </XStack>
  );
}

function FooterContent({
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
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Paragraph color={color} fontFamily="$body" fontSize="$2" fontWeight="$6">
        {label}
      </Paragraph>
    </XStack>
  );
}
