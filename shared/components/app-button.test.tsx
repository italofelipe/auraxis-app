import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { triggerHapticImpact } from "@/shared/feedback/haptics";

import { AppButton } from "./app-button";

jest.mock("@/shared/feedback/haptics", () => ({
  triggerHapticImpact: jest.fn(),
}));

const triggerHapticImpactMock = triggerHapticImpact as jest.MockedFunction<
  typeof triggerHapticImpact
>;

describe("AppButton", () => {
  beforeEach(() => {
    triggerHapticImpactMock.mockClear();
  });

  it("dispara onPress no tone primário", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <AppButton onPress={onPress}>Confirmar</AppButton>
      </AppProviders>,
    );

    fireEvent.press(getByText("Confirmar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renderiza o tone secundário", () => {
    const { getByText } = render(
      <AppProviders>
        <AppButton tone="secondary">Cancelar</AppButton>
      </AppProviders>,
    );

    expect(getByText("Cancelar")).toBeTruthy();
  });

  it("dispara haptic light por default no tone primário em pressIn", () => {
    const { getByText } = render(
      <AppProviders>
        <AppButton>Confirmar</AppButton>
      </AppProviders>,
    );

    fireEvent(getByText("Confirmar"), "pressIn");
    expect(triggerHapticImpactMock).toHaveBeenCalledWith("light");
  });

  it("não dispara haptic por default no tone secundário", () => {
    const { getByText } = render(
      <AppProviders>
        <AppButton tone="secondary">Cancelar</AppButton>
      </AppProviders>,
    );

    fireEvent(getByText("Cancelar"), "pressIn");
    expect(triggerHapticImpactMock).toHaveBeenCalledWith("none");
  });

  it("respeita hapticTone customizado", () => {
    const { getByText } = render(
      <AppProviders>
        <AppButton hapticTone="heavy">Apagar</AppButton>
      </AppProviders>,
    );

    fireEvent(getByText("Apagar"), "pressIn");
    expect(triggerHapticImpactMock).toHaveBeenCalledWith("heavy");
  });

  it("preserva onPressIn fornecido pelo caller", () => {
    const onPressIn = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <AppButton onPressIn={onPressIn}>Confirmar</AppButton>
      </AppProviders>,
    );

    fireEvent(getByText("Confirmar"), "pressIn");
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(triggerHapticImpactMock).toHaveBeenCalledWith("light");
  });
});
