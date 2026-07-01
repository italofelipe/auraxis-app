import { fireEvent, render } from "@testing-library/react-native";

import { MoreHubScreen } from "@/core/navigation/more-hub-screen";
import { AppProviders } from "@/core/providers/app-providers";
import {
  resetExpenseSheetStore,
  useExpenseSheetStore,
} from "@/stores/expense-sheet-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: () => ({ push: mockPush }),
}));

describe("MoreHubScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    resetExpenseSheetStore();
  });

  afterEach(() => {
    resetExpenseSheetStore();
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

  it("inclui planejamento e nova transacao como destinos deslocados do menu", () => {
    const { getByTestId } = render(
      <AppProviders>
        <MoreHubScreen />
      </AppProviders>,
    );

    expect(getByTestId("hub-item-planning")).toBeTruthy();
    expect(getByTestId("hub-item-quickTransaction")).toBeTruthy();
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

  it("abre o sheet rapido ao tocar em nova transacao", () => {
    const { getByTestId } = render(
      <AppProviders>
        <MoreHubScreen />
      </AppProviders>,
    );

    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
    fireEvent.press(getByTestId("hub-item-quickTransaction"));
    expect(useExpenseSheetStore.getState().isOpen).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
