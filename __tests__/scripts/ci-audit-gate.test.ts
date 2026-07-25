import { collectFindings } from "../../scripts/ci-audit-gate";

const braceExpansionAudit = {
  vulnerabilities: {
    "brace-expansion": {
      severity: "high",
      nodes: ["node_modules/brace-expansion"],
      via: [
        {
          source: 1124334,
          severity: "high",
          url: "https://github.com/advisories/GHSA-mh99-v99m-4gvg",
        },
      ],
    },
  },
};

describe("ci-audit-gate", () => {
  it("temporarily accepts only the transitive brace-expansion v1 advisory", () => {
    expect(collectFindings(braceExpansionAudit, () => "1.1.16")).toEqual([]);
  });

  it("rejects the same advisory when a vulnerable newer major is installed", () => {
    expect(collectFindings(braceExpansionAudit, () => "5.0.7")).toEqual([
      {
        pkg: "brace-expansion",
        severity: "high",
        id: "GHSA-mh99-v99m-4gvg",
      },
    ]);
  });

  it("rejects unrelated high severity advisories", () => {
    const unrelatedAudit = {
      vulnerabilities: {
        "runtime-package": {
          severity: "high",
          nodes: ["node_modules/runtime-package"],
          via: [
            {
              source: 999,
              severity: "critical",
              url: "https://github.com/advisories/GHSA-xxxx-yyyy-zzzz",
            },
          ],
        },
      },
    };

    expect(collectFindings(unrelatedAudit, () => "1.0.0")).toEqual([
      {
        pkg: "runtime-package",
        severity: "critical",
        id: "GHSA-xxxx-yyyy-zzzz",
      },
    ]);
  });
});
