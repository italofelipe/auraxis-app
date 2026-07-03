import { render } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplash } from "@/core/shell/animated-splash";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { SPLASH_WORDMARK } from "@/core/shell/splash-scene";

jest.mock("expo-splash-screen", () => ({
  hideAsync: jest.fn().mockResolvedValue(undefined),
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
}));

describe("AnimatedSplash", () => {
  beforeEach(() => {
    useAppShellStore.setState({
      reducedMotionEnabled: false,
      themePreference: "light",
    });
  });

  it("encena a marca (aura, logo e wordmark) enquanto visivel", () => {
    const { getByTestId } = render(<AnimatedSplash startupReady={false} />);

    expect(getByTestId("animated-splash")).toBeTruthy();
    expect(getByTestId("splash-aura")).toBeTruthy();
    expect(getByTestId("splash-logo")).toBeTruthy();

    const wordmark = getByTestId("splash-wordmark");
    // Uma letra (Animated.Text) por caractere da marca.
    expect(wordmark.children).toHaveLength(SPLASH_WORDMARK.length);
  });

  it("renderiza a cena em repouso com reduced motion", () => {
    useAppShellStore.setState({ reducedMotionEnabled: true });

    const { getByTestId } = render(<AnimatedSplash startupReady={false} />);

    expect(getByTestId("animated-splash")).toBeTruthy();
    expect(getByTestId("splash-logo")).toBeTruthy();
    expect(getByTestId("splash-wordmark")).toBeTruthy();
  });

  it("aciona o hide do splash nativo ao montar", () => {
    render(<AnimatedSplash startupReady={false} />);
    expect(SplashScreen.hideAsync as jest.Mock).toHaveBeenCalled();
  });
});
