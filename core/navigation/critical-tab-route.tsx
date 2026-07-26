import { useEffect, type PropsWithChildren, type ReactElement } from "react";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";
import { navigationLogger } from "@/core/telemetry/domain-loggers";

interface CriticalTabRouteProps extends PropsWithChildren {
  readonly route: "insights" | "credit-cards";
  readonly title: string;
}

export function CriticalTabRoute({
  children,
  route,
  title,
}: CriticalTabRouteProps): ReactElement {
  useEffect(() => {
    navigationLogger.log("navigation.critical_tab_mounted", {
      context: { route },
    });

    return () => {
      navigationLogger.log("navigation.critical_tab_unmounted", {
        context: { route },
      });
    };
  }, [route]);

  return (
    <AppErrorBoundary
      scope={`critical-tab:${route}`}
      presentation="screen"
      fallbackTitle={`Não foi possível abrir ${title}`}
      fallbackDescription="A aba encontrou um erro inesperado. Tente novamente sem precisar reiniciar o aplicativo."
      resetLabel="Tentar novamente"
      testID={`${route}-error-boundary`}
    >
      {children}
    </AppErrorBoundary>
  );
}
