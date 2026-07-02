# Production API Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent production app bundles from resolving the API base URL to localhost or any non-HTTPS endpoint.

**Architecture:** Keep the guard inside `shared/config/runtime.ts`, where the runtime singleton already resolves public Expo env and `expo.extra` values. Add pure validation helpers so unit tests can cover the policy without booting the app, and make `appRuntimeConfig` call the validator at module initialization.

**Tech Stack:** Expo SDK 54, React Native, TypeScript strict, Jest.

---

### Task 1: Runtime Guard Tests

**Files:**
- Create: `shared/config/runtime.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import {
  assertProductionApiBaseUrl,
  normalizeBaseUrl,
  resolveAppEnvironment,
} from "@/shared/config/runtime";

describe("runtime production API guard", () => {
  it("bloqueia localhost quando o app roda como production", () => {
    expect(() =>
      assertProductionApiBaseUrl({
        apiBaseUrl: "http://localhost:5000",
        appEnvironment: "production",
      }),
    ).toThrow(
      "Production app runtime requires EXPO_PUBLIC_API_URL to be an HTTPS URL",
    );
  });

  it("bloqueia endpoints nao-HTTPS quando o app roda como production", () => {
    expect(() =>
      assertProductionApiBaseUrl({
        apiBaseUrl: "http://api.auraxis.com.br",
        appEnvironment: "production",
      }),
    ).toThrow(
      "Production app runtime requires EXPO_PUBLIC_API_URL to be an HTTPS URL",
    );
  });

  it("aceita API HTTPS normalizada em production", () => {
    expect(
      assertProductionApiBaseUrl({
        apiBaseUrl: normalizeBaseUrl("https://api.auraxis.com.br/"),
        appEnvironment: "production",
      }),
    ).toBe("https://api.auraxis.com.br");
  });

  it("mantem localhost permitido fora de production", () => {
    expect(
      assertProductionApiBaseUrl({
        apiBaseUrl: "http://localhost:5000",
        appEnvironment: "development",
      }),
    ).toBe("http://localhost:5000");
  });

  it("normaliza ambientes Expo conhecidos e cai para development quando ausente", () => {
    expect(resolveAppEnvironment("production")).toBe("production");
    expect(resolveAppEnvironment("preview")).toBe("preview");
    expect(resolveAppEnvironment("development")).toBe("development");
    expect(resolveAppEnvironment("")).toBe("development");
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- shared/config/runtime.test.ts --runInBand
```

Expected: fail because `assertProductionApiBaseUrl` and `resolveAppEnvironment` are not exported yet.

### Task 2: Runtime Guard Implementation

**Files:**
- Modify: `shared/config/runtime.ts`

- [ ] **Step 1: Add environment resolution**

Add `EXPO_PUBLIC_APP_ENV` to `RuntimeEnvKey`, add its reader, and introduce:

```ts
type AppEnvironment = "development" | "preview" | "production";

export const resolveAppEnvironment = (rawValue: string | null | undefined): AppEnvironment => {
  const normalized = String(rawValue ?? "").trim().toLowerCase();
  return normalized === "production" || normalized === "preview" ? normalized : "development";
};
```

- [ ] **Step 2: Add production URL assertion**

Add:

```ts
const PRODUCTION_API_URL_ERROR =
  "Production app runtime requires EXPO_PUBLIC_API_URL to be an HTTPS URL. Configure EXPO_PUBLIC_API_URL=https://api.auraxis.com.br in the EAS environment before building.";

const isLocalhostHostname = (hostname: string): boolean =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

export const assertProductionApiBaseUrl = ({
  apiBaseUrl,
  appEnvironment,
}: {
  readonly apiBaseUrl: string;
  readonly appEnvironment: AppEnvironment;
}): string => {
  if (appEnvironment !== "production") {
    return apiBaseUrl;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error(PRODUCTION_API_URL_ERROR);
  }

  if (parsedUrl.protocol !== "https:" || isLocalhostHostname(parsedUrl.hostname)) {
    throw new Error(PRODUCTION_API_URL_ERROR);
  }

  return apiBaseUrl;
};
```

- [ ] **Step 3: Wire singleton config**

Resolve app env before `appRuntimeConfig`, compute the normalized API URL once, and pass it through the assertion:

```ts
const appEnvironment = resolveAppEnvironment(
  readString("EXPO_PUBLIC_APP_ENV", "appEnv", "development"),
);

const resolvedApiBaseUrl = assertProductionApiBaseUrl({
  apiBaseUrl: normalizeBaseUrl(
    readString("EXPO_PUBLIC_API_URL", "apiUrl", DEFAULT_API_BASE_URL),
  ),
  appEnvironment,
});
```

Then set `apiBaseUrl: resolvedApiBaseUrl`.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- shared/config/runtime.test.ts --runInBand
```

Expected: all tests pass.

### Task 3: Documentation

**Files:**
- Modify: `docs/runtime.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DATAFLOW.md`

- [ ] **Step 1: Document runtime policy**

In `docs/runtime.md`, add a section near the Sentry environment/runtime docs explaining that `EXPO_PUBLIC_APP_ENV=production` requires `EXPO_PUBLIC_API_URL` to be HTTPS and cannot use localhost.

- [ ] **Step 2: Document architecture/dataflow impact**

Add a short runtime security bullet to `ARCHITECTURE.md` and a `Production Runtime Config Flow` section to `DATAFLOW.md`.

### Task 4: Validation And Shipping

- [ ] **Step 1: Focused checks**

Run:

```bash
npm test -- shared/config/runtime.test.ts --runInBand
npx eslint --max-warnings 0 --no-warn-ignored shared/config/runtime.ts shared/config/runtime.test.ts
npm run typecheck
git diff --check
```

- [ ] **Step 2: Full gate**

Run:

```bash
npm run quality-check
```

- [ ] **Step 3: Restore coordination and ship**

Restore `.context/active_agents.json` to idle, stage only intended files, commit, push and open a non-draft PR with `Closes #521`. No screenshots are required because this is a non-visual runtime/security change.
