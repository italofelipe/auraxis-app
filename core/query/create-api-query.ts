import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

import type { ApiError } from "@/core/http/api-error";
import { resolveQueryPolicy } from "@/core/query/query-policy";

export const useApiQuery = <TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError>, "queryKey" | "queryFn">,
): UseQueryResult<TData, ApiError> => {
  const policy = resolveQueryPolicy(queryKey);
  const staleTime = options?.staleTime ?? policy.staleTime;
  const gcTime = options?.gcTime ?? policy.gcTime;

  return useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    staleTime,
    gcTime,
    ...options,
  });
};

export const createApiQuery = useApiQuery;
