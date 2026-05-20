import type { ComponentProps, ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack } from "tamagui";

import { ApiError } from "@/core/http/api-error";
import { AiInsightLoadingModal } from "@/features/insights/components/ai-insight-loading-modal";
import { AiInsightTransparencyNotice } from "@/features/insights/components/ai-insight-transparency-notice";
import { InsightCard } from "@/features/insights/components/insight-card";
import type { InsightDimension } from "@/features/insights/contracts";
import { useAiInsightConsent } from "@/features/insights/hooks/use-ai-insight-consent";
import {
  type AiInsightsController,
  useAiInsightsController,
} from "@/features/insights/hooks/use-ai-insights-controller";
import { getInsightDimensionLabel } from "@/features/insights/hooks/use-insights-by-dimension";
import { AI_INSIGHTS_CONTEXTUAL_FEATURE_FLAG_KEY } from "@/features/insights/insights-config";
import { useFeatureAccess } from "@/features/entitlements/hooks/use-feature-access";
import { UpgradeCta } from "@/features/subscription/components/upgrade-cta";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { isFeatureEnabled } from "@/shared/feature-flags";

export interface AiInsightSurfaceProps {
  readonly dimension?: InsightDimension;
  readonly controller?: AiInsightsController;
  readonly onOpenHub?: () => void;
}

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const buttonIconProps = {
  name: "lightbulb-on-outline" as MaterialCommunityIconName,
  size: 18,
  color: "white",
} as const;

const isAiConsentRequiredError = (error: ApiError | null): boolean => {
  return error?.code === "AI_CONSENT_REQUIRED";
};

const resolveErrorTitle = (
  error: ApiError | null,
  quotaTitle: string | null,
): string => {
  if (quotaTitle) {
    return quotaTitle;
  }
  if (isAiConsentRequiredError(error)) {
    return "Autorize o uso de IA para gerar insights";
  }
  return "Nao foi possivel gerar insights";
};

export function AiInsightSurface({
  dimension,
  controller: providedController,
  onOpenHub,
}: AiInsightSurfaceProps): ReactElement | null {
  if (providedController) {
    return (
      <AiInsightSurfaceRoot
        dimension={dimension}
        controller={providedController}
        onOpenHub={onOpenHub}
      />
    );
  }

  return <AiInsightSurfaceWithHook dimension={dimension} onOpenHub={onOpenHub} />;
}

function AiInsightSurfaceWithHook({
  dimension,
  onOpenHub,
}: Pick<AiInsightSurfaceProps, "dimension" | "onOpenHub">): ReactElement | null {
  const controller = useAiInsightsController({ dimension });
  return (
    <AiInsightSurfaceRoot
      dimension={dimension}
      controller={controller}
      onOpenHub={onOpenHub}
    />
  );
}

function AiInsightSurfaceRoot({
  dimension,
  controller,
  onOpenHub,
}: Required<Pick<AiInsightSurfaceProps, "controller">> &
  Pick<AiInsightSurfaceProps, "dimension" | "onOpenHub">): ReactElement | null {
  const featureEnabled = isFeatureEnabled(AI_INSIGHTS_CONTEXTUAL_FEATURE_FLAG_KEY);
  const access = useFeatureAccess("advanced_simulations", featureEnabled);
  const consent = useAiInsightConsent({ enabled: featureEnabled });

  if (!featureEnabled) {
    return null;
  }

  return (
    <AppSurfaceCard
      title="Insights de IA"
      description={dimension ? getInsightDimensionLabel(dimension) : "Analise global"}
    >
      <YStack gap="$3">
        {access.isLoading ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Conferindo acesso Premium
          </Paragraph>
        ) : access.hasAccess ? (
          <InsightSurfaceContent
            controller={controller}
            consent={consent}
            onOpenHub={onOpenHub}
          />
        ) : (
          <UpgradeCta />
        )}
      </YStack>
    </AppSurfaceCard>
  );
}

interface InsightSurfaceContentProps {
  readonly controller: AiInsightsController;
  readonly consent: ReturnType<typeof useAiInsightConsent>;
  readonly onOpenHub?: () => void;
}

function InsightSurfaceContent({
  controller,
  consent,
  onOpenHub,
}: InsightSurfaceContentProps): ReactElement {
  const canGenerate = consent.isHydrated && consent.hasConsent && !controller.isGenerating;

  return (
    <YStack gap="$3">
      <AiInsightTransparencyNotice
        hasConsent={consent.hasConsent}
        isHydrated={consent.isHydrated}
        onGrantConsent={consent.grantConsent}
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton
          flex={1}
          disabled={!canGenerate}
          onPress={() => {
            void controller.generate({ periodType: "daily" });
          }}
        >
          <XStack alignItems="center" justifyContent="center" gap="$2">
            <MaterialCommunityIcons {...buttonIconProps} />
            <Paragraph color="$actionPrimaryForeground" fontFamily="$body" fontWeight="$6">
              Gerar insights
            </Paragraph>
          </XStack>
        </AppButton>
        {onOpenHub ? (
          <AppButton tone="secondary" onPress={onOpenHub}>
            Ver hub
          </AppButton>
        ) : null}
      </XStack>
      {controller.callsRemaining !== null ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {controller.callsRemaining} de 2 insights restantes hoje
        </Paragraph>
      ) : null}
      <InsightSurfaceFeedback controller={controller} />
      <AiInsightLoadingModal visible={controller.isGenerating} />
    </YStack>
  );
}

function InsightSurfaceFeedback({
  controller,
}: {
  readonly controller: AiInsightsController;
}): ReactElement | null {
  if (controller.generateError) {
    return (
      <AppErrorNotice
        error={controller.generateError}
        fallbackTitle={resolveErrorTitle(
          controller.generateError,
          controller.generateErrorTitle,
        )}
        fallbackDescription="Tente novamente mais tarde ou abra o hub para ver o historico."
        actionLabel="Dispensar"
        onAction={controller.dismissGenerateError}
      />
    );
  }

  if (controller.visibleItems.length > 0) {
    return (
      <YStack gap="$2">
        {controller.visibleItems.map((item) => (
          <InsightCard key={`${item.dimension}-${item.type}-${item.title}`} item={item} />
        ))}
      </YStack>
    );
  }

  if (controller.shouldShowContextualEmptyState) {
    return (
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        Nenhum insight especifico para esta area no periodo atual. A visao completa
        continua disponivel em Insights.
      </Paragraph>
    );
  }

  return (
    <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
      Gere uma leitura com IA para cruzar seus dados financeiros mais recentes.
    </Paragraph>
  );
}
