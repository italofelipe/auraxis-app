import type { PropsWithChildren, ReactElement, ReactNode, Ref } from "react";
import type { ScrollView as NativeScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { ScrollView, YStack } from "tamagui";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations } from "@/shared/theme/motion";

export type AppScreenScrollHandle = NativeScrollView;

export interface AppScreenProps extends PropsWithChildren {
  readonly scrollable?: boolean;
  /**
   * Toggles a soft fade-in entrance animation on the screen content.
   * Honours the user's "Reduce Motion" preference automatically.
   * Defaults to `true` so every screen feels alive without per-screen
   * boilerplate.
   */
  readonly animateEntry?: boolean;
  readonly testID?: string;
  readonly scrollViewRef?: Ref<AppScreenScrollHandle>;
}

interface ContentWrapperProps {
  readonly animateEntry: boolean;
  readonly reducedMotion: boolean;
  readonly children: ReactNode;
}

const ContentWrapper = ({
  animateEntry,
  reducedMotion,
  children,
}: ContentWrapperProps): ReactElement => {
  if (!animateEntry || reducedMotion) {
    return <>{children}</>;
  }
  return (
    <Animated.View
      style={{ flex: 1 }}
      entering={FadeIn.duration(motionDurations.normal)}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Canonical screen wrapper for Tamagui-based mobile surfaces.
 *
 * Applies a soft fade-in to screen content by default so navigation
 * pushes feel polished without each screen having to wire animation
 * itself. Disable via `animateEntry={false}` if needed.
 *
 * @param props Screen composition props.
 * @returns Safe-area aware screen with shared padding and vertical rhythm.
 */
export function AppScreen({
  children,
  scrollable = true,
  animateEntry = true,
  testID,
  scrollViewRef,
}: AppScreenProps): ReactElement {
  const reducedMotion = useAppShellStore((state) => state.reducedMotionEnabled);

  if (!scrollable) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ContentWrapper animateEntry={animateEntry} reducedMotion={reducedMotion}>
          <YStack
            flex={1}
            backgroundColor="$background"
            paddingHorizontal="$4"
            paddingVertical="$4"
            gap="$4"
            testID={testID}
          >
            {children}
          </YStack>
        </ContentWrapper>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ContentWrapper animateEntry={animateEntry} reducedMotion={reducedMotion}>
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          backgroundColor="$background"
          testID={testID}
        >
          <YStack
            flex={1}
            paddingHorizontal="$4"
            paddingVertical="$4"
            gap="$4"
          >
            {children}
          </YStack>
        </ScrollView>
      </ContentWrapper>
    </SafeAreaView>
  );
}
