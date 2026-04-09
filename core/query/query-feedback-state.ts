import { createAppErrorState, type CreateAppErrorStateOptions } from "@/core/errors/app-error";
import {
  type RuntimeConnectivityStatus,
  type RuntimeDegradedReason,
  useAppShellStore,
} from "@/core/shell/app-shell-store";

export interface QueryFeedbackCopy {
  readonly title: string;
  readonly description?: string;
}

export interface QueryFeedbackStateInput<TData, TError = unknown> {
  readonly data: TData | undefined;
  readonly error: TError | null;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly isFetching: boolean;
  readonly refetch?: () => Promise<unknown>;
}

export interface QueryFeedbackStateOptions<TData> {
  readonly loading: QueryFeedbackCopy;
  readonly empty: QueryFeedbackCopy;
  readonly error?: Pick<CreateAppErrorStateOptions, "fallbackTitle" | "fallbackDescription">;
  readonly offline?: QueryFeedbackCopy;
  readonly degraded?: QueryFeedbackCopy;
  readonly isEmpty?: (data: TData) => boolean;
  readonly loadingPresentation?: "notice" | "skeleton";
  readonly skeletonLines?: number;
}

export interface QueryNoticeState {
  readonly kind: "offline" | "degraded";
  readonly title: string;
  readonly description?: string;
  readonly actionLabel: string;
  readonly onAction?: () => void;
}

export interface QueryLoadingState {
  readonly kind: "loading";
  readonly title: string;
  readonly description?: string;
  readonly presentation: "notice" | "skeleton";
  readonly skeletonLines: number;
}

export interface QueryEmptyState {
  readonly kind: "empty";
  readonly title: string;
  readonly description?: string;
}

export interface QueryErrorState {
  readonly kind: "error";
  readonly error: unknown;
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly onAction?: () => void;
}

export interface QueryContentState<TData> {
  readonly kind: "content";
  readonly data: TData;
  readonly notice: QueryNoticeState | null;
  readonly isRefreshing: boolean;
}

export type QueryFeedbackState<TData> =
  | QueryLoadingState
  | QueryEmptyState
  | QueryErrorState
  | QueryNoticeState
  | QueryContentState<TData>;

export interface CreateQueryFeedbackStateParams<TData, TError = unknown> {
  readonly query: QueryFeedbackStateInput<TData, TError>;
  readonly options: QueryFeedbackStateOptions<TData>;
  readonly connectivityStatus: RuntimeConnectivityStatus;
  readonly degradedReason: RuntimeDegradedReason;
  readonly onRetry?: () => void;
}

const DEFAULT_OFFLINE_COPY: QueryFeedbackCopy = {
  title: "Sem conexao para carregar agora",
  description: "Verifique sua internet e tente novamente quando a conexao voltar.",
};

const DEFAULT_DEGRADED_COPY: QueryFeedbackCopy = {
  title: "Servico instavel no momento",
  description: "A plataforma respondeu de forma parcial. Tente novamente em instantes.",
};

const DEFAULT_SKELETON_LINES = 3;
const RETRY_LABEL = "Tentar novamente";

const hasMeaningfulData = <TData>(
  data: TData | undefined,
  isEmpty?: (value: TData) => boolean,
): data is TData => {
  if (data === undefined || data === null) {
    return false;
  }

  return isEmpty ? !isEmpty(data) : true;
};

const createNoticeState = (
  kind: QueryNoticeState["kind"],
  copy: QueryFeedbackCopy,
  onRetry?: () => void,
): QueryNoticeState => {
  return {
    kind,
    title: copy.title,
    description: copy.description,
    actionLabel: RETRY_LABEL,
    onAction: onRetry,
  };
};

const resolveContentNotice = <TData, TError>(
  params: CreateQueryFeedbackStateParams<TData, TError>,
): QueryNoticeState | null => {
  const { connectivityStatus, onRetry, options, query } = params;
  const degradedCopy = options.degraded ?? DEFAULT_DEGRADED_COPY;
  const offlineCopy = options.offline ?? DEFAULT_OFFLINE_COPY;

  if (query.isError) {
    const errorState = createAppErrorState(query.error, {
      fallbackTitle: options.error?.fallbackTitle,
      fallbackDescription: options.error?.fallbackDescription,
      connectivityStatus,
    });

    if (errorState.category === "network") {
      return createNoticeState("offline", offlineCopy, onRetry);
    }

    if (errorState.category === "degraded") {
      return createNoticeState("degraded", degradedCopy, onRetry);
    }
  }

  if (connectivityStatus === "offline") {
    return createNoticeState("offline", offlineCopy, onRetry);
  }

  if (connectivityStatus === "degraded") {
    return createNoticeState("degraded", degradedCopy, onRetry);
  }

  return null;
};

/**
 * Resolves the canonical render state for remote query data.
 *
 * @param params Query lifecycle, copy and runtime connectivity inputs.
 * @returns A discriminated union consumed by shared async-state components.
 */
export const createQueryFeedbackState = <TData, TError = unknown>(
  params: CreateQueryFeedbackStateParams<TData, TError>,
): QueryFeedbackState<TData> => {
  const { connectivityStatus, onRetry, options, query } = params;
  const loadingPresentation = options.loadingPresentation ?? "skeleton";
  const hasData = hasMeaningfulData(query.data, options.isEmpty);

  if (hasData) {
    return {
      kind: "content",
      data: query.data,
      notice: resolveContentNotice(params),
      isRefreshing: query.isFetching,
    };
  }

  if (connectivityStatus === "offline" && (query.isPending || query.isError)) {
    return createNoticeState("offline", options.offline ?? DEFAULT_OFFLINE_COPY, onRetry);
  }

  if (query.isPending) {
    return {
      kind: "loading",
      title: options.loading.title,
      description: options.loading.description,
      presentation: loadingPresentation,
      skeletonLines: options.skeletonLines ?? DEFAULT_SKELETON_LINES,
    };
  }

  if (query.isError) {
    const errorState = createAppErrorState(query.error, {
      fallbackTitle: options.error?.fallbackTitle,
      fallbackDescription: options.error?.fallbackDescription,
      connectivityStatus,
    });

    if (errorState.category === "network") {
      return createNoticeState("offline", options.offline ?? DEFAULT_OFFLINE_COPY, onRetry);
    }

    if (errorState.category === "degraded") {
      return createNoticeState("degraded", options.degraded ?? DEFAULT_DEGRADED_COPY, onRetry);
    }

    return {
      kind: "error",
      error: query.error,
      fallbackTitle: options.error?.fallbackTitle,
      fallbackDescription: options.error?.fallbackDescription,
      onAction: onRetry,
    };
  }

  return {
    kind: "empty",
    title: options.empty.title,
    description: options.empty.description,
  };
};

/**
 * Binds query state composition to the current runtime connectivity store.
 *
 * @param query Query lifecycle object from TanStack Query.
 * @param options Copy, empty predicate and presentation options.
 * @returns Canonical render state for async feature screens.
 */
export const useQueryFeedbackState = <TData, TError = unknown>(
  query: QueryFeedbackStateInput<TData, TError>,
  options: QueryFeedbackStateOptions<TData>,
): QueryFeedbackState<TData> => {
  const connectivityStatus = useAppShellStore((state) => state.connectivityStatus);
  const degradedReason = useAppShellStore((state) => state.runtimeDegradedReason);

  return createQueryFeedbackState({
    query,
    options,
    connectivityStatus,
    degradedReason,
    onRetry: query.refetch
      ? (): void => {
          void query.refetch?.();
        }
      : undefined,
  });
};
