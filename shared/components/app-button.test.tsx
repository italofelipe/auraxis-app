import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { lightSemanticColors } from "@/shared/theme";

import { AppButton } from "./app-button";

jest.mock("@/shared/feedback/haptics", () => ({
  triggerHapticImpact: jest.fn(),
}));

const triggerHapticImpactMock = triggerHapticImpact as jest.MockedFunction<
  typeof triggerHapticImpact
>;

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return (style ?? {}) as Record<string, unknown>;
};

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

  it("aplica altura explícita por tamanho (corrige o 'texto sufocado')", () => {
    const md = render(
      <AppProviders>
        <AppButton>md</AppButton>
      </AppProviders>,
    );
    expect(flattenStyle(md.getByRole("button").props.style).height).toBe(48);

    const lg = render(
      <AppProviders>
        <AppButton size="lg">lg</AppButton>
      </AppProviders>,
    );
    expect(flattenStyle(lg.getByRole("button").props.style).height).toBe(56);

    const sm = render(
      <AppProviders>
        <AppButton size="sm">sm</AppButton>
      </AppProviders>,
    );
    expect(flattenStyle(sm.getByRole("button").props.style).height).toBe(40);
  });

  it("glow aplica sombra colorida de marca (não a sombra preta)", () => {
    const { getByRole } = render(
      <AppProviders>
        <AppButton glow>Assinar</AppButton>
      </AppProviders>,
    );

    const style = flattenStyle(getByRole("button").props.style);
    // O glow brand usa shadowRadius 22 (token) e a cor primária; o Tamagui
    // normaliza o hex para rgb, então comparamos pelos canais, não pela string.
    expect(style.shadowRadius).toBe(22);
    const shadow = String(style.shadowColor).replace(/\s/g, "");
    expect(shadow).not.toContain("0,0,0");
    expect(shadow.includes("8,127,167") || shadow === lightSemanticColors.primary.toLowerCase()).toBe(true);
  });
});
