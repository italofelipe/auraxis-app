import * as SecureStore from "expo-secure-store";

import {
  THEME_PREFERENCE_STORAGE_KEY,
  loadPersistedThemePreference,
  persistThemePreference,
} from "@/core/shell/theme-preference-storage";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const getItemAsync = SecureStore.getItemAsync as jest.MockedFunction<
  typeof SecureStore.getItemAsync
>;
const setItemAsync = SecureStore.setItemAsync as jest.MockedFunction<
  typeof SecureStore.setItemAsync
>;

describe("theme-preference-storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna a preferência persistida quando válida", async () => {
    getItemAsync.mockResolvedValue("dark");
    await expect(loadPersistedThemePreference()).resolves.toBe("dark");
    expect(getItemAsync).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY);
  });

  it("cai no default (light) quando não há valor", async () => {
    getItemAsync.mockResolvedValue(null);
    await expect(loadPersistedThemePreference()).resolves.toBe("light");
  });

  it("cai no default quando o valor é inválido", async () => {
    getItemAsync.mockResolvedValue("rainbow");
    await expect(loadPersistedThemePreference()).resolves.toBe("light");
  });

  it("cai no default quando o storage falha na leitura", async () => {
    getItemAsync.mockRejectedValue(new Error("unavailable"));
    await expect(loadPersistedThemePreference()).resolves.toBe("light");
  });

  it("persiste a preferência escolhida", async () => {
    setItemAsync.mockResolvedValue(undefined);
    await persistThemePreference("system");
    expect(setItemAsync).toHaveBeenCalledWith(
      THEME_PREFERENCE_STORAGE_KEY,
      "system",
    );
  });

  it("não propaga erro se o storage falhar ao persistir", async () => {
    setItemAsync.mockRejectedValue(new Error("unavailable"));
    await expect(persistThemePreference("dark")).resolves.toBeUndefined();
  });
});
