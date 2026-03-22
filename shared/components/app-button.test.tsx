import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/components/providers/app-providers";

import { AppButton } from "./app-button";

describe("AppButton", () => {
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
});
