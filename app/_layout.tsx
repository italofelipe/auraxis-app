import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProviders } from "@/core/providers/app-providers";
import { useAppStartup } from "@/core/shell/use-app-startup";

function RootLayout() {
  const { ready } = useAppStartup();

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(private)" />
          </Stack>
          <StatusBar style="light" />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
