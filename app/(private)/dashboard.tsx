import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import {
  selectMonthlySnapshot,
  useDashboardOverviewQuery,
} from "@/hooks/queries/use-dashboard-query";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const formatMonth = (month: string): string => {
  return monthFormatter.format(new Date(`${month}-01T00:00:00.000Z`));
};

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
  bodyLarge: {
    fontFamily: typography.body,
    fontSize: fontSizes.lg,
    color: colorPalette.neutral900,
  },
  section: {
    gap: spacing(2),
  },
  values: {
    gap: spacing(1),
  },
  segmentedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1),
  },
  segmentButton: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.sm,
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.brand500,
  },
  segmentButtonActive: {
    backgroundColor: colorPalette.brand500,
  },
  segmentButtonText: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colorPalette.neutral950,
  },
});

export default function DashboardScreen() {
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const overviewQuery = useDashboardOverviewQuery();

  const monthSnapshot = useMemo(() => {
    const overview = overviewQuery.data;

    if (!overview) {
      return null;
    }

    return selectMonthlySnapshot(overview, selectedMonth);
  }, [overviewQuery.data, selectedMonth]);

  const monthButtons = useMemo(() => {
    const overview = overviewQuery.data;

    if (!overview) {
      return [];
    }

    return overview.monthly.map((item) => ({
      value: item.month,
      label: formatMonth(item.month),
    }));
  }, [overviewQuery.data]);

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saldo geral</Text>
        <Text style={styles.cardSubtitle}>Resumo consolidado</Text>
        {overviewQuery.isPending ? (
          <LoadingSkeleton height={32} />
        ) : (
          <Text style={styles.headlineSmall}>
            {currencyFormatter.format(overviewQuery.data?.currentBalance ?? 0)}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo por mes</Text>
        <Text style={styles.cardSubtitle}>Receitas, despesas e saldo</Text>
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.segmentedRow}>
              {monthButtons.map((btn) => (
                <TouchableOpacity
                  key={btn.value}
                  style={[
                    styles.segmentButton,
                    selectedMonth === btn.value && styles.segmentButtonActive,
                  ]}
                  onPress={() => setSelectedMonth(btn.value)}>
                  <Text style={styles.segmentButtonText}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {monthSnapshot ? (
            <View style={styles.values}>
              <Text style={styles.bodyLarge}>
                Receitas: {currencyFormatter.format(monthSnapshot.incomes)}
              </Text>
              <Text style={styles.bodyLarge}>
                Despesas: {currencyFormatter.format(monthSnapshot.expenses)}
              </Text>
              <Text style={styles.bodyLarge}>
                Saldo: {currencyFormatter.format(monthSnapshot.balance)}
              </Text>
            </View>
          ) : (
            <LoadingSkeleton />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
