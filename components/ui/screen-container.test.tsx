import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/components/providers/app-providers";

import { ScreenContainer } from "./screen-container";

describe("ScreenContainer", () => {
  it("renderiza conteudo usando o wrapper canonico", () => {
    const { getByText } = render(
      <AppProviders>
        <ScreenContainer>
          <Text>Compatibilidade Tamagui</Text>
        </ScreenContainer>
      </AppProviders>,
    );

    expect(getByText("Compatibilidade Tamagui")).toBeTruthy();
  });
});
