import type { ReactElement } from "react";

import { Redirect, Stack } from "expo-router";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { usePublicRouteGuard } from "@/core/navigation/use-route-guards";

function PublicLayoutContent(): ReactElement | null {
  const { ready, redirectTo } = usePublicRouteGuard();

  if (!ready) {
    return null;
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function PublicLayout(): ReactElement {
  return (
    <AppErrorBoundary
      scope="public-layout"
      presentation="screen"
      fallbackTitle="Nao foi possivel abrir a area publica"
      fallbackDescription="Tente novamente para continuar com o fluxo de acesso.">
      <PublicLayoutContent />
    </AppErrorBoundary>
  );
}
