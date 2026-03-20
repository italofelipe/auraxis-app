import { Redirect } from "expo-router";

import { ScreenContainer } from "@/components/ui/screen-container";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";
import { useSessionStore } from "@/stores/session-store";

export default function IndexScreen() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  if (!hydrated) {
    return (
      <ScreenContainer scrollable={false}>
        <AsyncStateNotice
          kind="loading"
          title="Carregando Auraxis"
          description="Preparando a sua sessao para decidir o melhor proximo passo."
        />
      </ScreenContainer>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
