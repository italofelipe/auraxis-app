import { StyleSheet, Text, View } from "react-native";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { useToolsCatalogQuery } from "@/hooks/queries/use-tools-query";

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
  list: {
    gap: spacing(2),
  },
  toolCard: {
    gap: spacing(1),
    padding: spacing(2),
    borderRadius: spacing(1.5),
    backgroundColor: colorPalette.brand300,
  },
  titleMedium: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.base,
    color: colorPalette.neutral950,
  },
  bodyMedium: {
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.neutral900,
  },
  labelMedium: {
    fontFamily: typography.bodyMedium,
    fontSize: fontSizes.xs,
    color: colorPalette.neutral700,
  },
});

export default function ToolsScreen() {
  const toolsCatalogQuery = useToolsCatalogQuery();

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ferramentas</Text>
        <Text style={styles.cardSubtitle}>Fluxos administrativos e utilitarios</Text>
        <View style={styles.list}>
          {toolsCatalogQuery.isPending ? <LoadingSkeleton height={32} /> : null}

          {(toolsCatalogQuery.data?.tools ?? []).map((tool) => (
            <View style={styles.toolCard} key={tool.id}>
              <Text style={styles.titleMedium}>{tool.name}</Text>
              <Text style={styles.bodyMedium}>{tool.description}</Text>
              <Text style={styles.labelMedium}>
                {tool.enabled ? "Disponivel" : "Em planejamento"}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
