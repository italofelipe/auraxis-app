import loadStoreConfig, { createStoreConfig } from "../store.config";

describe("store.config", () => {
  test("maps generated pt-BR notes to the exact App Store version", () => {
    expect(
      createStoreConfig({
        releaseNotes: "- Mudança detalhada para os usuários.",
        version: "1.13.7",
      }),
    ).toEqual({
      configVersion: 0,
      apple: {
        version: "1.13.7",
        info: {
          "pt-BR": {
            privacyPolicyUrl: "https://app.auraxis.com.br/privacy-policy",
            releaseNotes: "- Mudança detalhada para os usuários.",
            title: "Auraxis",
          },
        },
      },
    });
  });

  test("exports the dynamic EAS Metadata loader", () => {
    expect(typeof loadStoreConfig).toBe("function");
  });
});
