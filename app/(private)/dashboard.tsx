import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, SegmentedButtons, Text } from "react-native-paper";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ScreenContainer } from "@/components/ui/screen-container";
import { spacing } from "@/config/design-tokens";
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
  section: {
    gap: spacing(2),
  },
  values: {
    gap: spacing(1),
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
      <Card>
        <Card.Title title="Saldo geral" subtitle="Resumo consolidado" />
        <Card.Content>
          {overviewQuery.isPending ? (
            <LoadingSkeleton height={32} />
          ) : (
            <Text variant="headlineSmall">
              {currencyFormatter.format(overviewQuery.data?.currentBalance ?? 0)}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Resumo por mes" subtitle="Receitas, despesas e saldo" />
        <Card.Content style={styles.section}>
          <SegmentedButtons
            value={selectedMonth}
            onValueChange={setSelectedMonth}
            buttons={monthButtons}
          />

          {monthSnapshot ? (
            <View style={styles.values}>
              <Text variant="bodyLarge">
                Receitas: {currencyFormatter.format(monthSnapshot.incomes)}
              </Text>
              <Text variant="bodyLarge">
                Despesas: {currencyFormatter.format(monthSnapshot.expenses)}
              </Text>
              <Text variant="bodyLarge">
                Saldo: {currencyFormatter.format(monthSnapshot.balance)}
              </Text>
            </View>
          ) : (
            <LoadingSkeleton />
          )}
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}
