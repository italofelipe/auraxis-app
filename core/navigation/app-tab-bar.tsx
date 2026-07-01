import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
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

import { privateTabDefinitions } from "@/core/navigation/routes";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppGradient } from "@/shared/components/app-gradient";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import {
  darkSemanticColors,
  lightSemanticColors,
} from "@/shared/theme";

const TAB_BAR_RADIUS = 32;
const TAB_BAR_HEIGHT = 64;
const LIQUID_BLOB_SIZE = 48;
const LIQUID_BLOB_TOP = -10;
const LIQUID_BLOB_SPRING = { damping: 13, stiffness: 150, mass: 1 } as const;
const LIQUID_SQUISH_DURATION_MS = 260;
const LIQUID_ICON_FADE_DURATION_MS = 160;

/** Posição/largura de uma aba, medidas via onLayout, relativas à tab bar. */
type TabLayout = { readonly x: number; readonly width: number };
type TabLayoutMap = Record<string, TabLayout>;

interface LiquidTabIndicator {
  readonly indicatorStyle: StyleProp<ViewStyle>;
  readonly handleTabLayout: (name: string, layout: TabLayout) => void;
}

/**
 * Mede cada aba via onLayout e move a gota líquida para o centro da aba focada.
 * A física fica em valores fixos para manter paridade iOS/Android.
 */
function useLiquidTabIndicator(
  activeRouteName: string | undefined,
  reducedMotion: boolean,
): LiquidTabIndicator {
  const [tabLayouts, setTabLayouts] = useState<TabLayoutMap>({});
  const blobX = useSharedValue(0);
  const blobOpacity = useSharedValue(0);
  const blobScaleX = useSharedValue(1);
  const blobScaleY = useSharedValue(1);

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
    const target = layout.x + (layout.width - LIQUID_BLOB_SIZE) / 2;
    if (reducedMotion) {
      blobX.value = target;
      blobOpacity.value = 1;
      blobScaleX.value = 1;
      blobScaleY.value = 1;
      return;
    }
    blobX.value = withSpring(target, LIQUID_BLOB_SPRING);
    blobOpacity.value = withTiming(1, { duration: LIQUID_ICON_FADE_DURATION_MS });
    blobScaleX.value = withTiming(
      1.32,
      { duration: LIQUID_SQUISH_DURATION_MS / 2 },
      () => {
        blobScaleX.value = withTiming(1, {
          duration: LIQUID_SQUISH_DURATION_MS / 2,
        });
      },
    );
    blobScaleY.value = withTiming(
      0.9,
      { duration: LIQUID_SQUISH_DURATION_MS / 2 },
      () => {
        blobScaleY.value = withTiming(1, {
          duration: LIQUID_SQUISH_DURATION_MS / 2,
        });
      },
    );
  }, [
    activeRouteName,
    tabLayouts,
    reducedMotion,
    blobX,
    blobOpacity,
    blobScaleX,
    blobScaleY,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: blobOpacity.value,
    transform: [
      { translateX: blobX.value },
      { scaleX: blobScaleX.value },
      { scaleY: blobScaleY.value },
    ],
  }));

  return { indicatorStyle: indicatorStyle as StyleProp<ViewStyle>, handleTabLayout };
}

interface TabItemProps {
  readonly tab: (typeof privateTabDefinitions)[number];
  readonly isFocused: boolean;
  readonly activeColor: string;
  readonly inactiveColor: string;
  readonly onPress: () => void;
  readonly onMeasure: (name: string, layout: TabLayout) => void;
}

interface LiquidTabBlobProps {
  readonly iconName: (typeof privateTabDefinitions)[number]["icon"];
  readonly iconColor: string;
  readonly animatedStyle: StyleProp<ViewStyle>;
}

function LiquidTabBlob({
  iconName,
  iconColor,
  animatedStyle,
}: LiquidTabBlobProps): ReactElement {
  return (
    <Animated.View
      testID="tab-liquid-blob"
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: LIQUID_BLOB_TOP,
          left: 0,
          width: LIQUID_BLOB_SIZE,
          height: LIQUID_BLOB_SIZE,
          zIndex: 2,
          shadowColor: "#0B7E8A",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.42,
          shadowRadius: 20,
          elevation: 10,
        },
        animatedStyle,
      ]}
    >
      <AppGradient
        testID="tab-liquid-blob-gradient"
        colors={["#16A8C4", "#0B7E8A"]}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 23,
          borderBottomRightRadius: 26,
          borderBottomLeftRadius: 22,
        }}
      >
        <YStack
          testID="tab-liquid-blob-icon"
          accessibilityLabel={`Ícone ativo ${iconName}`}
        >
          <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
        </YStack>
      </AppGradient>
    </Animated.View>
  );
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
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 54,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          paddingTop: 8,
          paddingBottom: 6,
        },
        pressed ? { opacity: 0.72, transform: [{ scale: 0.94 }] } : null,
      ]}
    >
      {isFocused ? (
        <YStack width={24} height={24} />
      ) : (
        <MaterialCommunityIcons
          testID={`tab-${tab.name}-icon`}
          name={tab.icon}
          size={22}
          color={tint}
        />
      )}
      <Paragraph
        numberOfLines={1}
        fontFamily="$body"
        fontSize={10}
        color={tint}
        fontWeight="$6"
      >
        {tab.title}
      </Paragraph>
    </Pressable>
  );
}

/**
 * Tab bar customizada do handoff "menu liquido": cinco destinos, pill flutuante
 * e gota animada que carrega o icone branco da aba ativa.
 */
export function AppTabBar({ state, navigation }: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const reducedMotion = useAppShellStore((store) => store.reducedMotionEnabled);

  const activeRouteName = state.routes[state.index]?.name;
  const activeTab = useMemo(
    () =>
      privateTabDefinitions.find((tab) => tab.name === activeRouteName) ??
      privateTabDefinitions[0],
    [activeRouteName],
  );
  const { indicatorStyle, handleTabLayout } = useLiquidTabIndicator(
    activeRouteName,
    reducedMotion,
  );

  const navigateToTab = useCallback(
    (routeName: string): void => {
      if (state.routes[state.index]?.name !== routeName) {
        triggerHapticImpact("light");
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
    <YStack
      paddingHorizontal={14}
      paddingBottom={Math.max(insets.bottom, 10)}
      pointerEvents="box-none"
    >
      <XStack
        testID="app-tab-bar"
        backgroundColor="$surfaceCard"
        borderRadius={TAB_BAR_RADIUS}
        borderWidth={1}
        borderColor="$borderColor"
        height={TAB_BAR_HEIGHT}
        paddingHorizontal="$2"
        alignItems="center"
        position="relative"
        overflow="visible"
        style={{
          shadowColor: isDark ? "#000000" : "#0D2840",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: isDark ? 0.3 : 0.16,
          shadowRadius: 34,
          elevation: 10,
        }}
      >
        <LiquidTabBlob
          iconName={activeTab.icon}
          iconColor={palette.primaryForeground}
          animatedStyle={indicatorStyle}
        />
        {privateTabDefinitions.map(renderTab)}
      </XStack>
    </YStack>
  );
}
