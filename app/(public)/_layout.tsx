import { Redirect, Stack } from "expo-router";

import { useSessionStore } from "@/stores/session-store";

export default function PublicLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
