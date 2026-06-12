import { fireEvent, render } from "@testing-library/react-native";

import { MoreHubScreen } from "@/core/navigation/more-hub-screen";
import { AppProviders } from "@/core/providers/app-providers";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: () => ({ push: mockPush }),
}));

describe("MoreHubScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renderiza os destinos que sairam da tab bar", () => {
    const { getByTestId } = render(
      <AppProviders>
        <MoreHubScreen />
      </AppProviders>,
    );

    for (const key of ["wallet", "tools", "alerts", "profile"]) {
      expect(getByTestId(`hub-item-${key}`)).toBeTruthy();
    }
  });

  it("navega para a rota do item tocado", () => {
    const { getByTestId } = render(
      <AppProviders>
        <MoreHubScreen />
      </AppProviders>,
    );

    fireEvent.press(getByTestId("hub-item-wallet"));
    expect(mockPush).toHaveBeenCalledWith("/carteira");
  });
});
