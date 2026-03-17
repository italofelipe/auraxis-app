import { StyleSheet, Text, View } from "react-native";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { useWalletSummaryQuery } from "@/hooks/queries/use-wallet-query";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colorPalette.white,
    borderRadius: radii.md,
    padding: spacing(2),
    gap: spacing(1),
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.neutral700,
  },
  cardTitle: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colorPalette.neutral950,
  },
  cardSubtitle: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colorPalette.neutral700,
  },
  headlineSmall: {
    fontFamily: typography.heading,
    fontSize: fontSizes["2xl"],
    color: colorPalette.neutral950,
  },
  bodyText: {
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.neutral900,
  },
  list: {
    gap: spacing(1),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default function WalletScreen() {
  const walletSummaryQuery = useWalletSummaryQuery();

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Carteira</Text>
        <Text style={styles.cardSubtitle}>Distribuicao atual</Text>
        <View style={styles.list}>
          {walletSummaryQuery.isPending ? (
            <LoadingSkeleton height={32} />
          ) : (
            <Text style={styles.headlineSmall}>
              Total: {currencyFormatter.format(walletSummaryQuery.data?.total ?? 0)}
            </Text>
          )}

          {(walletSummaryQuery.data?.assets ?? []).map((asset) => (
            <View style={styles.row} key={asset.id}>
              <Text style={styles.bodyText}>{asset.name}</Text>
              <Text style={styles.bodyText}>{currencyFormatter.format(asset.amount)}</Text>
              <Text style={styles.bodyText}>{asset.allocation}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
