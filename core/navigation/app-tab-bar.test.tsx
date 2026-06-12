import { fireEvent, render } from "@testing-library/react-native";

import { AppTabBar } from "@/core/navigation/app-tab-bar";
import { AppProviders } from "@/core/providers/app-providers";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

const buildProps = (activeIndex = 0) => {
  const routes = [
    { key: "dashboard-key", name: "dashboard" },
    { key: "transacoes-key", name: "transacoes" },
    { key: "planejamento-key", name: "planejamento" },
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
  it("renderiza os quatro destinos e o botao central de acao rapida", () => {
    const { props } = buildProps();
    const { getByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    expect(getByTestId("tab-dashboard")).toBeTruthy();
    expect(getByTestId("tab-transacoes")).toBeTruthy();
    expect(getByTestId("tab-planejamento")).toBeTruthy();
    expect(getByTestId("tab-mais")).toBeTruthy();
    expect(getByTestId("tab-quick-actions")).toBeTruthy();
  });

  it("navega ao tocar numa tab nao focada e ignora a tab ja ativa", () => {
    const { props, navigate } = buildProps(0);
    const { getByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    fireEvent.press(getByTestId("tab-transacoes"));
    expect(navigate).toHaveBeenCalledWith("transacoes");

    fireEvent.press(getByTestId("tab-dashboard"));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("abre o sheet de acao rapida e navega para criar transacao", () => {
    const { props, navigate } = buildProps();
    const { getByTestId } = render(
      <AppProviders>
        <AppTabBar {...props} />
      </AppProviders>,
    );

    fireEvent.press(getByTestId("tab-quick-actions"));
    fireEvent.press(getByTestId("quick-action-create"));

    expect(navigate).toHaveBeenCalledWith("transacoes", { intent: "create" });
  });
});
