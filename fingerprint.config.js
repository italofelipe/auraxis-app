const { SourceSkips } = require("expo/fingerprint");

/**
 * A seção `extra` do expo config carrega `gitCommit`, resolvido de env vars
 * que só existem em um dos lados do build EAS (GITHUB_SHA no runner,
 * EAS_BUILD_GIT_COMMIT_HASH no worker). Sem este skip, o runtime version por
 * fingerprint divergiria entre a máquina local e o worker, derrubando o build
 * na fase Configure expo-updates.
 *
 * @type {import('expo/fingerprint').Config}
 */
const config = {
  sourceSkips: SourceSkips.ExpoConfigExtraSection,
};

module.exports = config;
