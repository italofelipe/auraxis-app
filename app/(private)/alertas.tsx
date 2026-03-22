import { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AlertPreferenceItem } from "@/components/alert-preference-item";
import { AlertsList } from "@/components/alerts-list";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { useAlertPreferencesQuery } from "@/hooks/queries/use-alert-preferences-query";
import type { AlertPreference } from "@/types/contracts";

type TabKey = "alerts" | "preferences";

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginBottom: spacing(1),
  },
  tab: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.brand500,
  },
  tabActive: {
    backgroundColor: colorPalette.brand500,
  },
  tabText: {
    fontFamily: typography.bodyMedium,
    fontSize: fontSizes.sm,
    color: colorPalette.neutral950,
  },
  errorText: {
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.danger500,
    textAlign: "center",
    paddingVertical: spacing(2),
  },
});

const TABS: { readonly key: TabKey; readonly label: string }[] = [
  { key: "alerts", label: "Alertas" },
  { key: "preferences", label: "Preferencias" },
];

const renderPreferenceItem = ({ item }: { readonly item: AlertPreference }) => (
  <AlertPreferenceItem preference={item} />
);

const keyExtractor = (item: AlertPreference) => item.id;

const PreferencesTab = () => {
  const preferencesQuery = useAlertPreferencesQuery();

  if (preferencesQuery.isPending) {
    return <LoadingSkeleton />;
  }

  if (preferencesQuery.isError) {
    return (
      <Text style={styles.errorText}>
        Erro ao carregar preferencias.
      </Text>
    );
  }

  return (
    <FlatList
      data={preferencesQuery.data ?? []}
      keyExtractor={keyExtractor}
      renderItem={renderPreferenceItem}
    />
  );
};

export default function AlertasScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("alerts");

  return (
    <ScreenContainer>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={styles.tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === "alerts" ? <AlertsList /> : <PreferencesTab />}
    </ScreenContainer>
  );
}
