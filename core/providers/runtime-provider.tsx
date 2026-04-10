import type { PropsWithChildren, ReactElement } from "react";

import { useAccessibilityPreferences } from "@/core/shell/use-accessibility-preferences";
import { useRuntimeLifecycle } from "@/core/shell/use-runtime-lifecycle";
import { useObservabilityRuntimeBridge } from "@/core/telemetry/use-observability-runtime-bridge";
import { useNavigationTelemetry } from "@/core/telemetry/use-navigation-telemetry";

export const RuntimeProvider = ({
  children,
}: PropsWithChildren): ReactElement => {
  useAccessibilityPreferences();
  useRuntimeLifecycle();
  useNavigationTelemetry();
  useObservabilityRuntimeBridge();
  return <>{children}</>;
};
