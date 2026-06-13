import type { ReactElement, ReactNode } from "react";

import { Paragraph, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppHeading } from "@/shared/components/app-heading";
import { AppText } from "@/shared/components/app-text";
import { darkSemanticGlows, lightSemanticGlows } from "@/shared/theme";

const MetricFrame = styled(YStack, {
  backgroundColor: "$surfaceCard",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: "$2",
  padding: "$4",
  gap: "$2",
});

export type MetricTrendDirection = "up" | "down" | "flat";

export interface MetricTrend {
  readonly direction: MetricTrendDirection;
  readonly label: string;
}

export interface AppMetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly helper?: string;
  readonly tone?: "default" | "primary" | "danger";
  /** Variação vs. período anterior — seta + cor (verde/vermelho/neutro). */
  readonly trend?: MetricTrend;
  /** Glow de marca sutil em repouso (cards de destaque do dashboard). */
  readonly glow?: boolean;
  readonly accessory?: ReactNode;
}

const TREND_GLYPH: Record<MetricTrendDirection, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

const trendColor = (
  direction: MetricTrendDirection,
): "$success" | "$danger" | "$muted" => {
  if (direction === "up") {
    return "$success";
  }
  if (direction === "down") {
    return "$danger";
  }
  return "$muted";
};

/**
 * Card de métrica compacto. O valor usa a fonte mono (IBM Plex Mono) — a
 * assinatura visual dos números financeiros do dashboard web.
 *
 * @param props Label, valor, tendência opcional e glow.
 * @returns Card de métrica tematizado.
 */
export function AppMetricCard({
  label,
  value,
  helper,
  tone = "default",
  trend,
  glow = false,
  accessory,
}: AppMetricCardProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const glows =
    resolvedTheme === "auraxis_dark" ? darkSemanticGlows : lightSemanticGlows;
  const valueColor =
    tone === "primary" ? "$secondary" : tone === "danger" ? "$danger" : "$color";

  return (
    <MetricFrame {...(glow ? glows.brandSoft : {})}>
      <YStack gap="$1">
        <AppText size="caption" tone="muted">
          {label}
        </AppText>
        <AppHeading level={2} fontSize="$7" fontFamily="$mono" color={valueColor}>
          {value}
        </AppHeading>
      </YStack>
      {trend ? (
        <Paragraph
          fontFamily="$body"
          fontSize="$2"
          fontWeight="$6"
          color={trendColor(trend.direction)}
        >
          {`${TREND_GLYPH[trend.direction]} ${trend.label}`}
        </Paragraph>
      ) : null}
      {helper ? (
        <AppText size="bodySm" tone="muted">
          {helper}
        </AppText>
      ) : null}
      {accessory}
    </MetricFrame>
  );
}
