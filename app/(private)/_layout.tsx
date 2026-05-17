import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { colorPalette } from "@/config/design-tokens";
import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { privateTabDefinitions } from "@/core/navigation/routes";
import { usePrivateRouteGuard } from "@/core/navigation/use-route-guards";
import { useEntitlementsForegroundRefresh } from "@/features/entitlements/hooks/use-entitlements-foreground-refresh";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { WEEKLY_INSIGHT_FEATURE_FLAG_KEY } from "@/features/insights/weekly-insight-config";
import { isFeatureEnabled } from "@/shared/feature-flags";

const HIDDEN_TAB_NAMES: readonly string[] = [
  "installment-vs-cash",
  "confirm-email-pending",
  "compartilhamentos",
  "transacoes",
  "perfil",
  "fiscal",
  "questionario",
  "carteira-operacoes",
  "tags",
  "contas",
  "cartoes",
  "orcamentos",
  "foco",
  "onboarding",
  "simulador-meta",
  "lixeira-transacoes",
  "simulador-salario",
  "preferencias-notificacao",
  "privacidade",
];

function PrivateLayoutContent(): ReactElement | null {
  const { ready, redirectTo } = usePrivateRouteGuard();
  const weeklyInsightEnabled = isFeatureEnabled(WEEKLY_INSIGHT_FEATURE_FLAG_KEY);
  const weeklyInsight = useWeeklyInsight({
    enabled: weeklyInsightEnabled && ready && !redirectTo,
  });
  useEntitlementsForegroundRefresh();

  if (!ready) {
    return null;
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorPalette.brand600,
        tabBarInactiveTintColor: colorPalette.neutral700,
      }}>
      {privateTabDefinitions.map((tab) => {
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarBadge:
                tab.name === "dashboard" && weeklyInsightEnabled && weeklyInsight.isNew
                  ? "1"
                  : undefined,
              tabBarIcon: ({ color, size }) => {
                return (
                  <MaterialCommunityIcons name={tab.icon} color={color} size={size} />
                );
              },
            }}
          />
        );
      })}
      {HIDDEN_TAB_NAMES.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

export default function PrivateLayout(): ReactElement {
  return (
    <AppErrorBoundary
      scope="private-layout"
      presentation="screen"
      fallbackTitle="Nao foi possivel abrir a area logada"
      fallbackDescription="Tente novamente para retomar a navegacao.">
      <PrivateLayoutContent />
    </AppErrorBoundary>
  );
}
