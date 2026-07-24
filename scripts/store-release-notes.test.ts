import {
  createReleaseMetadata,
  extractPullRequestNumbers,
  extractReleaseSection,
  extractStoreChangelog,
  isReleasePleasePullRequest,
  loadPullRequestNotes,
  validatePullRequestBody,
  validateStoreNotes,
} from "./store-release-notes.cjs";

const validBody = `
## Descrição

Corrige a entrega móvel.

## Changelog de loja

- Agora cada versão mostra claramente as funcionalidades e correções entregues aos usuários.
- A publicação Android só é liberada depois que as notas detalhadas foram anexadas à versão.

## Validação

Testes verdes.
`;

describe("store-release-notes", () => {
  test("extracts and validates a detailed localized changelog section", () => {
    expect(extractStoreChangelog(validBody)).toContain("Agora cada versão");
    expect(validatePullRequestBody(validBody)).toEqual({
      errors: [],
      notes: [
        "- Agora cada versão mostra claramente as funcionalidades e correções entregues aos usuários.",
        "- A publicação Android só é liberada depois que as notas detalhadas foram anexadas à versão.",
      ].join("\n"),
    });
  });

  test("rejects missing, short and placeholder changelogs", () => {
    expect(validatePullRequestBody("## Descrição\nSem seção").errors).toHaveLength(1);
    expect(validateStoreNotes("- TODO\n- N/A").errors).toEqual(
      expect.arrayContaining([
        "changelog must contain at least 100 characters",
        "every changelog bullet must contain at least 25 characters",
        "changelog contains a placeholder or non-applicable answer",
      ]),
    );
  });

  test("enforces the Google Play 500 character limit", () => {
    const oversized = [
      `- ${"Mudança relevante para usuários ".repeat(10)}`,
      `- ${"Impacto explicado com detalhes ".repeat(10)}`,
    ].join("\n");

    expect(validateStoreNotes(oversized).errors).toContain(
      "changelog exceeds the 500 character store limit",
    );
  });

  test("finds the requested release section and referenced PRs", () => {
    const changelog = [
      "# Changelog",
      "## [1.13.7](https://example.test) (2026-07-24)",
      "### Bug Fixes",
      "* delivery ([#719](https://github.com/italofelipe/auraxis-app/pull/719))",
      "* notes (https://github.com/italofelipe/auraxis-app/pull/720)",
      "## [1.13.6](https://example.test)",
      "* older (#718)",
    ].join("\n");
    const section = extractReleaseSection(changelog, "1.13.7");

    expect(section).not.toContain("older");
    expect(extractPullRequestNumbers(section)).toEqual([719, 720]);
  });

  test("loads and combines only validated source PR notes", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ body: validBody }),
    });
    const pullRequests = await loadPullRequestNotes({
      fetchImpl,
      repository: "italofelipe/auraxis-app",
      token: "token",
      pullRequestNumbers: [719],
    });
    const metadata = createReleaseMetadata({
      pullRequests,
      version: "1.13.7",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/italofelipe/auraxis-app/pulls/719",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
    expect(metadata).toEqual({
      language: "pt-BR",
      releaseNotes: expect.stringContaining("publicação Android"),
      sourcePullRequests: [719],
      version: "1.13.7",
    });
  });

  test("identifies only generated Release Please PRs as policy exceptions", () => {
    expect(isReleasePleasePullRequest("chore(main): release 1.13.7")).toBe(true);
    expect(isReleasePleasePullRequest("fix: release notes")).toBe(false);
  });
});
