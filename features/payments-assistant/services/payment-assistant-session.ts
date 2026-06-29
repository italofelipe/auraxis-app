/**
 * Session-scoped gating + auto-open decision for the Payments Assistant.
 *
 * The assistant appears at most once per app session (module-level flag, reset
 * on cold start) and only after startup has resolved. The decision is pure and
 * the flag is test-resettable.
 */

let shownThisSession = false;

/**
 * Whether the assistant has already been shown in this app session.
 *
 * @returns True once {@link markShownThisSession} has been called.
 */
export const wasShownThisSession = (): boolean => shownThisSession;

/** Marks the assistant as shown for the remainder of this session. */
export const markShownThisSession = (): void => {
  shownThisSession = true;
};

/** Resets the session flag. Test-only. */
export const resetPaymentAssistantSessionForTests = (): void => {
  shownThisSession = false;
};

/** Inputs that decide whether the assistant should auto-open on entry. */
export interface AutoOpenParams {
  /** Whether app startup (fonts, session, theme) has resolved. */
  readonly startupReady: boolean;
  /** Whether the current user is entitled to Premium surfaces. */
  readonly isPremium: boolean;
  /** Whether the assistant was already shown in this session. */
  readonly shownThisSession: boolean;
  /** Number of overdue open transactions available to review. */
  readonly candidateCount: number;
}

/**
 * Decides whether the assistant should auto-open for the current entry.
 *
 * @param params Gating inputs.
 * @returns True only when every condition is satisfied.
 */
export const shouldAutoOpenAssistant = (params: AutoOpenParams): boolean =>
  params.startupReady &&
  params.isPremium &&
  !params.shownThisSession &&
  params.candidateCount > 0;
