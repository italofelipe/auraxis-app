module.exports = ({ config }) => {
  const gitCommit =
    process.env.EAS_BUILD_GIT_COMMIT_HASH ??
    process.env.GITHUB_SHA ??
    process.env.EXPO_PUBLIC_GIT_COMMIT ??
    "development";

  return {
    ...config,
    extra: {
      ...config.extra,
      gitCommit,
    },
  };
};
