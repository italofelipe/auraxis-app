import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { Paragraph } from "tamagui";

// Regressão do bug "app preto e branco" (#539/#543): os temas do Tamagui
// referenciavam tokens por string ("$brandPrimaryLight") que NUNCA eram
// resolvidos para hex — o RN recebia a referência crua e não pintava nada.
// Estes testes garantem que todo estilo tematizado resolve para cor real.

const isConcreteColor = (value: unknown): boolean =>
  typeof value === "string" && (value.startsWith("#") || value.startsWith("rgb"));

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return (style ?? {}) as Record<string, unknown>;
};

describe("resolução de tema Tamagui → estilos nativos", () => {
  it("AppButton primary resolve backgroundColor para cor concreta (não referência $token)", () => {
    const { getByRole } = render(
      <AppProviders>
        <AppButton>Entrar</AppButton>
      </AppProviders>,
    );

    const style = flattenStyle(getByRole("button").props.style);
    expect(isConcreteColor(style.backgroundColor)).toBe(true);
  });

  it("AppSurfaceCard resolve backgroundColor e borderColor para cores concretas", () => {
    const { getByTestId } = render(
      <AppProviders>
        <AppSurfaceCard testID="card" title="Resumo">
          <Paragraph>conteudo</Paragraph>
        </AppSurfaceCard>
      </AppProviders>,
    );

    const style = flattenStyle(getByTestId("card").props.style);
    expect(isConcreteColor(style.backgroundColor)).toBe(true);
    expect(
      isConcreteColor(style.borderColor ?? style.borderTopColor),
    ).toBe(true);
  });
});
