# Transactions Android crash

## Overview

On Android, the Transactions tab must open without mounting the native
`ReanimatedSwipeable` wrapper for each feed card. The canonical action path is
the tap-driven transaction action sheet; swipe is only a shortcut.

## Root Cause

The Transactions feed renders `TxCard` items inside `FlashList`. Each card used
to mount `react-native-gesture-handler/ReanimatedSwipeable` on every platform.
That native wrapper is the only Transactions-screen component that depends on
the Android gesture/reanimated runtime during card mount and is mocked away in
Jest, so unit tests did not exercise the same path that crashed in the Android
app.

The app already has a global `GestureHandlerRootView` and deduped compatible
versions of `react-native-gesture-handler`, `react-native-reanimated` and
`react-native-worklets`; the issue is localized to the feed card swipe wrapper.

## Behavior

- Android renders each `TxCard` as a plain pressable card.
- Tapping the card still opens the transaction action sheet with pay, edit,
  duplicate, installment-group and delete actions.
- Accessibility actions for pay and delete stay available on Android.
- Non-Android platforms keep the swipe shortcut.

## Validation

Focused coverage lives in:

- `features/transactions/components/tx-components.test.tsx`

The Android regression test asserts that `TxCard` does not mount
`ReanimatedSwipeable` when `Platform.OS === "android"` and that tap,
pay-accessibility and delete-accessibility handlers still fire.

Run `npm run quality-check` before release.
