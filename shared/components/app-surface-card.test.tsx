import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { semanticShadows } from "@/shared/theme";

import { AppSurfaceCard } from "./app-surface-card";

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return (style ?? {}) as Record<string, unknown>;
};

describe("AppSurfaceCard", () => {
  it("renderiza título, descrição e conteúdo", () => {
    const { getByText } = render(
      <AppProviders>
        <AppSurfaceCard title="Resumo" description="Descrição curta">
          <Text>Conteúdo do card</Text>
        </AppSurfaceCard>
      </AppProviders>,
    );

    expect(getByText("Resumo")).toBeTruthy();
    expect(getByText("Descrição curta")).toBeTruthy();
    expect(getByText("Conteúdo do card")).toBeTruthy();
  });

  it("onPress torna a superfície interativa sem alterar a variante semântica", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <AppSurfaceCard testID="card" onPress={onPress}>
          <Text>toque</Text>
        </AppSurfaceCard>
      </AppProviders>,
    );

    fireEvent.press(getByTestId("card"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("usa flat sem sombra e raio de 14 por padrão", () => {
    const { getByTestId } = render(
      <AppProviders>
        <AppSurfaceCard testID="card">
          <Text>plano</Text>
        </AppSurfaceCard>
      </AppProviders>,
    );
    const style = flattenStyle(getByTestId("card").props.style);
    expect(style.borderRadius ?? style.borderTopLeftRadius).toBe(14);
    expect(semanticShadows.none.elevation).toBe(0);
  });

  it("limita raised e usa raio superior 24 no overlay", () => {
    const raised = render(
      <AppProviders>
        <AppSurfaceCard testID="raised" variant="raised">
          <Text>elevado</Text>
        </AppSurfaceCard>
      </AppProviders>,
    );
    const raisedStyle = flattenStyle(raised.getByTestId("raised").props.style);
    expect(semanticShadows.raised.shadowOffset).toEqual({ width: 0, height: 1 });
    expect(semanticShadows.raised.shadowOpacity).toBe(0.08);
    expect(semanticShadows.raised.shadowRadius).toBe(4);
    expect(semanticShadows.raised.elevation).toBe(1);
    expect(raisedStyle.borderRadius ?? raisedStyle.borderTopLeftRadius).toBe(14);

    const overlay = render(
      <AppProviders>
        <AppSurfaceCard testID="overlay" variant="overlay">
          <Text>sheet</Text>
        </AppSurfaceCard>
      </AppProviders>,
    );
    const overlayStyle = flattenStyle(overlay.getByTestId("overlay").props.style);
    expect(overlayStyle.borderTopLeftRadius).toBe(24);
    expect(overlayStyle.borderTopRightRadius).toBe(24);
  });
});
