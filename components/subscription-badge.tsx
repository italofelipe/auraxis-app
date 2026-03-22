import { StyleSheet, Text, View } from "react-native";

import { borderWidths, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import type { SubscriptionStatus } from "@/types/contracts";

interface SubscriptionBadgeProps {
  readonly status: SubscriptionStatus;
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Ativo",
  trialing: "Trial",
  past_due: "Vencido",
  canceled: "Cancelado",
};

const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  active: "#22c55e",
  trialing: "#3b82f6",
  past_due: "#f97316",
  canceled: "#9ca3af",
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
  },
  label: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.xs,
  },
});

export const SubscriptionBadge = ({ status }: SubscriptionBadgeProps) => {
  const color = STATUS_COLOR[status];
  const label = STATUS_LABEL[status];

  return (
    <View
      style={[
        styles.badge,
        { borderColor: color, backgroundColor: color + "20" },
      ]}
      testID="subscription-badge"
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};
