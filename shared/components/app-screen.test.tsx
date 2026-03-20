import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/components/providers/app-providers";

import { AppScreen } from "./app-screen";

describe("AppScreen", () => {
  it("renderiza conteúdo em modo scrollable", () => {
    const { getByText } = render(
      <AppProviders>
        <AppScreen>
          <Text>Conteúdo principal</Text>
        </AppScreen>
      </AppProviders>,
    );

    expect(getByText("Conteúdo principal")).toBeTruthy();
  });

  it("renderiza conteúdo em modo não scrollable", () => {
    const { getByText } = render(
      <AppProviders>
        <AppScreen scrollable={false}>
          <Text>Conteúdo fixo</Text>
        </AppScreen>
      </AppProviders>,
    );

    expect(getByText("Conteúdo fixo")).toBeTruthy();
  });
});
