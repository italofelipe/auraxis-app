import type { ReactElement } from "react";

import { Paragraph, Spinner } from "tamagui";

import { AppHeading } from "@/shared/components/app-heading";
import { AppStack } from "@/shared/components/app-stack";

export interface AsyncStateNoticeProps {
  readonly kind: "loading" | "error" | "empty"
  readonly title: string
  readonly description?: string
}

/**
 * Shared async feedback block for loading, empty and error states.
 *
 * @param props State copy and semantic kind.
 * @returns A centered feedback section.
 */
export function AsyncStateNotice({
  kind,
  title,
  description,
}: AsyncStateNoticeProps): ReactElement {
  return (
    <AppStack
      alignItems="center"
      justifyContent="center"
      gap="$2"
      paddingVertical="$6"
      paddingHorizontal="$4"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2">
      {kind === "loading" ? <Spinner color="$secondary" size="large" /> : null}
      <AppHeading
        level={3}
        color={kind === "error" ? "$danger" : "$color"}
        fontSize="$5">
        {title}
      </AppHeading>
      {description ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3" textAlign="center">
          {description}
        </Paragraph>
      ) : null}
    </AppStack>
  );
}
