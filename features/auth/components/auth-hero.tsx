import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack } from "tamagui";

import { AppHeading } from "@/shared/components/app-heading";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

export interface AuthHeroProps {
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
}

/**
 * Cabeçalho das telas de autenticação — paridade com o hero do web
 * ("ACESSO SEGURO E PROTEGIDO" + headline + subtítulo). Dá presença de
 * marca antes do card do formulário.
 */
export function AuthHero({ badge, title, subtitle }: AuthHeroProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const palette =
    resolvedTheme === "auraxis_dark" ? darkSemanticColors : lightSemanticColors;

  return (
    <YStack gap="$3" paddingTop="$2">
      <XStack alignItems="center" gap="$2">
        <YStack
          width={36}
          height={36}
          borderRadius="$3"
          alignItems="center"
          justifyContent="center"
          backgroundColor="$primary"
        >
          <Paragraph
            fontFamily="$heading"
            fontWeight="$7"
            fontSize="$6"
            color="$actionPrimaryForeground"
          >
            A
          </Paragraph>
        </YStack>
        <AppHeading level={3} fontSize="$6">
          Auraxis
        </AppHeading>
      </XStack>

      <XStack
        alignSelf="flex-start"
        alignItems="center"
        gap="$1"
        paddingHorizontal="$3"
        paddingVertical="$1"
        borderRadius="$5"
        backgroundColor="$primarySubtle"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <MaterialCommunityIcons
          name="shield-check"
          size={13}
          color={palette.primary}
        />
        <Paragraph
          fontFamily="$body"
          fontWeight="$6"
          fontSize="$1"
          letterSpacing={0.6}
          color="$primary"
        >
          {badge}
        </Paragraph>
      </XStack>

      <AppHeading level={1} fontSize="$9" lineHeight={40}>
        {title}
      </AppHeading>
      <Paragraph fontFamily="$body" fontSize="$4" color="$muted" lineHeight={24}>
        {subtitle}
      </Paragraph>
    </YStack>
  );
}

/**
 * Divisor "ou" para separar o CTA primário das ações secundárias.
 */
export function AuthDivider({ label = "ou" }: { readonly label?: string }): ReactElement {
  return (
    <XStack alignItems="center" gap="$3">
      <YStack flex={1} height={1} backgroundColor="$borderColor" />
      <Paragraph fontFamily="$body" fontSize="$2" color="$muted">
        {label}
      </Paragraph>
      <YStack flex={1} height={1} backgroundColor="$borderColor" />
    </XStack>
  );
}
