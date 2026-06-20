import { type ReactElement, useContext } from "react";

import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppText } from "@/shared/components/app-text";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { iconSizes, onDarkSurfaceColors } from "@/shared/theme";

/** Folga acima do safe-area/tab bar para o CTA respirar. */
const FOOTER_BREATHING_ROOM = 12;

/** Props do CTA fixo (rodapé) das telas de detalhe. */
export interface CardStickyCtaProps {
  /** Rótulo do botão. */
  readonly label: string;
  /** Ícone opcional à esquerda do rótulo. */
  readonly icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Handler de toque. */
  readonly onPress: () => void;
  readonly testID?: string;
}

/**
 * Calcula a folga inferior do rodapé fixo: altura da tab bar flutuante quando
 * dentro do navegador de abas, senão o safe-area inferior — ambos com respiro.
 *
 * @returns Padding inferior em pixels.
 */
const useFooterBottomInset = (): number => {
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const insets = useContext(SafeAreaInsetsContext);
  if (typeof tabBarHeight === "number" && tabBarHeight > 0) {
    return tabBarHeight + FOOTER_BREATHING_ROOM;
  }
  return (insets?.bottom ?? 0) + FOOTER_BREATHING_ROOM;
};

/**
 * CTA fixo no rodapé das telas de detalhe (cartão/fatura): um botão primário
 * full-width sobre uma faixa com fundo da página, respeitando safe-area e a tab
 * bar flutuante. Apresentacional.
 *
 * @param props Rótulo, ícone opcional e handler.
 * @returns Rodapé fixo com o CTA.
 */
export function CardStickyCta({
  label,
  icon,
  onPress,
  testID,
}: CardStickyCtaProps): ReactElement {
  const bottomInset = useFooterBottomInset();

  return (
    <YStack
      backgroundColor="$background"
      paddingHorizontal="$5"
      paddingTop="$3"
      paddingBottom={bottomInset}
      borderTopWidth={1}
      borderColor="$borderColor"
      testID={testID ?? "card-sticky-cta"}
    >
      <AppButton
        fullWidth
        glow
        size="lg"
        onPress={onPress}
        accessibilityLabel={label}
      >
        <XStack alignItems="center" justifyContent="center" gap="$2">
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={iconSizes.md}
              color={onDarkSurfaceColors.text}
            />
          ) : null}
          <AppText
            size="bodyLg"
            fontWeight="$6"
            color={onDarkSurfaceColors.text}
          >
            {label}
          </AppText>
        </XStack>
      </AppButton>
    </YStack>
  );
}
