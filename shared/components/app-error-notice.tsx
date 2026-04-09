import type { ReactElement } from "react";

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
  readonly testID?: string;
}

/**
 * Canonical error feedback block for query, mutation and boundary failures.
 *
 * @param props Raw error plus optional recovery actions.
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

