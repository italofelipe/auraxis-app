# Shared Entries Mobile Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the mobile shared-entries screen closer to Web parity by making by-me/with-me separation measurable and visible through tab counters and a summary surface.

**Architecture:** Keep existing API contracts and the current three-tab app structure (`invitations`, `byMe`, `withMe`). Add derived counts to `useSharedEntriesScreenController`, then render those counts in the screen without introducing backend changes.

**Tech Stack:** React Native, Expo Router, Tamagui, TanStack Query, Jest, React Native Testing Library.

---

### Task 1: Controller Counts

**Files:**
- Modify: `features/shared-entries/hooks/use-shared-entries-screen-controller.ts`
- Modify: `features/shared-entries/hooks/use-shared-entries-screen-controller.test.tsx`

- [x] **Step 1: Write the failing test**

Add a test that feeds one pending invitation, one by-me entry and two with-me entries through the mocked queries, then expects:

```ts
expect(result.current.tabCounts).toEqual({
  invitations: 1,
  byMe: 1,
  withMe: 2,
});
expect(result.current.summary).toEqual({
  totalEntries: 3,
  activeEntries: 2,
  pendingInvitations: 1,
});
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
npm test -- --runTestsByPath features/shared-entries/hooks/use-shared-entries-screen-controller.test.tsx --runInBand
```

Expected: FAIL because `tabCounts` and `summary` do not exist on the controller.

- [x] **Step 3: Implement minimal controller projection**

Add two readonly controller fields:

```ts
readonly tabCounts: Readonly<Record<SharedEntriesTab, number>>;
readonly summary: {
  readonly totalEntries: number;
  readonly activeEntries: number;
  readonly pendingInvitations: number;
};
```

Compute them from `pendingInvitations`, `byMeEntries` and `withMeEntries`.

- [x] **Step 4: Run GREEN**

Run the same controller test command and expect PASS.

### Task 2: Screen Summary And Counted Tabs

**Files:**
- Modify: `features/shared-entries/screens/shared-entries-screen.tsx`
- Modify: `features/shared-entries/screens/shared-entries-screen.test.tsx`

- [x] **Step 1: Write the failing screen tests**

Add tests that build a controller with `tabCounts` and `summary`, then assert:

```ts
expect(getByTestId("shared-entries-summary-total")).toHaveTextContent("3");
expect(getByTestId("shared-entries-summary-active")).toHaveTextContent("2");
expect(getByTestId("shared-entries-summary-invitations")).toHaveTextContent("1");
expect(getByText("Compartilhei (1)")).toBeTruthy();
expect(getByText("Recebi (2)")).toBeTruthy();
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
npm test -- --runTestsByPath features/shared-entries/screens/shared-entries-screen.test.tsx --runInBand
```

Expected: FAIL because the summary testIDs and counted tab labels are not rendered yet.

- [x] **Step 3: Implement minimal UI**

Render a compact `AppSurfaceCard` with three values:

```tsx
<SummaryMetric testID="shared-entries-summary-total" label="Total" value={controller.summary.totalEntries} />
<SummaryMetric testID="shared-entries-summary-active" label="Ativos" value={controller.summary.activeEntries} />
<SummaryMetric testID="shared-entries-summary-invitations" label="Convites" value={controller.summary.pendingInvitations} />
```

Update tab labels to include counts, e.g. `Compartilhei (1)`, and keep the selected tab tone.

- [x] **Step 4: Run GREEN**

Run the same screen test command and expect PASS.

### Task 3: Documentation And Gate

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `DATAFLOW.md`

- [x] **Step 1: Document the parity behavior**

Document that `/compartilhamentos` loads `by-me`, `with-me` and invitations independently, renders a mobile summary, and keeps revocation only on by-me entries.

- [x] **Step 2: Run focused verification**

Run:

```bash
npm test -- --runTestsByPath features/shared-entries/hooks/use-shared-entries-screen-controller.test.tsx features/shared-entries/screens/shared-entries-screen.test.tsx features/shared-entries/services/shared-entries-classifier.test.ts --runInBand
```

Expected: PASS.

- [x] **Step 3: Run quality gate**

Run:

```bash
npm run quality-check
```

Expected: PASS.

- [x] **Step 4: Finish**

Review diff, restore `.context/active_agents.json` to idle, commit selectively, push `feat/506-shared-entries-tabs`, and open a non-draft PR with `Closes #506`.
