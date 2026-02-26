import { useEffect } from "react";

import { useSessionStore } from "@/stores/session-store";

export const useSessionBootstrap = () => {
  const bootstrapSession = useSessionStore((state) => state.bootstrapSession);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);
};
