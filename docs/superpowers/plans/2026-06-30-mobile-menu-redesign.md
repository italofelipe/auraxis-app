# Mobile Menu Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current four-tab plus center-action menu with the five-tab liquid menu from the mobile handoff.

**Architecture:** Keep Expo Router `Tabs` as the navigation host, promote `Insights` and `Cartoes` to visible tabs, move `Planejamento` into `Mais`, and implement the liquid indicator inside `AppTabBar`. Use React Navigation scene interpolation for horizontal full-width tab transitions so tab state remains mounted.

**Tech Stack:** Expo Router, React Navigation bottom tabs, React Native Reanimated, Expo Linear Gradient, Tamagui, Jest/RNTL.

---

### Task 1: Route Contract

**Files:**
- Modify: `core/navigation/routes.ts`
- Test: `core/navigation/routes.test.ts`

- [ ] Write a failing test asserting `privateTabDefinitions` has five tabs in the order `dashboard`, `transacoes`, `insights`, `cartoes`, `mais`.
- [ ] Run `npm test -- core/navigation/routes.test.ts --runInBand` and verify the new assertion fails on the current four-tab contract.
- [ ] Update `PrivateTabDefinition`, icon types and `privateTabDefinitions` to match the handoff.
- [ ] Run the route test again and verify it passes.

### Task 2: Private Layout Transition

**Files:**
- Create: `core/navigation/tab-carousel-transition.ts`
- Modify: `app/(private)/_layout.tsx`
- Test: `__tests__/app/private-layout.test.tsx`

- [ ] Write failing layout tests asserting visible tab screens include `insights` and `cartoes`, hide `planejamento`, and set the custom horizontal transition spec.
- [ ] Run `npm test -- __tests__/app/private-layout.test.tsx --runInBand` and verify the assertions fail.
- [ ] Add the tab carousel transition helper and wire it into `Tabs` screen options using current window width.
- [ ] Update hidden routes so `planejamento` is hidden and `insights`/`cartoes` are visible.
- [ ] Run the layout test again and verify it passes.

### Task 3: Liquid Tab Bar

**Files:**
- Modify: `core/navigation/app-tab-bar.tsx`
- Test: `core/navigation/app-tab-bar.test.tsx`

- [ ] Replace tests for the old center FAB with failing tests for five equal tabs, no `tour-fab`, `tab-liquid-blob`, and active icon in the blob.
- [ ] Run `npm test -- core/navigation/app-tab-bar.test.tsx --runInBand` and verify the new assertions fail.
- [ ] Replace the underline/FAB implementation with a pill surface, liquid gradient blob, active-icon overlay, fixed Reanimated spring/timing values and a quick-create action rendered outside the tab row.
- [ ] Run the tab bar test again and verify it passes.

### Task 4: More Hub Access

**Files:**
- Modify: `core/navigation/more-hub-screen.tsx`
- Test: `core/navigation/more-hub-screen.test.tsx`

- [ ] Write failing tests asserting `Mais` includes `Planejamento` and `Nova transacao`.
- [ ] Run `npm test -- core/navigation/more-hub-screen.test.tsx --runInBand` and verify the assertions fail.
- [ ] Add both hub cards and wire `Nova transacao` to the shared expense sheet store.
- [ ] Run the hub test again and verify it passes.

### Task 5: Documentation And Gate

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `DATAFLOW.md`

- [ ] Document the five-tab menu, moved planning entry, quick-create entry and tab transition data flow.
- [ ] Run focused navigation tests.
- [ ] Run `npm run quality-check`.
- [ ] Commit, push and open a draft PR with `Closes #634`.
