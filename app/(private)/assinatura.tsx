import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { SubscriptionBadge } from "@/components/subscription-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { useSubscriptionQuery } from "@/hooks/queries/use-subscription-query";
import { MANAGE_SUBSCRIPTION_URL } from "@/lib/web-urls";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colorPalette.white,
    borderRadius: radii.md,
    padding: spacing(2),
    gap: spacing(2),
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.neutral700,
  },
  title: {
    fontFamily: typography.headingSemiBold,
    fontSize: fontSizes["2xl"],
    color: colorPalette.neutral950,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
  },
  label: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colorPalette.neutral700,
  },
  value: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.base,
    color: colorPalette.neutral950,
  },
  button: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    backgroundColor: colorPalette.brand600,
    alignItems: "center",
  },
  buttonLabel: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.base,
    color: colorPalette.neutral950,
  },
});

export default function AssinaturaScreen() {
  const { data: subscription, isPending } = useSubscriptionQuery();

  const handleManageSubscription = async () => {
    await Linking.openURL(MANAGE_SUBSCRIPTION_URL);
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Assinatura</Text>

        {isPending ? <LoadingSkeleton height={spacing(4)} /> : null}

        {subscription !== null && subscription !== undefined ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Plano:</Text>
              <Text style={styles.value}>{subscription.plan_slug}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <SubscriptionBadge status={subscription.status} />
            </View>

            {subscription.current_period_end !== null && subscription.current_period_end !== undefined ? (
              <View style={styles.row}>
                <Text style={styles.label}>Validade:</Text>
                <Text style={styles.value}>
                  {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ) : null}

            {subscription.trial_ends_at !== null && subscription.trial_ends_at !== undefined ? (
              <View style={styles.row}>
                <Text style={styles.label}>Trial até:</Text>
                <Text style={styles.value}>
                  {new Date(subscription.trial_ends_at).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={styles.button}
              onPress={handleManageSubscription}
              testID="manage-subscription-button"
            >
              <Text style={styles.buttonLabel}>Gerenciar assinatura</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
