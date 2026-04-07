import { Redirect } from "expo-router";

import { ScreenContainer } from "@/components/ui/screen-container";
import { useRootRouteGuard } from "@/core/navigation/use-route-guards";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

export default function IndexScreen() {
  const { ready, redirectTo } = useRootRouteGuard();

  if (!ready) {
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

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return null;
}
