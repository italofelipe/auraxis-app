import type { PropsWithChildren, ReactElement } from "react";

import { useAccessibilityPreferences } from "@/core/shell/use-accessibility-preferences";
import { useSessionBootstrap } from "@/core/session/use-session-bootstrap";

export const RuntimeProvider = ({
  children,
}: PropsWithChildren): ReactElement => {
  useSessionBootstrap();
  useAccessibilityPreferences();
  return <>{children}</>;
};
