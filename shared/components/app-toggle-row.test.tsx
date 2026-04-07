import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";

import { AppToggleRow } from "./app-toggle-row";

describe("AppToggleRow", () => {
  it("renderiza label, descricao e dispara alteracao do switch", () => {
    const onCheckedChange = jest.fn();

    const { getByText, getByTestId } = render(
      <AppProviders>
        <AppToggleRow
          label="Notificacoes"
          description="Receber email quando houver um novo alerta"
          checked={false}
          testID="notifications"
          onCheckedChange={onCheckedChange}
        />
      </AppProviders>,
    );

    expect(getByText("Notificacoes")).toBeTruthy();
    expect(getByText("Receber email quando houver um novo alerta")).toBeTruthy();

    fireEvent(getByTestId("notifications-switch"), "onCheckedChange", true);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
