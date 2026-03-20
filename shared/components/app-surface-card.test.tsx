import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/components/providers/app-providers";

import { AppSurfaceCard } from "./app-surface-card";

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
});
