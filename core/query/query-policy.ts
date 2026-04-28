import type { QueryKey } from "@tanstack/react-query";

export interface QueryCachePolicy {
  readonly staleTime: number;
  readonly gcTime: number;
}

const DEFAULT_STALE_TIME_MS = 30_000;
const DEFAULT_GC_TIME_MS = 300_000;
const FAST_STALE_TIME_MS = 10_000;
const SLOW_STALE_TIME_MS = 60_000;
const LONG_STALE_TIME_MS = 300_000;
const STATIC_STALE_TIME_MS = 86_400_000;
const STATIC_GC_TIME_MS = 604_800_000;

const createPolicy = (
  staleTime: number,
  gcTime = DEFAULT_GC_TIME_MS,
): QueryCachePolicy => {
  return {
    staleTime,
    gcTime,
  };
};

const DEFAULT_POLICY = createPolicy(
  DEFAULT_STALE_TIME_MS,
  DEFAULT_GC_TIME_MS,
);

const QUERY_POLICY_BY_ROOT: Record<string, QueryCachePolicy> = {
  bootstrap: createPolicy(SLOW_STALE_TIME_MS),
  subscription: createPolicy(SLOW_STALE_TIME_MS),
  entitlements: createPolicy(DEFAULT_STALE_TIME_MS),
  dashboard: createPolicy(DEFAULT_STALE_TIME_MS),
  transactions: createPolicy(DEFAULT_STALE_TIME_MS),
  goals: createPolicy(SLOW_STALE_TIME_MS),
  alerts: createPolicy(DEFAULT_STALE_TIME_MS),
  "user-profile": createPolicy(SLOW_STALE_TIME_MS),
  questionnaire: createPolicy(STATIC_STALE_TIME_MS, STATIC_GC_TIME_MS),
  "shared-entries": createPolicy(SLOW_STALE_TIME_MS),
  wallet: createPolicy(SLOW_STALE_TIME_MS),
  fiscal: createPolicy(SLOW_STALE_TIME_MS),
  tools: createPolicy(LONG_STALE_TIME_MS, STATIC_GC_TIME_MS),
  simulations: createPolicy(DEFAULT_STALE_TIME_MS),
  observability: createPolicy(FAST_STALE_TIME_MS),
  brapi: createPolicy(SLOW_STALE_TIME_MS),
};

const resolveRootKey = (queryKey: QueryKey): string | null => {
  const [root] = queryKey;

  return typeof root === "string" ? root : null;
};

/**
 * Resolves the canonical cache policy for a given query key.
 */
export const resolveQueryPolicy = (queryKey: QueryKey): QueryCachePolicy => {
  const rootKey = resolveRootKey(queryKey);

  if (!rootKey) {
    return DEFAULT_POLICY;
  }

  return QUERY_POLICY_BY_ROOT[rootKey] ?? DEFAULT_POLICY;
};
