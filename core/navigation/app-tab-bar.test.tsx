import { fireEvent, render } from "@testing-library/react-native";

import { AppTabBar } from "@/core/navigation/app-tab-bar";
import { AppProviders } from "@/core/providers/app-providers";
import { resetAppShellStore } from "@/core/shell/app-shell-store";
import { resetExpenseSheetStore } from "@/stores/expense-sheet-store";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

const buildProps = (activeIndex = 0) => {
  const routes = [
    { key: "dashboard-key", name: "dashboard" },
    { key: "transacoes-key", name: "transacoes" },
    { key: "insights-key", name: "insights" },
    { key: "cartoes-key", name: "cartoes" },
    { key: "mais-key", name: "mais" },
  ];
  const navigate = jest.fn();
  return {
    props: {
      state: { index: activeIndex, routes },
      navigation: { navigate },
      descriptors: {},
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    } as unknown as Parameters<typeof AppTabBar>[0],
    navigate,
  };
};

describe("AppTabBar", () => {
  afterEach(() => {
    resetAppShellStore();
    resetExpenseSheetStore();
  });

  it("renderiza os cinco destinos do handoff sem botao central", () => {
    const { props } = buildProps();
    const { getByTestId, queryByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    expect(getByTestId("tab-dashboard")).toBeTruthy();
    expect(getByTestId("tab-transacoes")).toBeTruthy();
    expect(getByTestId("tab-insights")).toBeTruthy();
    expect(getByTestId("tab-cartoes")).toBeTruthy();
    expect(getByTestId("tab-mais")).toBeTruthy();
    expect(queryByTestId("tour-fab")).toBeNull();
  });

  it("navega ao tocar numa tab nao focada e ignora a tab ja ativa", () => {
    const { props, navigate } = buildProps(0);
    const { getByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    fireEvent.press(getByTestId("tab-cartoes"));
    expect(navigate).toHaveBeenCalledWith("cartoes");

    fireEvent.press(getByTestId("tab-dashboard"));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("renderiza o blob liquido com o icone da aba ativa", () => {
    const { props } = buildProps(0);
    const { getByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    expect(getByTestId("tab-liquid-blob")).toBeTruthy();
    expect(getByTestId("tab-liquid-blob-icon").props.accessibilityLabel).toBe(
      "Ícone ativo view-dashboard-outline",
    );
  });

  it("renderiza com reduced motion ativo sem quebrar a navegacao", () => {
    resetAppShellStore({ reducedMotionEnabled: true });
    const { props, navigate } = buildProps(1);
    const { getByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    expect(getByTestId("tab-liquid-blob")).toBeTruthy();
    fireEvent.press(getByTestId("tab-dashboard"));
    expect(navigate).toHaveBeenCalledWith("dashboard");
  });
});
