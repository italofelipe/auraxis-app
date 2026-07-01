import { useMemo, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { AppTabBar } from "@/core/navigation/app-tab-bar";
import { privateTabDefinitions } from "@/core/navigation/routes";
import {
  createTabCarouselSceneStyleInterpolator,
  tabCarouselTransitionSpec,
} from "@/core/navigation/tab-carousel-transition";
import { usePrivateRouteGuard } from "@/core/navigation/use-route-guards";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { ExpenseSheetHost } from "@/features/credit-cards/components/expense-sheet/expense-sheet-host";
import { useEntitlementsForegroundRefresh } from "@/features/entitlements/hooks/use-entitlements-foreground-refresh";
import { PaymentAssistantHost } from "@/features/payments-assistant/screens/payment-assistant-host";
import { useWeeklyInsight } from "@/features/insights/hooks/use-weekly-insight-query";
import { WEEKLY_INSIGHT_FEATURE_FLAG_KEY } from "@/features/insights/weekly-insight-config";
import { TourAnchorProvider } from "@/shared/coach-marks/tour-anchor-context";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

const HIDDEN_TAB_NAMES: readonly string[] = [
  "installment-vs-cash",
  "confirm-email-pending",
  "compartilhamentos",
  "carteira",
  "metas",
  "ferramentas",
  "alertas",
  "importar-transacoes",
  "perfil",
  "fiscal",
  "questionario",
  "carteira-operacoes",
  "tags",
  "contas",
  "planejamento",
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
  const resolvedTheme = useResolvedTheme();
  const { width } = useWindowDimensions();
  const tabTheme =
    resolvedTheme === "auraxis_dark" ? darkSemanticColors : lightSemanticColors;
  const sceneStyleInterpolator = useMemo(
    () => createTabCarouselSceneStyleInterpolator(width),
    [width],
  );
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
    <TourAnchorProvider>
      <Tabs
        detachInactiveScreens={false}
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: false,
          transitionSpec: tabCarouselTransitionSpec,
          sceneStyleInterpolator,
          tabBarActiveTintColor: tabTheme.primary,
          tabBarInactiveTintColor: tabTheme.subduedForeground,
          tabBarStyle: {
            backgroundColor: tabTheme.surface,
            borderTopColor: tabTheme.border,
          },
        }}>
        {privateTabDefinitions.map((tab) => {
          return (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarBadge:
                  tab.name === "dashboard" &&
                  weeklyInsightEnabled &&
                  weeklyInsight.isNew
                    ? "1"
                    : undefined,
                tabBarIcon: ({ color, size }) => {
                  return (
                    <MaterialCommunityIcons
                      name={tab.icon}
                      color={color}
                      size={size}
                    />
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
      <ExpenseSheetHost />
      <PaymentAssistantHost />
    </TourAnchorProvider>
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
