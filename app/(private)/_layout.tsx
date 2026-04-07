import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { colorPalette } from "@/config/design-tokens";
import { privateTabDefinitions } from "@/core/navigation/routes";
import { usePrivateRouteGuard } from "@/core/navigation/use-route-guards";

export default function PrivateLayout() {
  const { ready, redirectTo } = usePrivateRouteGuard();

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
    </Tabs>
  );
}
