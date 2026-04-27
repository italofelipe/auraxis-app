import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";
import { initI18n } from "@/shared/i18n";

import { LanguageSection } from "./language-section";

describe("LanguageSection", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    resetAppShellStore();
  });

  it("troca para EN e persiste no store", async () => {
    const { getByText } = render(
      <AppProviders>
        <LanguageSection />
      </AppProviders>,
    );

    fireEvent.press(getByText("English"));

    await waitFor(() => {
      expect(useAppShellStore.getState().locale).toBe("en");
    });
  });
});
