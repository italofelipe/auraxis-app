import { Redirect } from "expo-router";

import { useRootRouteGuard } from "@/core/navigation/use-route-guards";
import { AppAsyncState } from "@/shared/components/app-async-state";
import { AppScreen } from "@/shared/components/app-screen";

export default function IndexScreen() {
  const { ready, redirectTo } = useRootRouteGuard();

  if (!ready) {
    return (
      <AppScreen scrollable={false}>
        <AppAsyncState
          state={{
            kind: "loading",
            title: "Carregando Auraxis",
            description: "Preparando a sua sessao para decidir o melhor proximo passo.",
            presentation: "notice",
            skeletonLines: 3,
          }}
        />
      </AppScreen>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return null;
}
