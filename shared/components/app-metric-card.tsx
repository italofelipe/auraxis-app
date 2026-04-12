import type { ReactElement, ReactNode } from "react";

import { YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { AppHeading } from "@/shared/components/app-heading";
import { AppText } from "@/shared/components/app-text";

const MetricFrame = styled(YStack, {
  backgroundColor: "$surfaceCard",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: "$2",
  padding: "$4",
  gap: "$2",
});

export interface AppMetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly helper?: string;
  readonly tone?: "default" | "primary" | "danger";
  readonly accessory?: ReactNode;
}

export function AppMetricCard({
  label,
  value,
  helper,
  tone = "default",
  accessory,
}: AppMetricCardProps): ReactElement {
  const valueColor =
    tone === "primary" ? "$secondary" : tone === "danger" ? "$danger" : "$color";

  return (
    <MetricFrame>
      <YStack gap="$1">
        <AppText size="caption" tone="muted">
          {label}
        </AppText>
        <AppHeading level={2} fontSize="$7" color={valueColor}>
          {value}
        </AppHeading>
      </YStack>
      {helper ? (
        <AppText size="bodySm" tone="muted">
          {helper}
        </AppText>
      ) : null}
      {accessory}
    </MetricFrame>
  );
}
