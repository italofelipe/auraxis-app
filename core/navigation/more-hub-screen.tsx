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
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

type HubIconName =
  | "wallet-outline"
  | "tools"
  | "bell-outline"
  | "lightbulb-on-outline"
  | "account-circle-outline"
  | "credit-card-outline"
  | "bank-outline"
  | "tag-multiple-outline"
  | "crown-outline"
  | "shield-account-outline";

interface HubItem {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly icon: HubIconName;
  readonly href: Href;
}

const HUB_ITEMS: readonly HubItem[] = [
  {
    key: "wallet",
    title: "Carteira",
    description: "Investimentos e patrimônio",
    icon: "wallet-outline",
    href: appRoutes.private.wallet,
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
    key: "insights",
    title: "Insights",
    description: "Leituras com IA",
    icon: "lightbulb-on-outline",
    href: appRoutes.private.insights,
  },
  {
    key: "accounts",
    title: "Contas",
    description: "Contas bancárias",
    icon: "bank-outline",
    href: appRoutes.private.accounts,
  },
  {
    key: "creditCards",
    title: "Cartões",
    description: "Faturas e ciclos",
    icon: "credit-card-outline",
    href: appRoutes.private.creditCards,
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
              onPress={() => router.push(item.href)}
            />
          ))}
        </XStack>
      </YStack>
    </AppScreen>
  );
}
