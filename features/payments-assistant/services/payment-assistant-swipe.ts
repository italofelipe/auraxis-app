/**
 * Pure swipe-gesture resolution for the Payments Assistant deck.
 *
 * Keeping the threshold decision pure makes the Tinder-style gesture testable
 * without rendering Reanimated/Gesture Handler.
 */

/** Outcome of a horizontal swipe over a card. */
export type SwipeOutcome = "pay" | "delete" | "none";

/**
 * Resolves a horizontal swipe into an action.
 *
 * Swiping right past the threshold marks paid/received; swiping left past it
 * deletes; anything short snaps back (none). A generous threshold avoids
 * accidental destructive swipes.
 *
 * @param translationX Horizontal travel in px (positive = right).
 * @param threshold Minimum absolute travel to commit (px, must be > 0).
 * @returns "pay", "delete", or "none".
 */
export const resolveSwipeOutcome = (translationX: number, threshold: number): SwipeOutcome => {
  if (translationX >= threshold) {
    return "pay";
  }
  if (translationX <= -threshold) {
    return "delete";
  }
  return "none";
};
