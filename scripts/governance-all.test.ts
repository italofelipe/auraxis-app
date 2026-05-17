import {
  GOVERNANCE_CHECKS,
  formatSummary,
  runGovernanceChecks,
} from "./governance-all.cjs";

describe("governance-all", () => {
  test("keeps the canonical governance check list in one place", () => {
    expect(GOVERNANCE_CHECKS.map((check) => check.id)).toEqual([
      "frontend",
      "api-contract",
      "app-routes",
      "openapi-secret-hygiene",
      "sonar-config",
      "runtime-release",
      "client-security",
      "client-logging",
      "new-feature-flags",
    ]);
  });

  test("runs every check and returns a failing exit code when any check fails", () => {
    const runner = jest
      .fn()
      .mockReturnValueOnce({ status: 0, stdout: "frontend ok\n", stderr: "" })
      .mockReturnValueOnce({ status: 1, stdout: "", stderr: "route drift\n" })
      .mockReturnValueOnce({ status: 0, stdout: "logging ok\n", stderr: "" });

    const result = runGovernanceChecks({
      checks: [
        { id: "frontend", label: "Frontend", script: "scripts/frontend.cjs" },
        { id: "app-routes", label: "Routes", script: "scripts/routes.cjs" },
        { id: "client-logging", label: "Logging", script: "scripts/logging.cjs" },
      ],
      runner,
      rootDirectory: "/repo",
    });

    expect(runner).toHaveBeenCalledTimes(3);
    expect(result.exitCode).toBe(1);
    expect(result.results).toEqual([
      expect.objectContaining({ id: "frontend", status: "passed" }),
      expect.objectContaining({ id: "app-routes", status: "failed" }),
      expect.objectContaining({ id: "client-logging", status: "passed" }),
    ]);
  });

  test("formats a compact summary with failed checks first", () => {
    expect(
      formatSummary([
        { id: "frontend", label: "Frontend", status: "passed", exitCode: 0 },
        { id: "app-routes", label: "Routes", status: "failed", exitCode: 1 },
      ]),
    ).toBe(
      [
        "[governance:all] FAILED (1 failed, 1 passed)",
        " - FAIL app-routes: Routes (exit 1)",
        " - PASS frontend: Frontend",
      ].join("\n"),
    );
  });
});
