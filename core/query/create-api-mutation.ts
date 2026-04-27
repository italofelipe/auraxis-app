import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query";

import type { ApiError } from "@/core/http/api-error";
import { triggerHapticNotification } from "@/shared/feedback/haptics";

export interface AppMutationFeedbackOptions {
  /**
   * When `true`, suppresses the automatic success/error haptic feedback
   * fired by every mutation. Use sparingly — appropriate for silent
   * background syncs, optimistic UI, or rapid bulk operations where
   * tactile noise would degrade UX.
   */
  readonly suppressHaptics?: boolean;
}

export type ApiMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, ApiError, TVariables>,
  "mutationFn"
> &
  AppMutationFeedbackOptions;

/**
 * Standard mutation hook that adds automatic tactile feedback to every
 * mutation outcome:
 *
 * - Success → soft success notification
 * - Error → error notification
 *
 * User-supplied `onSuccess` / `onError` handlers are still called after
 * the haptic fires, preserving previous behaviour. Pass
 * `suppressHaptics: true` to opt out (e.g. for background syncs).
 */
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: ApiMutationOptions<TData, TVariables>,
): UseMutationResult<TData, ApiError, TVariables> => {
  const {
    suppressHaptics = false,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...rest,
    // eslint-disable-next-line max-params
    onSuccess: (data, variables, onMutateResult, context) => {
      if (!suppressHaptics) {
        triggerHapticNotification("success");
      }
      return userOnSuccess?.(data, variables, onMutateResult, context);
    },
    // eslint-disable-next-line max-params
    onError: (error, variables, onMutateResult, context) => {
      if (!suppressHaptics) {
        triggerHapticNotification("error");
      }
      return userOnError?.(error, variables, onMutateResult, context);
    },
  });
};

export const createApiMutation = useApiMutation;
