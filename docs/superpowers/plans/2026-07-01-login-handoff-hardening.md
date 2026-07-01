# Login Handoff Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining mobile login handoff acceptance gaps after the recent web-to-app parity merges.

**Architecture:** The premium login screen already owns the B3 visual shell and delegates auth behavior to `useLoginScreenController`. This slice keeps that contract intact, moves the remaining login placeholders into i18n, adds a focused glass-input state, and documents the current status of the app design handoffs.

**Tech Stack:** Expo SDK 54, React Native, Tamagui, React Hook Form, Jest/RNTL, shared i18n JSON.

---

## Files

- Modify: `features/auth/screens/login-screen.tsx`
  - Read placeholder labels from i18n.
  - Track focus in `PremiumInputField`.
  - Apply focus border/halo style to the glass input wrapper.
- Modify: `features/auth/screens/login-screen.test.tsx`
  - Add failing tests for localized placeholders and focus/blur style.
- Modify: `shared/i18n/locales/pt.json`
  - Add `auth.login.emailPlaceholderPremium` and `auth.login.passwordPlaceholderPremium`.
- Modify: `shared/i18n/locales/en.json`
  - Add the matching English keys.
- Create: `docs/handoffs/mobile-design-handoff-status-2026-07-01.md`
  - Record #629, #635, #637 and this #638 scope.
- Modify: `ARCHITECTURE.md`
  - Note that premium login placeholders and focus styling are governed by i18n/handoff tests.
- Modify: `DATAFLOW.md`
  - Note that this is presentation-only and keeps auth controller/data flow unchanged.

## Task 1: Document merged handoff status

- [ ] Create `docs/handoffs/mobile-design-handoff-status-2026-07-01.md` with this table:

```markdown
| Handoff | App status | Evidence |
| --- | --- | --- |
| Web/App parity tools + login base | Implemented | PR #629 |
| Bottom tab liquida | Implemented | PR #635 |
| Transaction observations | Implemented | PR #637 |
| Login mobile premium hardening | In progress | Issue #638 |
```

- [ ] Update `ARCHITECTURE.md` and `DATAFLOW.md` with one paragraph each about this hardening slice.

## Task 2: RED tests for login placeholders and focus

- [ ] Add a test in `features/auth/screens/login-screen.test.tsx` that renders the premium login screen and asserts:

```ts
expect(getByPlaceholderText("seu@email.com")).toBeTruthy();
expect(getByPlaceholderText("Sua senha")).toBeTruthy();
```

- [ ] Add a test that focuses and blurs the email field and asserts the glass wrapper test id changes style:

```ts
const email = getByPlaceholderText("seu@email.com");
const shell = getByTestId("login-email-shell");

fireEvent(email, "focus");
expect(shell.props.style).toEqual(
  expect.objectContaining({
    borderColor: "rgba(155,233,255,0.6)",
  }),
);

fireEvent(email, "blur");
expect(shell.props.style).toEqual(
  expect.objectContaining({
    borderColor: "rgba(255,255,255,0.16)",
  }),
);
```

- [ ] Run:

```bash
npm test -- features/auth/screens/login-screen.test.tsx --runInBand
```

Expected: placeholder test may pass if literals exist; focus test must fail because `login-email-shell` and focus state do not exist yet.

## Task 3: GREEN implementation

- [ ] Add i18n keys to both locale files:

```json
"emailPlaceholderPremium": "seu@email.com",
"passwordPlaceholderPremium": "Sua senha"
```

```json
"emailPlaceholderPremium": "you@example.com",
"passwordPlaceholderPremium": "Your password"
```

- [ ] Pass placeholders through `LoginFields`:

```ts
placeholders={{
  email: t("auth.login.emailPlaceholderPremium"),
  password: t("auth.login.passwordPlaceholderPremium"),
}}
```

- [ ] Extend `PremiumInputField` with focus state and a shell test id:

```ts
const [focused, setFocused] = useState(false);
const shellStyle = focused ? styles.inputShellFocused : styles.inputShell;
```

- [ ] Keep existing `onBlur` behavior by composing focus handlers:

```ts
onFocus={(event) => {
  setFocused(true);
  rest.onFocus?.(event);
}}
onBlur={(event) => {
  setFocused(false);
  rest.onBlur?.(event);
}}
```

## Task 4: Verification

- [ ] Run focused login tests:

```bash
npm test -- features/auth/screens/login-screen.test.tsx __tests__/app/login-screen.test.tsx --runInBand
```

- [ ] Run static checks:

```bash
npm run lint
npm run typecheck
```

- [ ] Run the full app gate:

```bash
npm run quality-check
```

## Task 5: Ship

- [ ] Restore `.context/active_agents.json` to idle before opening the PR.
- [ ] Review:

```bash
git diff --stat
git diff --name-only
git diff --check
```

- [ ] Stage selectively.
- [ ] Commit:

```bash
git commit -m "feat(auth): harden premium login handoff"
```

- [ ] Push and open a PR with `Closes #638`.
