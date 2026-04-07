import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query";

import type { ApiError } from "@/core/http/api-error";

export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables>, "mutationFn">,
): UseMutationResult<TData, ApiError, TVariables> => {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...options,
  });
};

export const createApiMutation = useApiMutation;
