import { useCallback, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes, privateTabDefinitions } from "@/core/navigation/routes";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppButton } from "@/shared/components/app-button";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { darkSemanticColors, lightSemanticColors, semanticShadows } from "@/shared/theme";

const TAB_BAR_RADIUS = 24;
const CENTER_BUTTON_SIZE = 56;

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

interface TabItemProps {
  readonly tab: (typeof privateTabDefinitions)[number];
  readonly isFocused: boolean;
  readonly activeColor: string;
  readonly inactiveColor: string;
  readonly onPress: () => void;
}

function TabItem({
  tab,
  isFocused,
  activeColor,
  inactiveColor,
  onPress,
}: TabItemProps): ReactElement {
  const tint = isFocused ? activeColor : inactiveColor;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.title}
      accessibilityState={{ selected: isFocused }}
      testID={`tab-${tab.name}`}
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", gap: 2, paddingVertical: 6 }}
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
  readonly onPress: () => void;
}

function CenterActionButton({
  backgroundColor,
  iconColor,
  onPress,
}: CenterActionButtonProps): ReactElement {
  return (
    <YStack width={CENTER_BUTTON_SIZE + 16} alignItems="center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar movimento"
        testID="tab-quick-actions"
        onPress={onPress}
        style={{
          width: CENTER_BUTTON_SIZE,
          height: CENTER_BUTTON_SIZE,
          borderRadius: CENTER_BUTTON_SIZE / 2,
          marginTop: -(CENTER_BUTTON_SIZE / 2),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          shadowColor: backgroundColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 18,
          elevation: 10,
        }}
      >
        <MaterialCommunityIcons name="plus" size={30} color={iconColor} />
      </Pressable>
    </YStack>
  );
}

/**
 * Tab bar customizada do redesign (F2 — épico #540): superfície com
 * cantos superiores arredondados, quatro destinos e botão central [+]
 * elevado para registro rápido de transações.
 */
export function AppTabBar({ state, navigation }: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const resolvedTheme = useResolvedTheme();
  const palette =
    resolvedTheme === "auraxis_dark" ? darkSemanticColors : lightSemanticColors;
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const navigateToTab = useCallback(
    (routeName: string): void => {
      const target = state.routes.find((route) => route.name === routeName);
      if (!target) {
        return;
      }
      const isFocused = state.routes[state.index]?.name === routeName;
      if (!isFocused) {
        navigation.navigate(target.name);
      }
    },
    [navigation, state.index, state.routes],
  );

  const handleOpenQuickActions = useCallback((): void => {
    triggerHapticImpact("medium");
    setQuickActionsVisible(true);
  }, []);

  const handleNavigateToCreate = useCallback((): void => {
    setQuickActionsVisible(false);
    navigation.navigate("transacoes", { intent: "create" });
  }, [navigation]);

  const leftTabs = privateTabDefinitions.slice(0, 2);
  const rightTabs = privateTabDefinitions.slice(2);

  const renderTab = (tab: (typeof privateTabDefinitions)[number]): ReactElement => (
    <TabItem
      key={tab.name}
      tab={tab}
      isFocused={state.routes[state.index]?.name === tab.name}
      activeColor={palette.primary}
      inactiveColor={palette.mutedForeground}
      onPress={() => navigateToTab(tab.name)}
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
        {leftTabs.map(renderTab)}
        <CenterActionButton
          backgroundColor={palette.primary}
          iconColor={palette.primaryForeground}
          onPress={handleOpenQuickActions}
        />
        {rightTabs.map(renderTab)}
      </XStack>
      <QuickActionsSheet
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        onNavigateToCreate={handleNavigateToCreate}
      />
    </>
  );
}

export const quickCreateTransactionHref = {
  pathname: appRoutes.private.transactions,
  params: { intent: "create" },
} as const;
