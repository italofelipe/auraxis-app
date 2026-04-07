import { renderHook, waitFor } from "@testing-library/react-native";
import { useFonts } from "expo-font";

import { initSentry } from "@/app/services/sentry";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useAppStartup } from "@/core/shell/use-app-startup";

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

jest.mock("@/app/services/sentry", () => ({
  initSentry: jest.fn(),
}));

describe("useAppStartup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppShellStore.setState({
      fontsReady: false,
      reducedMotionEnabled: false,
    });
  });

  it("marca a app como pronta e inicializa o sentry no startup", async () => {
    (useFonts as jest.Mock).mockReturnValue([true]);

    const { result } = renderHook(() => useAppStartup());

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
      expect(useAppShellStore.getState().fontsReady).toBe(true);
      expect(initSentry).toHaveBeenCalled();
    });
  });
});
