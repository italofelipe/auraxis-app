import type { ReactElement, ReactNode } from "react";

import {
  type QueryFeedbackStateInput,
  type QueryFeedbackStateOptions,
  useQueryFeedbackState,
} from "@/core/query/query-feedback-state";
import { AppAsyncState } from "@/shared/components/app-async-state";
import { AppStack } from "@/shared/components/app-stack";

export interface AppQueryStateProps<TData, TError = unknown> {
  readonly query: QueryFeedbackStateInput<TData, TError>;
  readonly options: QueryFeedbackStateOptions<TData>;
  readonly children: (data: TData) => ReactNode;
  /**
   * Optional override for the loading state. Pass a domain-specific
   * skeleton (e.g. `<TransactionListSkeleton />`) so the placeholder
   * mimics the final layout instead of using the generic block.
   */
  readonly loadingComponent?: ReactNode;
  /**
   * Optional override for the empty state. Pass an illustrated
   * `<AppEmptyState />` for richer empty UX.
   */
  readonly emptyComponent?: ReactNode;
}

/**
 * Composes canonical query UI states so feature screens only describe view structure.
 *
 * @param props Query object, state copy, optional overrides and content renderer.
 * @returns Either the shared async feedback or the rendered content tree.
 */
export function AppQueryState<TData, TError = unknown>({
  query,
  options,
  children,
  loadingComponent,
  emptyComponent,
}: AppQueryStateProps<TData, TError>): ReactElement {
  const state = useQueryFeedbackState(query, options);

  if (state.kind !== "content") {
    return (
      <AppAsyncState
        state={state}
        loadingComponent={loadingComponent}
        emptyComponent={emptyComponent}
      />
    );
  }

  if (state.notice) {
    return (
      <AppStack gap="$3">
        <AppAsyncState state={state.notice} />
        {children(state.data)}
      </AppStack>
    );
  }

  return <>{children(state.data)}</>;
}
