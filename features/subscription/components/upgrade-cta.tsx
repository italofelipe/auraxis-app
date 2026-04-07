import type { ReactElement } from "react";

import { Linking } from "react-native";
import { Paragraph, YStack } from "tamagui";

import { PLANS_URL } from "@/shared/config/web-urls";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

/**
 * Canonical premium upsell CTA for paywalled mobile surfaces.
 *
 * @returns Premium upsell card routed to the plans page.
 */
export function UpgradeCta(): ReactElement {
  return (
    <AppSurfaceCard
      title="Recurso Premium"
      description="Assine para liberar essa capacidade no MVP1."
      testID="upgrade-cta">
      <YStack gap="$3">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          O upgrade abre os fluxos premium e mantém a experiencia canônica do app.
        </Paragraph>
        <AppButton
          testID="upgrade-cta-button"
          onPress={() => {
            void Linking.openURL(PLANS_URL);
          }}>
          Ver planos
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
