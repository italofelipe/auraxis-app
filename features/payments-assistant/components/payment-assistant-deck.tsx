import { type ReactElement, useEffect } from "react";

import { Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { TransactionRecord } from "@/features/transactions/contracts";
import { PaymentAssistantCard } from "@/features/payments-assistant/components/payment-assistant-card";
import { resolveSwipeOutcome } from "@/features/payments-assistant/services/payment-assistant-swipe";

const SCREEN_WIDTH = Dimensions.get("window").width;
/** Commit threshold: ~28% of the screen — generous, to avoid accidental swipes. */
const SWIPE_THRESHOLD = Math.round(SCREEN_WIDTH * 0.28);
/** Off-screen fly-out distance. */
const FLY_OUT = SCREEN_WIDTH * 1.2;

/** Props for the swipe deck. */
export interface PaymentAssistantDeckProps {
  /** The card currently on top, or null when the deck is exhausted. */
  readonly card: TransactionRecord | null;
  /** Swiped right past the threshold (pay/receive). */
  readonly onPay: () => void;
  /** Swiped left past the threshold (delete — caller confirms). */
  readonly onDelete: () => void;
}

/**
 * Tinder-style swipe deck: the top card follows the finger; releasing past the
 * threshold flies it out and commits (right = pay, left = delete), otherwise it
 * springs back. Built on Gesture Handler + Reanimated (no extra dependency).
 *
 * @param props Current card and commit callbacks.
 * @returns The animated, swipeable top card.
 */
export function PaymentAssistantDeck({
  card,
  onPay,
  onDelete,
}: PaymentAssistantDeckProps): ReactElement | null {
  const translateX = useSharedValue(0);

  // Reset position whenever a new card becomes the top of the deck.
  useEffect(() => {
    translateX.value = 0;
  }, [card?.id, translateX]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const outcome = resolveSwipeOutcome(event.translationX, SWIPE_THRESHOLD);
      if (outcome === "pay") {
        translateX.value = withTiming(FLY_OUT, { duration: 180 }, () => {
          runOnJS(onPay)();
        });
      } else if (outcome === "delete") {
        translateX.value = withTiming(-FLY_OUT, { duration: 180 }, () => {
          runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${(translateX.value / SCREEN_WIDTH) * 8}deg` },
    ],
  }));

  if (!card) {
    return null;
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle} testID="payment-assistant-deck-card">
        <PaymentAssistantCard transaction={card} />
      </Animated.View>
    </GestureDetector>
  );
}
