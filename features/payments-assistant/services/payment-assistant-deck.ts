/**
 * Pure reducer for the Payments Assistant card deck.
 *
 * Immutable ordered list with a cursor. Paying, deleting or skipping advances
 * the cursor and records the action; undo steps back and reports the action to
 * revert. Keeps navigation/undo isolated from React and API mutations.
 */

import type { TransactionRecord } from "@/features/transactions/contracts";

/** The kind of action taken on a card. */
export type DeckActionKind = "paid" | "deleted" | "skipped";

/** A recorded action against a specific card. */
export interface DeckAction {
  readonly kind: DeckActionKind;
  readonly card: TransactionRecord;
}

/** Immutable deck state: the cards, the cursor, and the action history. */
export interface DeckState {
  readonly cards: readonly TransactionRecord[];
  readonly index: number;
  readonly history: readonly DeckAction[];
}

/** Progress through the deck, 1-based for display. */
export interface DeckProgress {
  readonly current: number;
  readonly total: number;
}

/**
 * Creates a fresh deck positioned at the first card.
 *
 * @param cards Ordered cards to review.
 * @returns Initial deck state.
 */
export const createDeck = (cards: readonly TransactionRecord[]): DeckState => ({
  cards,
  index: 0,
  history: [],
});

/**
 * Returns the card under the cursor, or null when the deck is done.
 *
 * @param state Deck state.
 * @returns Current card or null.
 */
export const currentCard = (state: DeckState): TransactionRecord | null =>
  state.cards[state.index] ?? null;

/**
 * Whether every card has been processed.
 *
 * @param state Deck state.
 * @returns True when the cursor is past the last card.
 */
export const isDeckDone = (state: DeckState): boolean => state.index >= state.cards.length;

/**
 * Computes 1-based progress, clamped to the deck size.
 *
 * @param state Deck state.
 * @returns Progress `{ current, total }`.
 */
export const deckProgress = (state: DeckState): DeckProgress => ({
  current: Math.min(state.index + (state.cards.length > 0 ? 1 : 0), state.cards.length),
  total: state.cards.length,
});

/**
 * Advances the cursor, recording the action taken on the current card.
 *
 * @param state Deck state.
 * @param kind Action taken on the current card.
 * @returns Next deck state (same state when already done).
 */
export const advanceDeck = (state: DeckState, kind: DeckActionKind): DeckState => {
  const card = currentCard(state);
  if (!card) {
    return state;
  }
  return {
    cards: state.cards,
    index: state.index + 1,
    history: [...state.history, { kind, card }],
  };
};

/** Result of an undo: the new state and the action that was reverted (if any). */
export interface UndoResult {
  readonly deck: DeckState;
  readonly undone: DeckAction | null;
}

/**
 * Steps the cursor back one card, returning the action to revert.
 *
 * @param state Deck state.
 * @returns The previous state and the reverted action, or the same state + null.
 */
export const undoDeck = (state: DeckState): UndoResult => {
  if (state.index <= 0 || state.history.length === 0) {
    return { deck: state, undone: null };
  }
  const undone = state.history[state.history.length - 1] ?? null;
  return {
    deck: {
      cards: state.cards,
      index: state.index - 1,
      history: state.history.slice(0, -1),
    },
    undone,
  };
};
