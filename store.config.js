const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_METADATA_PATH = "build/store-release/metadata.json";

const createStoreConfig = (metadata) => {
  return {
    configVersion: 0,
    apple: {
      version: metadata.version,
      info: {
        "pt-BR": {
          privacyPolicyUrl: "https://app.auraxis.com.br/privacy-policy",
          releaseNotes: metadata.releaseNotes,
          title: "Auraxis",
        },
      },
    },
  };
};

const loadStoreConfig = () => {
  const metadataPath = process.env.STORE_RELEASE_METADATA_PATH ?? DEFAULT_METADATA_PATH;
  const metadata = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), metadataPath), "utf8"));
  return createStoreConfig(metadata);
};

module.exports = loadStoreConfig;
module.exports.createStoreConfig = createStoreConfig;
