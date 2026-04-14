# Query, Cache and Prefetch Strategy

> Canonical reference for TanStack Query usage in `auraxis-app`.
> Stack: `@tanstack/react-query` v5 · Expo SDK 54 · TypeScript strict.

---

## 1. Query Key Taxonomy

All query keys live in `core/query/query-keys.ts`. The canonical shape is:

```
[domain-root, ...sub-path?, ...params?]
```

| Level | Example | Purpose |
|:------|:--------|:--------|
| Root | `["transactions"]` | Invalidate the entire domain |
| Sub-path | `["transactions", "list"]` | Scope to a query type |
| Params | `["transactions", "list", { page: 1 }]` | Unique key per parameter set |

**Rules:**
- Never hard-code string arrays — always use `queryKeys.*` factory.
- Passing dynamic params as the last element preserves prefix-based invalidation.
- Query key shape must match the domain root used in `query-policy.ts`.

---

## 2. Stale Times per Domain

Defined in `core/query/query-policy.ts`. The `resolveQueryPolicy` function maps the
first element of a query key to a `QueryCachePolicy`.

| Domain root | Stale time | GC time | Rationale |
|:------------|:-----------|:--------|:----------|
| `observability` | 10 s (FAST) | 5 min | Metrics need near-realtime freshness |
| `dashboard` | 30 s (DEFAULT) | 5 min | Balance between freshness and UX |
| `transactions` | 30 s (DEFAULT) | 5 min | User-driven mutations invalidate manually |
| `alerts` | 30 s (DEFAULT) | 5 min | Alert state changes infrequently |
| `entitlements` | 30 s (DEFAULT) | 5 min | Feature gating; re-checked on focus |
| `simulations` | 30 s (DEFAULT) | 5 min | Simulation results are ephemeral |
| `bootstrap` | 60 s (SLOW) | 5 min | Session bootstrap data is stable |
| `subscription` | 60 s (SLOW) | 5 min | Plan changes are rare |
| `goals` | 60 s (SLOW) | 5 min | Goal updates are infrequent |
| `user-profile` | 60 s (SLOW) | 5 min | Profile changes are rare |
| `shared-entries` | 60 s (SLOW) | 5 min | Sharing state changes infrequently |
| `wallet` | 60 s (SLOW) | 5 min | Portfolio changes are infrequent |
| `fiscal` | 60 s (SLOW) | 5 min | Fiscal data is slow-moving |
| `tools` | 5 min (LONG) | 7 days | Tool catalog is effectively static |
| `questionnaire` | 24 h (STATIC) | 7 days | Survey questions never change at runtime |

New domains must add an entry to `QUERY_POLICY_BY_ROOT` and include rationale
in a PR comment.

---

## 3. Invalidation Patterns

### 3.1 After mutation — invalidate by root

```typescript
// Correct: invalidates all transactions/* keys
await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });

// Also correct: invalidates a specific sub-tree
await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.list() });
```

**Never** call `queryClient.clear()` — it wipes all cached data for all domains.

### 3.2 Optimistic updates

Use `onMutate` → `onError` rollback → `onSettled` re-invalidate:

```typescript
const mutation = useAppMutation(() => transactionsService.createTransaction(cmd), {
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.transactions.root });
    const snapshot = queryClient.getQueryData(queryKeys.transactions.list());
    // Apply optimistic update ...
    return { snapshot };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(queryKeys.transactions.list(), context?.snapshot);
  },
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
  },
});
```

### 3.3 Cross-domain invalidation

When a mutation in domain A affects domain B (e.g., creating a transaction updates
the dashboard balance), invalidate both roots in `onSettled`:

```typescript
onSettled: () => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root });
},
```

---

## 4. Prefetch Hooks

The canonical prefetch primitive is `prefetchApiQuery` in `core/query/prefetch-api-query.ts`.
It automatically applies the stale-time policy from `query-policy.ts`.

```typescript
import { prefetchApiQuery } from "@/core/query/prefetch-api-query";
import { queryClient } from "@/config/query-client";

// Prefetch before navigation
await prefetchApiQuery(queryClient, queryKeys.goals.list(), {
  queryFn: () => goalsService.listGoals(),
});
```

Use prefetch in:
- App bootstrap (`core/session/use-app-startup.ts`) for critical-path data.
- Tab focus handlers for adjacent tabs the user is likely to visit.
- Long-press / hover preview patterns (future).

---

## 5. Query Creation Primitives

### `createApiQuery` — `core/query/create-api-query.ts`

Wraps `useQuery` with automatic policy resolution, error normalization and
`ApiError` typing.

```typescript
const useGoalsQuery = () =>
  createApiQuery<GoalListResponse>(
    queryKeys.goals.list(),
    () => goalsService.listGoals(),
  );
```

### `createApiMutation` — `core/query/create-api-mutation.ts`

Wraps `useMutation` with `ApiError` normalization.

```typescript
const useCreateTransactionMutation = () =>
  createApiMutation((cmd: CreateTransactionCommand) =>
    transactionsService.createTransaction(cmd),
  );
```

---

## 6. Query Client Configuration

| Mode | Stale time | GC time | Retry | Notes |
|:-----|:-----------|:--------|:------|:------|
| `runtime` | 30 s | 5 min | Exponential backoff | Default for all app screens |
| `test` | 0 | Infinity | Disabled | Used in `createAppQueryClient({ mode: "test" })` |

The singleton `queryClient` exported from `config/query-client.ts` is the runtime
instance wired into `AppProviders`.

---

## 7. Adding a New Domain

1. Add a `myDomain` entry to `queryKeys` in `core/query/query-keys.ts`.
2. Add a `myDomain` stale-time policy to `QUERY_POLICY_BY_ROOT` in
   `core/query/query-policy.ts` with rationale comment.
3. Create `features/my-domain/hooks/use-my-domain-query.ts` using
   `createApiQuery`.
4. Add tests to `features/my-domain/hooks/use-my-domain-query.test.ts`.
