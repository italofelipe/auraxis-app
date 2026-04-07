import type { PropsWithChildren, ReactElement } from "react";

import { useSessionBootstrap } from "@/core/session/use-session-bootstrap";

export const RuntimeProvider = ({
  children,
}: PropsWithChildren): ReactElement => {
  useSessionBootstrap();
  return <>{children}</>;
};
