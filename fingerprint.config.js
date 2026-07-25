const { SourceSkips } = require("expo/fingerprint");

/**
 * O worker do EAS recalcula o runtime version DEPOIS de `expo prebuild` +
 * `pod install` (fases PREBUILD/INSTALL_PODS), enquanto o runner calcula na
 * árvore CNG. Sem estas exclusões o hash diverge e o build morre na fase
 * Configure expo-updates ("Runtime version calculated on local machine not
 * equal to runtime version calculated during build"). Diff observado no build
 * 0789e360 (2026-07-25):
 *
 * - `ios/` entra como bareNativeDir só no worker (gerado pelo prebuild);
 * - o prebuild reescreve `package.json` scripts (`expo start` → `expo run`);
 * - `extra.gitCommit` (app.config.js) resolve de env vars que só existem em
 *   um dos lados (GITHUB_SHA no runner, EAS_BUILD_GIT_COMMIT_HASH no worker);
 * - pod install (codegen/prepare_command) escreve dentro dos pacotes nativos
 *   com codegenConfig, mudando o hash rncoreAutolinkingIos deles.
 *
 * A identidade/versão das libs ignoradas continua coberta pelas fontes de
 * autolinking config e pelo package-lock; apenas o conteúdo mutável em
 * node_modules sai do cálculo.
 *
 * @type {import('expo/fingerprint').Config}
 */
const config = {
  sourceSkips:
    SourceSkips.ExpoConfigExtraSection | SourceSkips.PackageJsonScriptsAll,
  ignorePaths: [
    "ios",
    "ios/**",
    "android",
    "android/**",
    "node_modules/react-native-reanimated/**",
    "node_modules/react-native-safe-area-context/**",
    "node_modules/react-native-screens/**",
    "node_modules/react-native-svg/**",
    "node_modules/react-native-worklets/**",
  ],
};

module.exports = config;
