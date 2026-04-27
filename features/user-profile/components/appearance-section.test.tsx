import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";
import { initI18n } from "@/shared/i18n";

import { AppearanceSection } from "./appearance-section";

describe("AppearanceSection", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    resetAppShellStore();
  });

  it("seleciona dark e atualiza o store", () => {
    const { getByText } = render(
      <AppProviders>
        <AppearanceSection />
      </AppProviders>,
    );

    fireEvent.press(getByText("Escuro"));
    expect(useAppShellStore.getState().themePreference).toBe("dark");
  });

  it("renderiza as 3 opcoes traduzidas", () => {
    const { getByText } = render(
      <AppProviders>
        <AppearanceSection />
      </AppProviders>,
    );

    expect(getByText("Seguir sistema")).toBeTruthy();
    expect(getByText("Claro")).toBeTruthy();
    expect(getByText("Escuro")).toBeTruthy();
  });
});
