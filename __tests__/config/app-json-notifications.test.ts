import appConfig from "@/app.json";

const findPluginConfig = (
  pluginName: string,
): Record<string, unknown> | null => {
  const pluginEntry = appConfig.expo.plugins.find((entry) => {
    if (typeof entry === "string") {
      return entry === pluginName;
    }

    return Array.isArray(entry) && entry[0] === pluginName;
  });

  if (!Array.isArray(pluginEntry)) {
    return null;
  }

  const options = pluginEntry[1];
  return typeof options === "object" && options !== null
    ? options as Record<string, unknown>
    : null;
};

describe("app.json notifications native config", () => {
  it("configura expo-notifications com canal Android e entitlement APNS de producao", () => {
    const notificationsConfig = findPluginConfig("expo-notifications");

    expect(notificationsConfig).toMatchObject({
      defaultChannel: "auraxis-default",
      mode: "production",
      color: "#2F80ED",
    });
  });
});
