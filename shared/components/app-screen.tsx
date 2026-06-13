import {
  useContext,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import type { ScrollView as NativeScrollView } from "react-native";

import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { SafeAreaInsetsContext, SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { ScrollView, YStack } from "tamagui";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations } from "@/shared/theme/motion";

export type AppScreenScrollHandle = NativeScrollView;

// Espaçamento base das telas (= semanticSpacing.md).
const SCREEN_GUTTER = 16;
// Folga adicional acima da tab bar flutuante para o conteúdo respirar.
const TAB_BAR_BREATHING_ROOM = 16;

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
 * Folga inferior do conteúdo:
 * - dentro do tab navigator → altura real da tab bar flutuante + respiro;
 * - fora (login, telas legais) → apenas o safe-area inferior.
 *
 * Evita que os últimos cards fiquem escondidos atrás da tab bar e impede
 * o bug de "não rola até o fim".
 *
 * @returns Padding inferior em pixels.
 */
const useScreenBottomInset = (): number => {
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  // `useContext` (vs `useSafeAreaInsets`) não lança quando não há provider —
  // mantém os testes de tela renderizáveis sem SafeAreaProvider.
  const insets = useContext(SafeAreaInsetsContext);
  if (typeof tabBarHeight === "number" && tabBarHeight > 0) {
    return tabBarHeight + TAB_BAR_BREATHING_ROOM;
  }
  return (insets?.bottom ?? 0) + TAB_BAR_BREATHING_ROOM;
};

/**
 * Canonical screen wrapper for Tamagui-based mobile surfaces.
 *
 * Para telas roláveis o padding fica no `contentContainerStyle` do
 * ScrollView (com `flexGrow: 1`, NUNCA `flex: 1` num filho — isso travava
 * a rolagem) e o padding inferior limpa a tab bar flutuante.
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
  const bottomInset = useScreenBottomInset();

  if (!scrollable) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ContentWrapper animateEntry={animateEntry} reducedMotion={reducedMotion}>
          <YStack
            flex={1}
            backgroundColor="$background"
            paddingHorizontal="$4"
            paddingTop="$4"
            paddingBottom={bottomInset}
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
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ContentWrapper animateEntry={animateEntry} reducedMotion={reducedMotion}>
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          backgroundColor="$background"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: SCREEN_GUTTER,
            paddingTop: SCREEN_GUTTER,
            paddingBottom: bottomInset,
            gap: SCREEN_GUTTER,
          }}
          testID={testID}
        >
          {children}
        </ScrollView>
      </ContentWrapper>
    </SafeAreaView>
  );
}
