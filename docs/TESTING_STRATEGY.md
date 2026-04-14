# Testing Strategy

> Canonical testing guide for `auraxis-app`.
> Stack: `jest-expo` · `@testing-library/react-native` · `@testing-library/react-hooks`

---

## 1. Coverage Requirements

| Metric | Threshold |
|:-------|:----------|
| Lines | ≥ 85% |
| Functions | ≥ 85% |
| Branches | ≥ 85% |
| Statements | ≥ 85% |

Coverage thresholds are enforced in `jest.config.js` → `coverageThreshold`.
The `quality-check` script fails if any threshold is breached.

New files added to the codebase **must** be included in `collectCoverageFrom` in
`jest.config.js`.

---

## 2. Test File Naming

| Type | Convention | Example |
|:-----|:-----------|:--------|
| Unit | `<name>.test.ts` | `query-policy.test.ts` |
| Component | `<name>.test.tsx` | `app-button.test.tsx` |
| Hook | `<name>.test.ts` or `.test.tsx` | `use-app-form.test.tsx` |
| Integration | `<name>.integration.test.ts` | (not yet in use) |

Test files live **next to** the file they test. No separate `__tests__/` folder
for feature-level tests.

---

## 3. What to Unit Test

### 3.1 Pure logic (always test)

- Utility functions: `shared/utils/`
- Query policies: `core/query/query-policy.ts`
- Validators: `features/<domain>/validators.ts`
- Service response mappers
- Form error extraction: `shared/forms/api-form-errors.ts`

```typescript
// Example: validator test
import { loginSchema } from "@/features/auth/validators";

it("rejects empty email", () => {
  const result = loginSchema.safeParse({ email: "", password: "pass" });
  expect(result.success).toBe(false);
});
```

### 3.2 Hooks (always test)

Test hooks in isolation with `renderHook` from `@testing-library/react-native`.
Wrap in `TestProviders` when the hook needs QueryClient or other context.

```typescript
import { renderHook } from "@testing-library/react-native";
import { TestProviders } from "@/shared/testing/test-providers";

const { result } = renderHook(() => useMyHook(), { wrapper: TestProviders });
```

**What to assert in hooks:**
- Initial state is correct.
- State transitions on mock data changes.
- Error state when query fails.
- Empty state when response has no items.

### 3.3 Components (test behaviors, not markup)

Prefer testing by user-visible behavior: rendered text, button presses, state
changes. Avoid snapshot tests — they are brittle and low-value.

```tsx
import { render, screen } from "@testing-library/react-native";
import { TestProviders } from "@/shared/testing/test-providers";

it("shows error when query fails", () => {
  render(<MyComponent />, { wrapper: TestProviders });
  expect(screen.getByText(/nao foi possivel/i)).toBeTruthy();
});
```

---

## 4. What NOT to Unit Test

| Artifact | Why |
|:---------|:----|
| Screen compositions | Covered by controller tests + component tests |
| Route files (`app/*.tsx`) | Thin wrappers — covered by E2E |
| `mocks.ts` factory files | Test infrastructure, not product code |
| Generated type files | Auto-generated, no logic |
| Tamagui/third-party internals | Third-party responsibility |

---

## 5. Mocking Strategy

### 5.1 What to mock

| Boundary | How to mock |
|:---------|:------------|
| HTTP (`apiClient`) | Mock at service level using `jest.mock` |
| React Query | Use `createAppQueryClient({ mode: "test" })` via `TestProviders` |
| `expo-secure-store` | Mocked in `jest.setup.ts` |
| `expo-router` | Mocked in `jest.setup.ts` |
| Sentry | Mocked in `__mocks__/sentryReactNativeMock.ts` |

### 5.2 Mock factories

Every feature's `mocks.ts` exports factory functions:

```typescript
// features/goals/mocks.ts
import type { GoalListResponse } from "@/features/goals/contracts";

export const makeGoalListResponse = (
  overrides: Partial<GoalListResponse> = {},
): GoalListResponse => ({
  goals: [],
  ...overrides,
});
```

Use factories in tests instead of inline object literals — this decouples
tests from contract shape.

### 5.3 Service mocking

Mock the service module, not the HTTP client:

```typescript
import { goalsService } from "@/features/goals/services/goals-service";

jest.mock("@/features/goals/services/goals-service");

const mockGoalsService = goalsService as jest.Mocked<typeof goalsService>;

beforeEach(() => {
  mockGoalsService.listGoals.mockResolvedValue(makeGoalListResponse());
});
```

---

## 6. Test Providers

`shared/testing/test-providers.tsx` exports `TestProviders`, a wrapper that
provides:
- `QueryClientProvider` with `mode: "test"` query client (no retry, no stale time).
- `TamaguiProvider` with the Auraxis theme.

Always use `TestProviders` when testing components or hooks that use React Query
or Tamagui.

---

## 7. Async Testing Patterns

### Waiting for query results

```typescript
import { waitFor } from "@testing-library/react-native";

await waitFor(() => {
  expect(screen.getByText("Goal title")).toBeTruthy();
});
```

### Testing loading state

```typescript
// Mock service to never resolve to capture loading state
mockGoalsService.listGoals.mockReturnValue(new Promise(() => {}));

render(<GoalsScreen />, { wrapper: TestProviders });
expect(screen.getByText(/carregando/i)).toBeTruthy();
```

### Testing error state

```typescript
mockGoalsService.listGoals.mockRejectedValue(new Error("Network error"));

await waitFor(() => {
  expect(screen.getByText(/nao foi possivel/i)).toBeTruthy();
});
```

### Testing empty state

```typescript
mockGoalsService.listGoals.mockResolvedValue(makeGoalListResponse({ goals: [] }));

await waitFor(() => {
  expect(screen.getByText(/nenhuma meta/i)).toBeTruthy();
});
```

---

## 8. Form Testing

Test form validation with Zod schemas directly:

```typescript
const result = myFormSchema.safeParse({ field: "" });
expect(result.success).toBe(false);
expect(result.error?.issues[0].message).toBe("Required");
```

Test form hooks with `renderHook` + `act`:

```typescript
import { act, renderHook } from "@testing-library/react-native";

const { result } = renderHook(() => useAppForm(schema, { defaultValues }));

await act(async () => {
  await result.current.handleSubmit(onSubmit)();
});
```

---

## 9. Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch

# Run full quality gate (includes tests)
npm run quality-check
```

---

## 10. Adding a New Test File to Coverage

When adding a new source file, add its path to `collectCoverageFrom` in
`jest.config.js`. Use the same relative-path format as existing entries.

**Do not** use wildcard globs for `collectCoverageFrom` — explicit paths prevent
accidentally including generated or test files.
