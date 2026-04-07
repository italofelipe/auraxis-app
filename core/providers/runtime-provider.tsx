import type { PropsWithChildren, ReactElement } from "react";

import { useAccessibilityPreferences } from "@/core/shell/use-accessibility-preferences";
import { useRuntimeLifecycle } from "@/core/shell/use-runtime-lifecycle";

export const RuntimeProvider = ({
  children,
}: PropsWithChildren): ReactElement => {
  useAccessibilityPreferences();
  useRuntimeLifecycle();
  return <>{children}</>;
};
