import { useMemo } from "react";

import {
  createSessionFailurePresentation,
  type SessionFailurePresentation,
} from "@/core/session/session-invalidation";
import { useSessionStore } from "@/core/session/session-store";

export interface SessionFailureNoticeState {
  readonly notice: SessionFailurePresentation | null;
  readonly dismissNotice: () => void;
}

/**
 * Exposes the canonical recovery notice for the current session invalidation, if any.
 *
 * @returns User-facing auth failure notice plus dismiss action.
 */
export const useSessionFailureNotice = (): SessionFailureNoticeState => {
  const authFailureReason = useSessionStore((state) => state.authFailureReason);
  const dismissAuthFailure = useSessionStore((state) => state.dismissAuthFailure);

  const notice = useMemo(() => {
    return createSessionFailurePresentation(authFailureReason);
  }, [authFailureReason]);

  return {
    notice,
    dismissNotice: dismissAuthFailure,
  };
};
