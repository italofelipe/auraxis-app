import { fireEvent, render } from "@testing-library/react-native";

import { ThemeModeToggle } from "@/features/insights/fluida/components/theme-mode-toggle";
import { TestProviders } from "@/shared/testing/test-providers";

describe("ThemeModeToggle", () => {
  it("labels the control to switch to dark while light", () => {
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <TestProviders themeName="auraxis_light">
        <ThemeModeToggle isDark={false} onToggle={onToggle} />
      </TestProviders>,
    );

    expect(getByLabelText("Mudar para tema escuro")).toBeTruthy();
  });

  it("labels the control to switch to light while dark", () => {
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <TestProviders themeName="auraxis_dark">
        <ThemeModeToggle isDark onToggle={onToggle} />
      </TestProviders>,
    );

    expect(getByLabelText("Mudar para tema claro")).toBeTruthy();
  });

  it("fires the toggle handler on press", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <TestProviders themeName="auraxis_dark">
        <ThemeModeToggle isDark onToggle={onToggle} />
      </TestProviders>,
    );

    fireEvent.press(getByTestId("insights-theme-mode-toggle"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
