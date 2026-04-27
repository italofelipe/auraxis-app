import type { ReactElement, ReactNode } from "react";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppSkeletonBlock } from "@/shared/components/app-skeleton-block";
import { AppStack } from "@/shared/components/app-stack";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";
import type {
  QueryEmptyState,
  QueryErrorState,
  QueryLoadingState,
  QueryNoticeState,
} from "@/core/query/query-feedback-state";

export type AppAsyncStateValue =
  | QueryLoadingState
  | QueryEmptyState
  | QueryErrorState
  | QueryNoticeState;

export interface AppAsyncStateProps {
  readonly state: AppAsyncStateValue;
  /**
   * Optional override rendered in place of the default skeleton block
   * when the query is in `loading` state with `presentation: "skeleton"`.
   * Use this to swap in a domain-specific skeleton (transaction list,
   * goal cards, etc.) so the placeholder mimics the real layout.
   */
  readonly loadingComponent?: ReactNode;
  /**
   * Optional override rendered in place of the default empty notice when
   * the query resolves to an empty result. Use this to render an
   * illustrated `<AppEmptyState />` per domain.
   */
  readonly emptyComponent?: ReactNode;
}

/**
 * Renders canonical async feedback blocks for loading, empty, offline, degraded and error.
 *
 * @param props Discriminated async state produced by shared query composition or feature logic.
 * @returns A single canonical feedback surface for the current async state.
 */
export function AppAsyncState({
  state,
  loadingComponent,
  emptyComponent,
}: AppAsyncStateProps): ReactElement {
  if (state.kind === "loading") {
    if (loadingComponent !== undefined) {
      return <>{loadingComponent}</>;
    }
    if (state.presentation === "skeleton") {
      return (
        <AppSkeletonBlock
          title={state.title}
          description={state.description}
          lines={state.skeletonLines}
        />
      );
    }

    return <AsyncStateNotice kind="loading" title={state.title} description={state.description} />;
  }

  if (state.kind === "error") {
    return (
      <AppErrorNotice
        error={state.error}
        fallbackTitle={state.fallbackTitle}
        fallbackDescription={state.fallbackDescription}
        onAction={state.onAction}
      />
    );
  }

  if (state.kind === "empty") {
    if (emptyComponent !== undefined) {
      return <>{emptyComponent}</>;
    }
    return <AsyncStateNotice kind="empty" title={state.title} description={state.description} />;
  }

  return (
    <AppStack gap="$3">
      <AsyncStateNotice kind={state.kind} title={state.title} description={state.description} />
      {state.onAction ? <AppButton onPress={state.onAction}>{state.actionLabel}</AppButton> : null}
    </AppStack>
  );
}
