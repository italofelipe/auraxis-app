import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { colorPalette } from "@/config/design-tokens";
import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { privateTabDefinitions } from "@/core/navigation/routes";
import { usePrivateRouteGuard } from "@/core/navigation/use-route-guards";
import { useEntitlementsForegroundRefresh } from "@/features/entitlements/hooks/use-entitlements-foreground-refresh";

function PrivateLayoutContent(): ReactElement | null {
  const { ready, redirectTo } = usePrivateRouteGuard();
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
              tabBarIcon: ({ color, size }) => {
                return (
                  <MaterialCommunityIcons name={tab.icon} color={color} size={size} />
                );
              },
            }}
          />
        );
      })}
      <Tabs.Screen
        name="installment-vs-cash"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="confirm-email-pending"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="compartilhamentos"
        options={{
          href: null,
        }}
      />
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
