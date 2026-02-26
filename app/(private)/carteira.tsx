import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { spacing } from "@/config/design-tokens";
import { useWalletSummaryQuery } from "@/hooks/queries/use-wallet-query";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const styles = StyleSheet.create({
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
      <Card>
        <Card.Title title="Carteira" subtitle="Distribuicao atual" />
        <Card.Content style={styles.list}>
          {walletSummaryQuery.isPending ? (
            <LoadingSkeleton height={32} />
          ) : (
            <Text variant="headlineSmall">
              Total: {currencyFormatter.format(walletSummaryQuery.data?.total ?? 0)}
            </Text>
          )}

          {(walletSummaryQuery.data?.assets ?? []).map((asset) => (
            <View style={styles.row} key={asset.id}>
              <Text>{asset.name}</Text>
              <Text>{currencyFormatter.format(asset.amount)}</Text>
              <Text>{asset.allocation}%</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}
