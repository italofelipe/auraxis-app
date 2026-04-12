import type { ReactElement, ReactNode } from "react";

import { XStack, YStack } from "tamagui";

import { AppHeading } from "@/shared/components/app-heading";
import { AppText } from "@/shared/components/app-text";

export interface AppSectionHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export function AppSectionHeader({
  title,
  description,
  action,
}: AppSectionHeaderProps): ReactElement {
  return (
    <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
      <YStack flex={1} gap="$1">
        <AppHeading level={2} fontSize="$6">
          {title}
        </AppHeading>
        {description ? (
          <AppText size="bodySm" tone="muted">
            {description}
          </AppText>
        ) : null}
      </YStack>
      {action}
    </XStack>
  );
}
