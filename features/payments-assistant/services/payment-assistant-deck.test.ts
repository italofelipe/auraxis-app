import type { TransactionRecord } from "@/features/transactions/contracts";
import {
  advanceDeck,
  createDeck,
  currentCard,
  deckProgress,
  isDeckDone,
  undoDeck,
} from "@/features/payments-assistant/services/payment-assistant-deck";

const card = (id: string): TransactionRecord =>
  ({ id, title: id, dueDate: "2026-01-01", status: "pending" }) as TransactionRecord;

const cards = [card("a"), card("b"), card("c")];

describe("payment-assistant deck reducer", () => {
  it("starts at the first card", () => {
    const deck = createDeck(cards);
    expect(currentCard(deck)?.id).toBe("a");
    expect(deckProgress(deck)).toEqual({ current: 1, total: 3 });
    expect(isDeckDone(deck)).toBe(false);
  });

  it("advances through cards recording the action", () => {
    const deck = advanceDeck(createDeck(cards), "paid");
    expect(currentCard(deck)?.id).toBe("b");
    expect(deckProgress(deck)).toEqual({ current: 2, total: 3 });
  });

  it("is done after the last card is processed", () => {
    let deck = createDeck(cards);
    deck = advanceDeck(deck, "paid");
    deck = advanceDeck(deck, "deleted");
    deck = advanceDeck(deck, "skipped");
    expect(isDeckDone(deck)).toBe(true);
    expect(currentCard(deck)).toBeNull();
    expect(deckProgress(deck)).toEqual({ current: 3, total: 3 });
  });

  it("undo steps back and returns the reverted action and card", () => {
    const advanced = advanceDeck(createDeck(cards), "paid");
    const { deck, undone } = undoDeck(advanced);
    expect(currentCard(deck)?.id).toBe("a");
    expect(undone).toEqual({ kind: "paid", card: cards[0] });
  });

  it("undo is a no-op at the start", () => {
    const deck = createDeck(cards);
    const result = undoDeck(deck);
    expect(result.deck).toEqual(deck);
    expect(result.undone).toBeNull();
  });

  it("treats an empty deck as immediately done", () => {
    const deck = createDeck([]);
    expect(isDeckDone(deck)).toBe(true);
    expect(currentCard(deck)).toBeNull();
    expect(deckProgress(deck)).toEqual({ current: 0, total: 0 });
  });
});
