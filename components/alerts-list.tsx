import { FlatList, StyleSheet, Text, View } from "react-native";

import { AlertItem } from "@/components/alert-item";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { colorPalette, fontSizes, spacing, typography } from "@/config/design-tokens";
import { useAlertsQuery } from "@/hooks/queries/use-alerts-query";
import type { Alert } from "@/types/contracts";

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing(4),
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.neutral700,
  },
  errorText: {
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.danger500,
    textAlign: "center",
    paddingVertical: spacing(2),
  },
  listContent: {
    gap: spacing(1),
  },
});

const renderItem = ({ item }: { readonly item: Alert }) => (
  <AlertItem alert={item} />
);

const keyExtractor = (item: Alert) => item.id;

const EmptyComponent = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>Nenhum alerta encontrado.</Text>
  </View>
);

export const AlertsList = () => {
  const alertsQuery = useAlertsQuery();

  if (alertsQuery.isPending) {
    return <LoadingSkeleton />;
  }

  if (alertsQuery.isError) {
    return (
      <Text style={styles.errorText}>
        Erro ao carregar alertas. Tente novamente.
      </Text>
    );
  }

  return (
    <FlatList
      data={alertsQuery.data?.items ?? []}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={EmptyComponent}
    />
  );
};
