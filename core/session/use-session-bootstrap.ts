import { useEffect } from "react";

import { useSessionStore } from "@/core/session/session-store";

export const useSessionBootstrap = (): void => {
  const bootstrapSession = useSessionStore((state) => state.bootstrapSession);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);
};
