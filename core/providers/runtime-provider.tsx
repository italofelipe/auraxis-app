import type { PropsWithChildren, ReactElement } from "react";

import { useAccessibilityPreferences } from "@/core/shell/use-accessibility-preferences";
import { useRuntimeLifecycle } from "@/core/shell/use-runtime-lifecycle";
import { useObservabilityRuntimeBridge } from "@/core/telemetry/use-observability-runtime-bridge";
import { useNavigationTelemetry } from "@/core/telemetry/use-navigation-telemetry";

interface RuntimeProviderProps extends PropsWithChildren {
  readonly enabled?: boolean;
}

export const RuntimeProvider = ({
  children,
  enabled = true,
}: RuntimeProviderProps): ReactElement => {
  useAccessibilityPreferences(enabled);
  useRuntimeLifecycle(enabled);
  useNavigationTelemetry(enabled);
  useObservabilityRuntimeBridge(enabled);
  return <>{children}</>;
};
