import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { AppProviders } from "@/core/providers/app-providers";
import { useAppStartup } from "@/core/shell/use-app-startup";
import { usePushNotificationListener } from "@/core/notifications/listener";

function RootLayoutContent() {
  // #657: the premium animated splash (reanimated + SVG on the first JS frame)
  // caused a native boot crash and was never validated on device. The native
  // splash (expo-splash-screen), hidden by useAppStartup once ready, is the
  // proven boot from v1.12.0.
  const { ready } = useAppStartup();
  usePushNotificationListener();

  if (!ready) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 220,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(private)" />
      <Stack.Screen name="(legal)" />
    </Stack>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <AppErrorBoundary
            scope="root-layout"
            presentation="screen"
            fallbackTitle="Nao foi possivel iniciar o app"
            fallbackDescription="Recarregue o aplicativo para tentar novamente.">
            <RootLayoutContent />
          </AppErrorBoundary>
          <StatusBar style="auto" />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
