import { resolveBuildInformation } from "./build-information-section";

describe("build information", () => {
  test("keeps the exact version/build and compacts technical identifiers", () => {
    expect(
      resolveBuildInformation({
        appVersion: "1.14.0",
        buildVersion: "28",
        commit: "1234567890abcdef",
        runtimeVersion: "runtime-1234567890",
        updateId: "update-1234567890",
      }),
    ).toEqual({
      appVersion: "1.14.0",
      buildVersion: "28",
      commit: "1234567890ab",
      runtimeVersion: "runtime-1234567890",
      updateId: "update-1234567890",
    });
  });

  test("uses readable labels for a local embedded development build", () => {
    expect(resolveBuildInformation({})).toEqual({
      appVersion: "Desconhecida",
      buildVersion: "Desconhecido",
      commit: "Desenvolvimento",
      runtimeVersion: "Embutido",
      updateId: "Embutido",
    });
  });
});
