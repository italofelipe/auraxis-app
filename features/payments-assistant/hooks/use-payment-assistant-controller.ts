/**
 * Controller for the Payments Assistant on mobile.
 *
 * Wires entitlement (Premium), the overdue-candidates query and the transaction
 * mutations to a card deck, exposing a view model + actions for the host screen.
 * Decision logic lives in the pure `services/payment-assistant-*` modules and
 * the action handlers in `use-payment-assistant-actions`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import type { TransactionListQuery, TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import {
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useRestoreTransactionMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";

import {
  OVERDUE_THRESHOLD_DAYS,
  selectOverdueCandidates,
} from "@/features/payments-assistant/services/payment-assistant-eligibility";
import {
  type DeckAction,
  type DeckProgress,
  type DeckState,
  createDeck,
  currentCard,
  deckProgress,
  isDeckDone,
} from "@/features/payments-assistant/services/payment-assistant-deck";
import {
  markShownThisSession,
  shouldAutoOpenAssistant,
  wasShownThisSession,
} from "@/features/payments-assistant/services/payment-assistant-session";
import {
  type AssistantActions,
  useAssistantActions,
} from "@/features/payments-assistant/hooks/use-payment-assistant-actions";

/** Entitlement that stands in for "Premium" on mobile (single paid tier). */
const PREMIUM_FEATURE_KEY = "advanced_simulations" as const;
/** Page size when pulling overdue candidates (overdue backlog is small in practice). */
const CANDIDATE_PAGE_SIZE = 100;

/** Options for {@link usePaymentAssistantController}. */
export interface UsePaymentAssistantControllerOptions {
  /** Clock injector (defaults to `() => new Date()`), overridable in tests. */
  readonly now?: () => Date;
}

/** View model + actions exposed to the host screen. */
export interface PaymentAssistantController extends AssistantActions {
  readonly isVisible: boolean;
  readonly current: TransactionRecord | null;
  readonly progress: DeckProgress;
  readonly isDone: boolean;
  readonly lastAction: DeckAction | null;
  readonly open: () => void;
  readonly close: () => void;
}

/** Formats a Date as a local `YYYY-MM-DD` calendar date. */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Builds the list filter that caps the fetch to entries past the overdue threshold. */
const buildOverdueFilters = (now: () => Date): TransactionListQuery => {
  const cutoff = now();
  cutoff.setDate(cutoff.getDate() - OVERDUE_THRESHOLD_DAYS);
  return { endDate: toIsoDate(cutoff), perPage: CANDIDATE_PAGE_SIZE };
};

/**
 * Payments Assistant controller.
 *
 * @param options Optional clock injector.
 * @returns View model + actions for the host screen.
 */
export const usePaymentAssistantController = (
  options: UsePaymentAssistantControllerOptions = {},
): PaymentAssistantController => {
  const now = useMemo(() => options.now ?? ((): Date => new Date()), [options.now]);

  const startupReady = useAppShellStore((state) => state.startupReady);
  const { hasAccess: isPremium } = useFeatureAccess(PREMIUM_FEATURE_KEY, startupReady);

  const transactionsQuery = useTransactionsQuery(buildOverdueFilters(now));
  const candidates = useMemo(
    () => selectOverdueCandidates(transactionsQuery.data?.transactions ?? [], now()),
    [transactionsQuery.data, now],
  );

  const mutations = {
    markPaid: useMarkTransactionPaidMutation(),
    remove: useDeleteTransactionMutation(),
    update: useUpdateTransactionMutation(),
    restore: useRestoreTransactionMutation(),
  };

  const [isVisible, setIsVisible] = useState(false);
  const [deck, setDeck] = useState<DeckState>(() => createDeck([]));
  const [lastAction, setLastAction] = useState<DeckAction | null>(null);

  const open = useCallback((): void => {
    setDeck(createDeck(candidates));
    setLastAction(null);
    setIsVisible(true);
    markShownThisSession();
  }, [candidates]);

  const close = useCallback((): void => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (
      shouldAutoOpenAssistant({
        startupReady,
        isPremium,
        shownThisSession: wasShownThisSession(),
        candidateCount: candidates.length,
      })
    ) {
      open();
    }
  }, [startupReady, isPremium, candidates, open]);

  const actions = useAssistantActions({ deck, setDeck, setLastAction, mutations, now });

  return {
    isVisible,
    current: currentCard(deck),
    progress: deckProgress(deck),
    isDone: isDeckDone(deck),
    lastAction,
    open,
    close,
    ...actions,
  };
};
