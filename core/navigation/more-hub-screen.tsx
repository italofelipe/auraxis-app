import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import Animated from "react-native-reanimated";

import { appRoutes } from "@/core/navigation/routes";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { usePressScaleAnimation } from "@/shared/animations/use-press-scale-animation";
import { AppHeading } from "@/shared/components/app-heading";
import { AppScreen } from "@/shared/components/app-screen";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";
import { useExpenseSheetStore } from "@/stores/expense-sheet-store";

type HubIconName =
  | "wallet-outline"
  | "plus-circle-outline"
  | "tools"
  | "bell-outline"
  | "target"
  | "account-circle-outline"
  | "bank-outline"
  | "tag-multiple-outline"
  | "crown-outline"
  | "shield-account-outline";

interface HubBaseItem {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly icon: HubIconName;
}

interface HubRouteItem extends HubBaseItem {
  readonly href: Href;
  readonly action?: never;
}

interface HubActionItem extends HubBaseItem {
  readonly href?: never;
  readonly action: "quickTransaction";
}

type HubItem = HubRouteItem | HubActionItem;

const HUB_ITEMS: readonly HubItem[] = [
  {
    key: "wallet",
    title: "Carteira",
    description: "Investimentos e patrimônio",
    icon: "wallet-outline",
    href: appRoutes.private.wallet,
  },
  {
    key: "quickTransaction",
    title: "Nova transação",
    description: "Registrar despesa rapidamente",
    icon: "plus-circle-outline",
    action: "quickTransaction",
  },
  {
    key: "planning",
    title: "Planejamento",
    description: "Metas, orçamento e foco",
    icon: "target",
    href: appRoutes.private.planning,
  },
  {
    key: "tools",
    title: "Ferramentas",
    description: "Calculadoras e simuladores",
    icon: "tools",
    href: appRoutes.private.tools,
  },
  {
    key: "alerts",
    title: "Alertas",
    description: "Avisos e vencimentos",
    icon: "bell-outline",
    href: appRoutes.private.alerts,
  },
  {
    key: "accounts",
    title: "Contas",
    description: "Contas bancárias",
    icon: "bank-outline",
    href: appRoutes.private.accounts,
  },
  {
    key: "tags",
    title: "Tags",
    description: "Categorias personalizadas",
    icon: "tag-multiple-outline",
    href: appRoutes.private.tags,
  },
  {
    key: "subscription",
    title: "Assinatura",
    description: "Plano e benefícios",
    icon: "crown-outline",
    href: appRoutes.private.subscription,
  },
  {
    key: "profile",
    title: "Perfil",
    description: "Conta, aparência e privacidade",
    icon: "account-circle-outline",
    href: appRoutes.private.profile,
  },
  {
    key: "privacy",
    title: "Privacidade",
    description: "Dados e permissões",
    icon: "shield-account-outline",
    href: appRoutes.private.privacyCenter,
  },
];

interface HubCardProps {
  readonly item: HubItem;
  readonly accentColor: string;
  readonly onPress: () => void;
}

function HubCard({ item, accentColor, onPress }: HubCardProps): ReactElement {
  const { animatedStyle, onPressIn, onPressOut } = usePressScaleAnimation();

  return (
    <View style={{ flexBasis: "47%", flexGrow: 1 }}>
      <Animated.View style={animatedStyle as StyleProp<ViewStyle>}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        testID={`hub-item-${item.key}`}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <YStack
          backgroundColor="$surfaceCard"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$4"
          gap="$2"
          minHeight={110}
        >
          <MaterialCommunityIcons name={item.icon} size={26} color={accentColor} />
          <Paragraph fontFamily="$body" fontWeight="$6" fontSize="$4" color="$color">
            {item.title}
          </Paragraph>
          <Paragraph fontFamily="$body" fontSize="$2" color="$muted">
            {item.description}
          </Paragraph>
        </YStack>
      </Pressable>
      </Animated.View>
    </View>
  );
}

/**
 * Hub "Mais" (redesign F2): grade elegante com os destinos que saíram da
 * tab bar — nada fica inacessível com a navegação nova.
 */
export function MoreHubScreen(): ReactElement {
  const router = useRouter();
  const resolvedTheme = useResolvedTheme();
  const openExpenseSheet = useExpenseSheetStore((store) => store.open);
  const palette =
    resolvedTheme === "auraxis_dark" ? darkSemanticColors : lightSemanticColors;

  return (
    <AppScreen testID="more-hub-screen">
      <YStack gap="$4">
        <AppHeading level={1} fontSize="$8">
          Mais
        </AppHeading>
        <XStack flexWrap="wrap" gap="$3">
          {HUB_ITEMS.map((item) => (
            <HubCard
              key={item.key}
              item={item}
              accentColor={palette.primary}
              onPress={() => {
                if (item.action === "quickTransaction") {
                  triggerHapticImpact("medium");
                  openExpenseSheet();
                  return;
                }
                router.push(item.href);
              }}
            />
          ))}
        </XStack>
      </YStack>
    </AppScreen>
  );
}
