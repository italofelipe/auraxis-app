import type { PropsWithChildren, ReactElement } from "react";

import { useAccessibilityPreferences } from "@/core/shell/use-accessibility-preferences";
import { useRuntimeLifecycle } from "@/core/shell/use-runtime-lifecycle";
import { useNavigationTelemetry } from "@/core/telemetry/use-navigation-telemetry";

export const RuntimeProvider = ({
  children,
}: PropsWithChildren): ReactElement => {
  useAccessibilityPreferences();
  useRuntimeLifecycle();
  useNavigationTelemetry();
  return <>{children}</>;
};
