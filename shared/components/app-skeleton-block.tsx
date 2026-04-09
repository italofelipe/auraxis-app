import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppHeading } from "@/shared/components/app-heading";
import { AppStack } from "@/shared/components/app-stack";

export interface AppSkeletonBlockProps {
  readonly title?: string;
  readonly description?: string;
  readonly lines?: number;
  readonly testID?: string;
}

const resolveLineWidth = (index: number): string => {
  const widths = ["100%", "84%", "68%", "92%"];
  return widths[index % widths.length];
};

/**
 * Shared skeleton placeholder for async loading states before real content exists.
 *
 * @param props Optional copy plus the number of placeholder rows to render.
 * @returns A themed loading skeleton with accessible progress semantics.
 */
export function AppSkeletonBlock({
  title,
  description,
  lines = 3,
  testID,
}: AppSkeletonBlockProps): ReactElement {
  return (
    <AppStack
      gap="$3"
      paddingVertical="$4"
      paddingHorizontal="$4"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      accessibilityRole="progressbar"
      accessibilityLabel={title ?? "Carregando conteudo"}
      testID={testID}
    >
      {title ? (
        <AppHeading level={3} fontSize="$5">
          {title}
        </AppHeading>
      ) : null}
      {description ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {description}
        </Paragraph>
      ) : null}
      <YStack gap="$2">
        {Array.from({ length: lines }).map((_, index) => (
          <YStack
            key={`skeleton-line-${index}`}
            height="$2"
            width={resolveLineWidth(index)}
            backgroundColor="$surfaceRaised"
            borderRadius="$1"
            opacity={0.7}
          />
        ))}
      </YStack>
    </AppStack>
  );
}
