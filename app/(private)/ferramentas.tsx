import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { spacing } from "@/config/design-tokens";
import { useToolsCatalogQuery } from "@/hooks/queries/use-tools-query";

const styles = StyleSheet.create({
  list: {
    gap: spacing(2),
  },
  card: {
    gap: spacing(1),
    padding: spacing(2),
    borderRadius: 12,
    backgroundColor: "rgba(255, 190, 77, 0.15)",
  },
});

export default function ToolsScreen() {
  const toolsCatalogQuery = useToolsCatalogQuery();

  return (
    <ScreenContainer>
      <Card>
        <Card.Title title="Ferramentas" subtitle="Fluxos administrativos e utilitarios" />
        <Card.Content style={styles.list}>
          {toolsCatalogQuery.isPending ? <LoadingSkeleton height={32} /> : null}

          {(toolsCatalogQuery.data?.tools ?? []).map((tool) => (
            <View style={styles.card} key={tool.id}>
              <Text variant="titleMedium">{tool.name}</Text>
              <Text variant="bodyMedium">{tool.description}</Text>
              <Text variant="labelMedium">
                {tool.enabled ? "Disponivel" : "Em planejamento"}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}
