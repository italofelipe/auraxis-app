import { useCallback, useEffect, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Modal,
  Pressable,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes, privateTabDefinitions } from "@/core/navigation/routes";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import {
  useTourAnchor,
  type MeasurableHandle,
} from "@/shared/coach-marks/tour-anchor-context";
import { AppButton } from "@/shared/components/app-button";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { useExpenseSheetStore } from "@/stores/expense-sheet-store";
import {
  darkSemanticColors,
  darkSemanticGlows,
  lightSemanticColors,
  lightSemanticGlows,
  semanticShadows,
} from "@/shared/theme";
import { motionDurations } from "@/shared/theme/motion";

const TAB_BAR_RADIUS = 24;
const CENTER_BUTTON_SIZE = 56;
const INDICATOR_WIDTH = 28;
const INDICATOR_HEIGHT = 3;
// Spring suave (sem overshoot exagerado): o sublinhado desliza entre abas
// com um "settle" premium, não um bounce de brinquedo.
const INDICATOR_SPRING = { damping: 20, stiffness: 210, mass: 0.6 } as const;

/** Posição/largura de uma aba, medidas via onLayout, relativas à tab bar. */
type TabLayout = { readonly x: number; readonly width: number };
type TabLayoutMap = Record<string, TabLayout>;

interface ActiveTabIndicator {
  readonly indicatorStyle: StyleProp<ViewStyle>;
  readonly handleTabLayout: (name: string, layout: TabLayout) => void;
}

/**
 * Anima o sublinhado da aba ativa: mede cada aba via onLayout e desliza o
 * indicador (translateX) para a aba focada com spring. Respeita
 * `reducedMotionEnabled` (posiciona sem animar).
 */
function useActiveTabIndicator(
  activeRouteName: string | undefined,
  reducedMotion: boolean,
): ActiveTabIndicator {
  const [tabLayouts, setTabLayouts] = useState<TabLayoutMap>({});
  const indicatorX = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  const handleTabLayout = useCallback((name: string, layout: TabLayout): void => {
    setTabLayouts((previous) => {
      const current = previous[name];
      if (current && current.x === layout.x && current.width === layout.width) {
        return previous;
      }
      return { ...previous, [name]: layout };
    });
  }, []);

  useEffect(() => {
    const layout = activeRouteName ? tabLayouts[activeRouteName] : undefined;
    if (!layout) {
      return;
    }
    const target = layout.x + (layout.width - INDICATOR_WIDTH) / 2;
    if (reducedMotion) {
      indicatorX.value = target;
      indicatorOpacity.value = 1;
      return;
    }
    indicatorX.value = withSpring(target, INDICATOR_SPRING);
    indicatorOpacity.value = withTiming(1, { duration: motionDurations.normal });
  }, [activeRouteName, tabLayouts, reducedMotion, indicatorX, indicatorOpacity]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return { indicatorStyle: indicatorStyle as StyleProp<ViewStyle>, handleTabLayout };
}

interface QuickCreateActions {
  readonly visible: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly navigateToCreate: () => void;
}

/** Estado + handlers do sheet de ação rápida do botão central [+]. */
function useQuickCreateActions(
  navigation: BottomTabBarProps["navigation"],
): QuickCreateActions {
  const [visible, setVisible] = useState(false);

  const open = useCallback((): void => {
    triggerHapticImpact("medium");
    setVisible(true);
  }, []);

  const close = useCallback((): void => {
    setVisible(false);
  }, []);

  const navigateToCreate = useCallback((): void => {
    setVisible(false);
    navigation.navigate("transacoes", { intent: "create" });
  }, [navigation]);

  return { visible, open, close, navigateToCreate };
}

interface QuickActionsSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onNavigateToCreate: () => void;
}

/**
 * Sheet de ação rápida do botão central [+]: atalhos para registrar
 * receita/despesa — paridade com os CTAs "Nova Receita"/"Nova Despesa"
 * do dashboard web.
 */
function QuickActionsSheet({
  visible,
  onClose,
  onNavigateToCreate,
}: QuickActionsSheetProps): ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1 }}
        accessibilityLabel="Fechar ações rápidas"
        onPress={onClose}
      >
        <YStack flex={1} backgroundColor="rgba(10,22,40,0.45)" justifyContent="flex-end">
          <Pressable>
            <YStack
              backgroundColor="$surfaceCard"
              padding="$5"
              paddingBottom="$7"
              gap="$3"
              borderTopLeftRadius={TAB_BAR_RADIUS}
              borderTopRightRadius={TAB_BAR_RADIUS}
            >
              <Paragraph fontFamily="$body" fontWeight="$6" fontSize="$5" color="$color">
                Registrar movimento
              </Paragraph>
              <AppButton testID="quick-action-create" onPress={onNavigateToCreate}>
                Nova transação
              </AppButton>
              <AppButton tone="secondary" onPress={onClose}>
                Cancelar
              </AppButton>
            </YStack>
          </Pressable>
        </YStack>
      </Pressable>
    </Modal>
  );
}

interface TabActiveIndicatorProps {
  readonly color: string;
  readonly animatedStyle: StyleProp<ViewStyle>;
}

/** O sublinhado animado que desliza sob a aba ativa. */
function TabActiveIndicator({
  color,
  animatedStyle,
}: TabActiveIndicatorProps): ReactElement {
  return (
    <Animated.View
      testID="tab-active-indicator"
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: INDICATOR_WIDTH,
          height: INDICATOR_HEIGHT,
          borderRadius: INDICATOR_HEIGHT,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface TabItemProps {
  readonly tab: (typeof privateTabDefinitions)[number];
  readonly isFocused: boolean;
  readonly activeColor: string;
  readonly inactiveColor: string;
  readonly onPress: () => void;
  readonly onMeasure: (name: string, layout: TabLayout) => void;
}

function TabItem({
  tab,
  isFocused,
  activeColor,
  inactiveColor,
  onPress,
  onMeasure,
}: TabItemProps): ReactElement {
  const tint = isFocused ? activeColor : inactiveColor;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.title}
      accessibilityState={{ selected: isFocused }}
      testID={`tab-${tab.name}`}
      onPress={onPress}
      onLayout={(event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        onMeasure(tab.name, { x, width });
      }}
      // Press-scale aplicado direto no Pressable (transform é pós-layout, não
      // afeta o flex:1) — evita o wrapper Animated.View que quebra a divisão
      // de linha de itens flex lado a lado.
      style={({ pressed }) => [
        { flex: 1, alignItems: "center", gap: 2, paddingVertical: 6 },
        pressed ? { opacity: 0.7, transform: [{ scale: 0.92 }] } : null,
      ]}
    >
      <MaterialCommunityIcons name={tab.icon} size={24} color={tint} />
      <Paragraph
        numberOfLines={1}
        fontFamily="$body"
        fontSize="$1"
        color={tint}
        fontWeight={isFocused ? "$6" : "$4"}
      >
        {tab.title}
      </Paragraph>
    </Pressable>
  );
}

interface CenterActionButtonProps {
  readonly backgroundColor: string;
  readonly iconColor: string;
  readonly glow: ViewStyle;
  readonly onPress: () => void;
  readonly onLongPress: () => void;
  /** Ref de âncora do tour (registra o FAB como alvo do spotlight). */
  readonly anchorRef: (node: MeasurableHandle | null) => void;
  /** onLayout de âncora do tour (gatilho de registro barato). */
  readonly anchorOnLayout: (event: LayoutChangeEvent) => void;
}

function CenterActionButton({
  backgroundColor,
  iconColor,
  glow,
  onPress,
  onLongPress,
  anchorRef,
  anchorOnLayout,
}: CenterActionButtonProps): ReactElement {
  return (
    <YStack width={CENTER_BUTTON_SIZE + 16} alignItems="center">
      <Pressable
        ref={anchorRef}
        accessibilityRole="button"
        accessibilityLabel="Lançar despesa"
        accessibilityHint="Toque para lançar uma despesa. Pressione e segure para mais ações."
        testID="tour-fab"
        onPress={onPress}
        onLongPress={onLongPress}
        onLayout={anchorOnLayout}
        style={({ pressed }) => ({
          width: CENTER_BUTTON_SIZE,
          height: CENTER_BUTTON_SIZE,
          borderRadius: CENTER_BUTTON_SIZE / 2,
          marginTop: -(CENTER_BUTTON_SIZE / 2),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          // Glow de marca (shadowColor colorido) resolvido por tema — 100%
          // OTA-able, sem gradiente/blur nativo.
          ...glow,
          transform: pressed ? [{ scale: 0.94 }] : undefined,
        })}
      >
        <MaterialCommunityIcons name="plus" size={30} color={iconColor} />
      </Pressable>
    </YStack>
  );
}

/**
 * Tab bar customizada do redesign (F2 — épico #540, refinamento premium #570):
 * superfície com cantos superiores arredondados, quatro destinos e botão
 * central [+] elevado. A aba ativa ganha um indicador (sublinhado) que desliza
 * entre as abas com spring, respeitando `reducedMotionEnabled`.
 */
export function AppTabBar({ state, navigation }: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const glows = isDark ? darkSemanticGlows : lightSemanticGlows;
  const reducedMotion = useAppShellStore((store) => store.reducedMotionEnabled);

  const activeRouteName = state.routes[state.index]?.name;
  const { indicatorStyle, handleTabLayout } = useActiveTabIndicator(
    activeRouteName,
    reducedMotion,
  );
  const quickActions = useQuickCreateActions(navigation);
  const openExpenseSheet = useExpenseSheetStore((store) => store.open);
  const fabAnchor = useTourAnchor("fab");

  const handleFabPress = useCallback((): void => {
    triggerHapticImpact("medium");
    openExpenseSheet();
  }, [openExpenseSheet]);

  const navigateToTab = useCallback(
    (routeName: string): void => {
      if (state.routes[state.index]?.name !== routeName) {
        navigation.navigate(routeName);
      }
    },
    [navigation, state.index, state.routes],
  );

  const renderTab = (tab: (typeof privateTabDefinitions)[number]): ReactElement => (
    <TabItem
      key={tab.name}
      tab={tab}
      isFocused={state.routes[state.index]?.name === tab.name}
      activeColor={palette.primary}
      inactiveColor={palette.mutedForeground}
      onPress={() => navigateToTab(tab.name)}
      onMeasure={handleTabLayout}
    />
  );

  return (
    <>
      <XStack
        testID="app-tab-bar"
        backgroundColor="$surfaceCard"
        borderTopLeftRadius={TAB_BAR_RADIUS}
        borderTopRightRadius={TAB_BAR_RADIUS}
        borderTopWidth={1}
        borderTopColor="$borderColor"
        paddingTop="$2"
        paddingHorizontal="$3"
        paddingBottom={Math.max(insets.bottom, 10)}
        alignItems="center"
        {...semanticShadows.lg}
      >
        <TabActiveIndicator color={palette.primary} animatedStyle={indicatorStyle} />
        {privateTabDefinitions.slice(0, 2).map(renderTab)}
        <CenterActionButton
          backgroundColor={palette.primary}
          iconColor={palette.primaryForeground}
          glow={glows.brand}
          onPress={handleFabPress}
          onLongPress={quickActions.open}
          anchorRef={fabAnchor.ref}
          anchorOnLayout={fabAnchor.onLayout}
        />
        {privateTabDefinitions.slice(2).map(renderTab)}
      </XStack>
      <QuickActionsSheet
        visible={quickActions.visible}
        onClose={quickActions.close}
        onNavigateToCreate={quickActions.navigateToCreate}
      />
    </>
  );
}

export const quickCreateTransactionHref = {
  pathname: appRoutes.private.transactions,
  params: { intent: "create" },
} as const;
