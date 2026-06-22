import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { borderWidths, letterSpacings } from "@/config/design-tokens";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import {
  getInsightSectionDimensionLabel,
  type InsightSectionHighlight,
  type InsightSectionSeverity,
  type InsightSectionVM,
} from "@/shared/insights/insight-section-contracts";
import { resolveSectionSeverityVisual } from "@/shared/insights/insight-section-severity";

export interface InsightSectionProps {
  /**
   * Compact recorte for this feature page, or `null` when the
   * `app.insights.fluida` flag is OFF (the section then renders nothing).
   */
  readonly vm: InsightSectionVM | null;
  /** Opens the full "Fluida" reading focused on this dimension. */
  readonly onReadFull: () => void;
}

/**
 * Compact, reusable "Insights de IA" section shown on each feature page
 * (Transações, Metas, Orçamentos, Cartões, Carteira). Renders the recorte of a
 * single dimension: a kicker + severity chip, a serif headline, a short lead,
 * one or two highlights, and a "ler na íntegra" CTA that opens the full Fluida
 * reading already on that theme.
 *
 * Lives in `shared/insights` so it is consumed across features without a
 * feature-to-feature import; the data (`vm`) and navigation (`onReadFull`) are
 * injected by the host screen. Renders `null` when `vm` is `null`.
 *
 * @param props The compact VM and the "ler na íntegra" handler.
 * @returns The composed section, or `null` when there is no VM.
 */
export function InsightSection({
  vm,
  onReadFull,
}: InsightSectionProps): ReactElement | null {
  if (!vm) {
    return null;
  }

  return (
    <AppSurfaceCard
      title="Insights de IA"
      description={getInsightSectionDimensionLabel(vm.dimension)}
      testID="insight-section"
    >
      <YStack gap="$3">
        <SectionLead
          dimension={vm.dimension}
          severity={vm.severity}
          title={vm.title}
          lead={vm.lead}
        />

        {vm.highlights.length > 0 ? (
          <YStack gap="$2" testID="insight-section-highlights">
            {vm.highlights.map((highlight) => (
              <SectionHighlight
                key={highlight.label}
                highlight={highlight}
              />
            ))}
          </YStack>
        ) : null}

        <AppButton
          tone="secondary"
          size="sm"
          onPress={onReadFull}
          accessibilityLabel="Ler a leitura completa de insights"
          testID="insight-section-read-full"
        >
          Ler na íntegra
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface SectionLeadProps {
  readonly dimension: InsightSectionVM["dimension"];
  readonly severity: InsightSectionSeverity;
  readonly title: string;
  readonly lead: string;
}

function SectionLead({
  dimension,
  severity,
  title,
  lead,
}: SectionLeadProps): ReactElement {
  return (
    <YStack gap="$2" testID="insight-section-lead">
      <XStack alignItems="center" gap="$2" flexWrap="wrap">
        <Paragraph
          color="$primary"
          fontFamily="$body"
          fontSize="$1"
          fontWeight="$7"
          letterSpacing={letterSpacings.caps}
          textTransform="uppercase"
        >
          {getInsightSectionDimensionLabel(dimension)}
        </Paragraph>
        <SectionSevChip severity={severity} />
      </XStack>

      <Paragraph
        color="$color"
        fontFamily="$serif"
        fontSize="$6"
        fontWeight="$6"
        lineHeight="$6"
        testID="insight-section-headline"
      >
        {title}
      </Paragraph>

      <Paragraph
        color="$color"
        fontFamily="$body"
        fontSize="$3"
        lineHeight="$4"
        numberOfLines={3}
      >
        {lead}
      </Paragraph>
    </YStack>
  );
}

function SectionSevChip({
  severity,
}: {
  readonly severity: InsightSectionSeverity;
}): ReactElement {
  const visual = resolveSectionSeverityVisual(severity);

  return (
    <XStack
      alignItems="center"
      gap="$1"
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$5"
      borderWidth={borderWidths.hairline}
      backgroundColor={visual.tintToken}
      borderColor={visual.colorToken}
      alignSelf="flex-start"
      accessibilityRole="text"
      accessibilityLabel={`Severidade: ${visual.label}`}
    >
      <Paragraph
        color={visual.colorToken}
        fontFamily="$body"
        fontSize="$1"
        fontWeight="$7"
      >
        {visual.label}
      </Paragraph>
    </XStack>
  );
}

function SectionHighlight({
  highlight,
}: {
  readonly highlight: InsightSectionHighlight;
}): ReactElement {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$3"
      backgroundColor="$backgroundPress"
    >
      <YStack flexShrink={1} gap="$1">
        <Paragraph color="$color" fontFamily="$body" fontSize="$3" fontWeight="$6">
          {highlight.label}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$1">
          {highlight.sub}
        </Paragraph>
      </YStack>
      <Paragraph
        color="$color"
        fontFamily="$body"
        fontSize="$4"
        fontWeight="$7"
        textAlign="right"
      >
        {highlight.value}
      </Paragraph>
    </XStack>
  );
}
