import type { ReactElement } from "react";

import { ActivityIndicator } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";

export interface AiInsightTransparencyNoticeProps {
  readonly hasConsent: boolean;
  readonly isHydrated: boolean;
  readonly onGrantConsent: () => void | Promise<void>;
}

const TRANSPARENCY_TEXT =
  "Seus dados financeiros nao sao usados para treinar modelos. A IA usa apenas os registros do Auraxis para preparar esta leitura.";
const LIMITS_TEXT =
  "Este conteudo informativo e nao substitui aconselhamento financeiro individualizado.";

export function AiInsightTransparencyNotice({
  hasConsent,
  isHydrated,
  onGrantConsent,
}: AiInsightTransparencyNoticeProps): ReactElement {
  if (!isHydrated) {
    return (
      <XStack alignItems="center" gap="$2" testID="ai-insight-consent-loading">
        <ActivityIndicator size="small" />
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Conferindo preferencia de IA
        </Paragraph>
      </XStack>
    );
  }

  if (hasConsent) {
    return (
      <YStack gap="$2" testID="ai-insight-transparency-granted">
        <AppBadge tone="primary">IA informativa</AppBadge>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {TRANSPARENCY_TEXT}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {LIMITS_TEXT}
        </Paragraph>
      </YStack>
    );
  }

  return (
    <YStack gap="$3" testID="ai-insight-consent-gate">
      <YStack gap="$1">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
          Como usamos IA nos seus insights
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {TRANSPARENCY_TEXT}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {LIMITS_TEXT}
        </Paragraph>
      </YStack>
      <AppButton
        tone="secondary"
        onPress={() => {
          void onGrantConsent();
        }}
      >
        Permitir insights informativos
      </AppButton>
    </YStack>
  );
}
