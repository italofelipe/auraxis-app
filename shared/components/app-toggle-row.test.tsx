import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { triggerHapticImpact } from "@/shared/feedback/haptics";

import { AppToggleRow } from "./app-toggle-row";

jest.mock("@/shared/feedback/haptics", () => ({
  triggerHapticImpact: jest.fn(),
}));

const triggerHapticImpactMock = triggerHapticImpact as jest.MockedFunction<
  typeof triggerHapticImpact
>;

describe("AppToggleRow", () => {
  beforeEach(() => {
    triggerHapticImpactMock.mockClear();
  });

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

  it("dispara haptic light em cada alteracao do switch", () => {
    const onCheckedChange = jest.fn();

    const { getByTestId } = render(
      <AppProviders>
        <AppToggleRow
          label="Bloqueio biometrico"
          checked={false}
          testID="biometric"
          onCheckedChange={onCheckedChange}
        />
      </AppProviders>,
    );

    fireEvent(getByTestId("biometric-switch"), "onCheckedChange", true);
    fireEvent(getByTestId("biometric-switch"), "onCheckedChange", false);

    expect(triggerHapticImpactMock).toHaveBeenCalledTimes(2);
    expect(triggerHapticImpactMock).toHaveBeenCalledWith("light");
  });
});
