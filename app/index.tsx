import { Redirect } from "expo-router";

import { useRootRouteGuard } from "@/core/navigation/use-route-guards";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";
import { AppScreen } from "@/shared/components/app-screen";

export default function IndexScreen() {
  const { ready, redirectTo } = useRootRouteGuard();

  if (!ready) {
    return (
      <AppScreen scrollable={false}>
        <AsyncStateNotice
          kind="loading"
          title="Carregando Auraxis"
          description="Preparando a sua sessao para decidir o melhor proximo passo."
        />
      </AppScreen>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return null;
}
