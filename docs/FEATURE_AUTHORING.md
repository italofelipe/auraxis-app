# Feature Authoring Playbook

> Canonical guide for creating a new feature in `auraxis-app`.
> Every new feature must follow this structure exactly.

---

## 1. Prerequisites

Before writing any code:

1. Ensure the GitHub Projects issue has clear acceptance criteria.
2. Verify the OpenAPI contract exists: `npm run contracts:check`.
3. Read `CODING_STANDARDS.md` — all rules apply.

---

## 2. File Structure

Every feature lives under `features/<domain-name>/` and follows this layout:

```
features/
  my-domain/
    contracts.ts                        # TypeScript types derived from OpenAPI contracts
    mocks.ts                            # MSW/Jest mock factories for tests
    hooks/
      use-my-domain-query.ts            # TanStack Query wrapper(s)
      use-my-domain-screen-controller.ts # Screen logic + view models
      use-my-domain-mutations.ts        # Mutation hooks (if needed)
    screens/
      my-domain-screen.tsx              # Screen composition (view only)
    services/
      my-domain-service.ts              # HTTP service calls
    validators.ts                       # Zod schemas for forms (if feature has forms)
    validators.test.ts                  # Tests for validators
    components/                         # Feature-scoped components (optional)
```

> **Rule:** `screens/` contains only composition. Logic lives in `hooks/`.
> **Rule:** `components/` is for components used only within this feature.
> Shared components go to `shared/components/`.

---

## 3. Naming Conventions

| Artifact | Convention | Example |
|:---------|:-----------|:--------|
| Domain name | `kebab-case` | `user-profile` |
| Screen file | `<domain>-screen.tsx` | `user-profile-screen.tsx` |
| Screen controller | `use-<domain>-screen-controller.ts` | `use-user-profile-screen-controller.ts` |
| Query hook | `use-<domain>-query.ts` | `use-user-profile-query.ts` |
| Mutation hook | `use-<domain>-mutations.ts` | `use-user-profile-mutations.ts` |
| Service | `<domain>-service.ts` | `user-profile-service.ts` |
| Contracts | `contracts.ts` (always this name) | — |
| Mocks | `mocks.ts` (always this name) | — |

---

## 4. Step-by-Step: Adding a New Feature

### Step 1 — Add the query key

In `core/query/query-keys.ts`, add your domain:

```typescript
myDomain: {
  root: ["my-domain"] as const,
  detail: (id: string) => ["my-domain", "detail", id] as const,
},
```

### Step 2 — Add the cache policy

In `core/query/query-policy.ts`, add your domain root with rationale:

```typescript
// Data changes infrequently; 60s stale time is appropriate.
"my-domain": createPolicy(SLOW_STALE_TIME_MS),
```

See `docs/query-strategy.md` for stale-time guidelines.

### Step 3 — Define contracts

In `features/my-domain/contracts.ts`, define all TypeScript types.
These **must** match the OpenAPI schema in `auraxis-api`.

```typescript
export interface MyDomainRecord {
  readonly id: string;
  readonly name: string;
}

export interface MyDomainListResponse {
  readonly items: MyDomainRecord[];
}
```

### Step 4 — Write the service

In `features/my-domain/services/my-domain-service.ts`:

```typescript
import { apiClient } from "@/core/http/api-client";
import type { MyDomainListResponse } from "@/features/my-domain/contracts";

export const myDomainService = {
  listItems: (): Promise<MyDomainListResponse> =>
    apiClient.get("/my-domain"),
};
```

### Step 5 — Write the query hook

In `features/my-domain/hooks/use-my-domain-query.ts`:

```typescript
import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { MyDomainListResponse } from "@/features/my-domain/contracts";
import { myDomainService } from "@/features/my-domain/services/my-domain-service";

export const useMyDomainQuery = () =>
  createApiQuery<MyDomainListResponse>(
    queryKeys.myDomain.root,
    () => myDomainService.listItems(),
  );
```

### Step 6 — Write the screen controller

In `features/my-domain/hooks/use-my-domain-screen-controller.ts`:

```typescript
import { useMemo } from "react";
import { useMyDomainQuery } from "@/features/my-domain/hooks/use-my-domain-query";

export interface MyDomainScreenController {
  readonly query: ReturnType<typeof useMyDomainQuery>;
  readonly items: MyDomainRecord[];
}

export function useMyDomainScreenController(): MyDomainScreenController {
  const query = useMyDomainQuery();
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  return { query, items };
}
```

### Step 7 — Compose the screen

In `features/my-domain/screens/my-domain-screen.tsx`:

```tsx
import { useMyDomainScreenController } from "@/features/my-domain/hooks/use-my-domain-screen-controller";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function MyDomainScreen(): ReactElement {
  const controller = useMyDomainScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard title="My Domain" description="...">
        <AppQueryState
          query={controller.query}
          options={{
            loading: { title: "Loading...", description: "Fetching data." },
            empty: { title: "No items", description: "Nothing here yet." },
            error: {
              fallbackTitle: "Could not load",
              fallbackDescription: "Try again later.",
            },
            isEmpty: (data) => data.items.length === 0,
          }}
        >
          {() => <>{/* render items */}</>}
        </AppQueryState>
      </AppSurfaceCard>
    </AppScreen>
  );
}
```

### Step 8 — Register in Expo Router

Add a route file in `app/(tabs)/my-domain.tsx` (or the appropriate route group):

```tsx
import { MyDomainScreen } from "@/features/my-domain/screens/my-domain-screen";

export default MyDomainScreen;
```

### Step 9 — Write tests

See `docs/TESTING_STRATEGY.md` for the full testing guide.

Minimum required:
- `features/my-domain/hooks/use-my-domain-query.test.ts` — query hook test.
- `features/my-domain/hooks/use-my-domain-screen-controller.test.ts` — controller test.

### Step 10 — Run quality gate

```bash
npm run quality-check
```

All checks must pass before opening a PR.

---

## 5. Forms in Features

When a feature requires a form:

1. Add a `validators.ts` with a Zod schema.
2. Use `useAppForm` from `shared/forms/use-app-form.ts`.
3. Use `AppFormField` from `shared/forms/app-form-field.tsx` for each field.
4. Use `useFormSubmitState` from `shared/forms/use-form-submit-state.ts` to drive the submit button state.
5. Use `useFormFocus` from `shared/forms/use-form-focus.ts` for keyboard navigation.
6. Apply API errors with `applyApiFormErrors` from `shared/forms/apply-api-form-errors.ts`.

---

## 6. Mutations in Features

Mutation hooks follow the same naming pattern as query hooks:

```typescript
// features/my-domain/hooks/use-my-domain-mutations.ts
import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryClient } from "@/config/query-client";
import { queryKeys } from "@/core/query/query-keys";

export const useCreateMyDomainItemMutation = () =>
  createApiMutation(
    (cmd: CreateMyDomainItemCommand) => myDomainService.createItem(cmd),
    {
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.myDomain.root });
      },
    },
  );
```

---

## 7. Shared vs Feature Components

| Where | When to use |
|:------|:------------|
| `shared/components/` | Used in 2+ features or part of the design system |
| `features/<domain>/components/` | Used only within this one feature |

Never import from another feature's `components/` directory.

---

## 8. Checklist Before Opening a PR

- [ ] `npm run quality-check` passes (lint + typecheck + policy + contracts + tests)
- [ ] Coverage threshold met (≥ 85% lines/functions/statements/branches)
- [ ] All loading/empty/error states handled via `AppQueryState`
- [ ] No literal color/spacing/font-size values in components
- [ ] No logic in screen files (only in controllers/hooks)
- [ ] Mocks created in `mocks.ts` for test usage
- [ ] Query key added to `query-keys.ts`
- [ ] Cache policy added to `query-policy.ts`
