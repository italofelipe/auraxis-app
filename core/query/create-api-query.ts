import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

import type { ApiError } from "@/core/http/api-error";

export const useApiQuery = <TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError>, "queryKey" | "queryFn">,
): UseQueryResult<TData, ApiError> => {
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    ...options,
  });
};

export const createApiQuery = useApiQuery;
