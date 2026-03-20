import type { PropsWithChildren, ReactElement } from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

export interface AppScreenProps extends PropsWithChildren {
  readonly scrollable?: boolean
  readonly testID?: string
}

/**
 * Canonical screen wrapper for Tamagui-based mobile surfaces.
 *
 * @param props Screen composition props.
 * @returns Safe-area aware screen with shared padding and vertical rhythm.
 */
export function AppScreen({
  children,
  scrollable = true,
  testID,
}: AppScreenProps): ReactElement {
  if (!scrollable) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack
          flex={1}
          backgroundColor="$background"
          paddingHorizontal="$4"
          paddingVertical="$4"
          gap="$4"
          testID={testID}>
          {children}
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView flex={1} backgroundColor="$background" testID={testID}>
        <YStack
          flex={1}
          paddingHorizontal="$4"
          paddingVertical="$4"
          gap="$4">
          {children}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
