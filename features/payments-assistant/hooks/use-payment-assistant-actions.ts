/**
 * Action handlers for the Payments Assistant deck (mobile).
 *
 * Extracted from {@link usePaymentAssistantController} so the controller stays
 * small. All side effects (mutations) flow through here; the pure deck reducer
 * drives navigation.
 */

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";

import type { UpdateTransactionCommand } from "@/features/transactions/contracts";
import {
  type DeckAction,
  type DeckState,
  advanceDeck,
  currentCard,
  undoDeck,
} from "@/features/payments-assistant/services/payment-assistant-deck";

/** A mutation surface exposing only the `mutateAsync` the assistant uses. */
interface MutateAsync<TArgs> {
  readonly mutateAsync: (args: TArgs) => Promise<unknown>;
}

/** The four transaction mutations the assistant drives. */
export interface AssistantMutations {
  readonly markPaid: MutateAsync<{ transactionId: string; paidAt: string }>;
  readonly remove: MutateAsync<{ transactionId: string; scope: "occurrence" | "series" }>;
  readonly update: MutateAsync<{ transactionId: string; payload: UpdateTransactionCommand }>;
  readonly restore: { readonly mutateAsync: (id: string) => Promise<unknown> };
}

/** Dependencies the action handlers operate on. */
export interface AssistantActionsDeps {
  readonly deck: DeckState;
  readonly setDeck: Dispatch<SetStateAction<DeckState>>;
  readonly setLastAction: Dispatch<SetStateAction<DeckAction | null>>;
  readonly mutations: AssistantMutations;
  readonly now: () => Date;
}

/** The handler surface returned to the controller. */
export interface AssistantActions {
  readonly pay: () => Promise<void>;
  readonly discard: () => Promise<void>;
  readonly skipCard: () => void;
  readonly markAllPaid: () => Promise<void>;
  readonly undo: () => Promise<DeckAction | null>;
  readonly isActing: boolean;
  readonly actionError: unknown | null;
  readonly failedAction: AssistantActionKind | null;
  readonly dismissActionError: () => void;
  readonly retryLastAction: () => Promise<void>;
}

export type AssistantActionKind = "pay" | "discard" | "mark-all" | "undo";

/**
 * Builds the deck action handlers over the given dependencies.
 *
 * @param deps Deck state, setters, mutations and clock.
 * @returns The pay/discard/skip/markAll/undo handlers.
 */
export const useAssistantActions = (deps: AssistantActionsDeps): AssistantActions => {
  const { deck, setDeck, setLastAction, mutations, now } = deps;
  const actionInFlightRef = useRef(false);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<unknown | null>(null);
  const [failedAction, setFailedAction] = useState<AssistantActionKind | null>(null);

  const executeAction = useCallback(
    async (
      kind: AssistantActionKind,
      operation: () => Promise<void>,
    ): Promise<boolean> => {
      if (actionInFlightRef.current) {
        return false;
      }

      actionInFlightRef.current = true;
      setIsActing(true);
      setActionError(null);

      try {
        await operation();
        setFailedAction(null);
        return true;
      } catch (error) {
        setActionError(error);
        setFailedAction(kind);
        return false;
      } finally {
        actionInFlightRef.current = false;
        setIsActing(false);
      }
    },
    [],
  );

  const pay = useCallback(async (): Promise<void> => {
    const card = currentCard(deck);
    if (!card) {
      return;
    }
    await executeAction("pay", async () => {
      await mutations.markPaid.mutateAsync({
        transactionId: card.id,
        paidAt: now().toISOString(),
      });
      setDeck((state) => advanceDeck(state, "paid"));
      setLastAction({ kind: "paid", card });
    });
  }, [deck, executeAction, mutations.markPaid, now, setDeck, setLastAction]);

  const discard = useCallback(async (): Promise<void> => {
    const card = currentCard(deck);
    if (!card) {
      return;
    }
    await executeAction("discard", async () => {
      await mutations.remove.mutateAsync({
        transactionId: card.id,
        scope: "occurrence",
      });
      setDeck((state) => advanceDeck(state, "deleted"));
      setLastAction({ kind: "deleted", card });
    });
  }, [deck, executeAction, mutations.remove, setDeck, setLastAction]);

  const skipCard = useCallback((): void => {
    if (actionInFlightRef.current) {
      return;
    }
    const card = currentCard(deck);
    if (!card) {
      return;
    }
    setActionError(null);
    setFailedAction(null);
    setDeck((state) => advanceDeck(state, "skipped"));
    setLastAction({ kind: "skipped", card });
  }, [deck, setDeck, setLastAction]);

  const markAllPaid = useCallback(async (): Promise<void> => {
    await executeAction("mark-all", async () => {
      let working = deck;
      let card = currentCard(working);
      while (card) {
        await mutations.markPaid.mutateAsync({
          transactionId: card.id,
          paidAt: now().toISOString(),
        });
        working = advanceDeck(working, "paid");
        setDeck(working);
        setLastAction({ kind: "paid", card });
        card = currentCard(working);
      }
    });
  }, [deck, executeAction, mutations.markPaid, now, setDeck, setLastAction]);

  const undo = useCallback(async (): Promise<DeckAction | null> => {
    const { deck: previous, undone } = undoDeck(deck);
    if (!undone) {
      return null;
    }
    let succeeded = false;
    await executeAction("undo", async () => {
      if (undone.kind === "paid") {
        await mutations.update.mutateAsync({
          transactionId: undone.card.id,
          payload: { status: "pending", paidAt: null },
        });
      } else if (undone.kind === "deleted") {
        await mutations.restore.mutateAsync(undone.card.id);
      }
      setDeck(previous);
      setLastAction(null);
      succeeded = true;
    });
    return succeeded ? undone : null;
  }, [
    deck,
    executeAction,
    mutations.restore,
    mutations.update,
    setDeck,
    setLastAction,
  ]);

  const dismissActionError = useCallback((): void => {
    setActionError(null);
    setFailedAction(null);
  }, []);

  const retryLastAction = useCallback(async (): Promise<void> => {
    if (failedAction === "pay") {
      await pay();
    } else if (failedAction === "discard") {
      await discard();
    } else if (failedAction === "mark-all") {
      await markAllPaid();
    } else if (failedAction === "undo") {
      await undo();
    }
  }, [discard, failedAction, markAllPaid, pay, undo]);

  return {
    pay,
    discard,
    skipCard,
    markAllPaid,
    undo,
    isActing,
    actionError,
    failedAction,
    dismissActionError,
    retryLastAction,
  };
};
