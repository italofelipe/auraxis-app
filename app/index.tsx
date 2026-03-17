import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";

import { ScreenContainer } from "@/components/ui/screen-container";
import { useSessionStore } from "@/stores/session-store";

export default function IndexScreen() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  if (!hydrated) {
    return (
      <ScreenContainer scrollable={false}>
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
