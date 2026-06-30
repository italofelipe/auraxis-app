/**
 * Action handlers for the Payments Assistant deck (mobile).
 *
 * Extracted from {@link usePaymentAssistantController} so the controller stays
 * small. All side effects (mutations) flow through here; the pure deck reducer
 * drives navigation.
 */

import { type Dispatch, type SetStateAction, useCallback } from "react";

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
}

/** Formats a Date as a local `YYYY-MM-DD` calendar date. */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Builds the deck action handlers over the given dependencies.
 *
 * @param deps Deck state, setters, mutations and clock.
 * @returns The pay/discard/skip/markAll/undo handlers.
 */
export const useAssistantActions = (deps: AssistantActionsDeps): AssistantActions => {
  const { deck, setDeck, setLastAction, mutations, now } = deps;

  const pay = useCallback(async (): Promise<void> => {
    const card = currentCard(deck);
    if (!card) {
      return;
    }
    await mutations.markPaid.mutateAsync({ transactionId: card.id, paidAt: toIsoDate(now()) });
    setDeck((state) => advanceDeck(state, "paid"));
    setLastAction({ kind: "paid", card });
  }, [deck, mutations, now, setDeck, setLastAction]);

  const discard = useCallback(async (): Promise<void> => {
    const card = currentCard(deck);
    if (!card) {
      return;
    }
    await mutations.remove.mutateAsync({ transactionId: card.id, scope: "occurrence" });
    setDeck((state) => advanceDeck(state, "deleted"));
    setLastAction({ kind: "deleted", card });
  }, [deck, mutations, setDeck, setLastAction]);

  const skipCard = useCallback((): void => {
    const card = currentCard(deck);
    if (!card) {
      return;
    }
    setDeck((state) => advanceDeck(state, "skipped"));
    setLastAction({ kind: "skipped", card });
  }, [deck, setDeck, setLastAction]);

  const markAllPaid = useCallback(async (): Promise<void> => {
    let working = deck;
    let card = currentCard(working);
    while (card) {
      await mutations.markPaid.mutateAsync({ transactionId: card.id, paidAt: toIsoDate(now()) });
      working = advanceDeck(working, "paid");
      setLastAction({ kind: "paid", card });
      card = currentCard(working);
    }
    setDeck(working);
  }, [deck, mutations, now, setDeck, setLastAction]);

  const undo = useCallback(async (): Promise<DeckAction | null> => {
    const { deck: previous, undone } = undoDeck(deck);
    if (!undone) {
      return null;
    }
    setDeck(previous);
    setLastAction(null);
    if (undone.kind === "paid") {
      await mutations.update.mutateAsync({
        transactionId: undone.card.id,
        payload: { status: "pending", paidAt: null },
      });
    } else if (undone.kind === "deleted") {
      await mutations.restore.mutateAsync(undone.card.id);
    }
    return undone;
  }, [deck, mutations, setDeck, setLastAction]);

  return { pay, discard, skipCard, markAllPaid, undo };
};
