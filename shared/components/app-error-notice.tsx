import type { ReactElement } from "react";

import { Paragraph } from "tamagui";

import { createAppErrorState } from "@/core/errors/app-error";
import { AppButton } from "@/shared/components/app-button";
import { AppStack } from "@/shared/components/app-stack";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

export interface AppErrorNoticeProps {
  readonly error: unknown;
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly secondaryActionLabel?: string;
  readonly onSecondaryAction?: () => void;
  readonly showTechnicalDetails?: boolean;
  readonly testID?: string;
}

const TECHNICAL_DETAILS_STACK_LINES = 4;

const formatTechnicalDetails = (error: unknown): string => {
  if (error instanceof Error) {
    const stackHead = (error.stack ?? "")
      .split("\n")
      .slice(1, 1 + TECHNICAL_DETAILS_STACK_LINES)
      .map((line) => line.trim())
      .join("\n");
    return stackHead.length > 0
      ? `${error.name}: ${error.message}\n${stackHead}`
      : `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

/**
 * Canonical error feedback block for query, mutation and boundary failures.
 *
 * @param props Raw error plus optional recovery actions. `showTechnicalDetails`
 *              appends the original exception message and stack head — used by
 *              top-level boundaries during the alpha so device-only failures
 *              are diagnosable without remote crash reporting.
 * @returns Shared error notice with taxonomy-driven copy and recoverability CTA.
 */
export function AppErrorNotice({
  error,
  fallbackTitle,
  fallbackDescription,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showTechnicalDetails = false,
  testID,
}: AppErrorNoticeProps): ReactElement {
  const errorState = createAppErrorState(error, {
    fallbackTitle,
    fallbackDescription,
  });
  const resolvedActionLabel = actionLabel ?? errorState.actionLabel;

  return (
    <AppStack gap="$3" testID={testID}>
      <AsyncStateNotice
        kind="error"
        title={errorState.title}
        description={errorState.description}
      />
      {showTechnicalDetails ? (
        <AppStack gap="$1">
          <Paragraph size="$2" fontWeight="600" color="$muted">
            Detalhes tecnicos
          </Paragraph>
          <Paragraph
            size="$1"
            color="$muted"
            testID={testID ? `${testID}-technical-details` : undefined}>
            {formatTechnicalDetails(error)}
          </Paragraph>
        </AppStack>
      ) : null}
      {resolvedActionLabel && onAction ? (
        <AppButton onPress={onAction}>{resolvedActionLabel}</AppButton>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <AppButton tone="secondary" onPress={onSecondaryAction}>
          {secondaryActionLabel}
        </AppButton>
      ) : null}
    </AppStack>
  );
}
