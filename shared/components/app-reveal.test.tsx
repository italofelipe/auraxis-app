import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { AppReveal } from "@/shared/components/app-reveal";

describe("AppReveal", () => {
  it("renderiza o conteúdo e expõe o testID", () => {
    const { getByText, getByTestId } = render(
      <AppProviders>
        <AppReveal index={2} testID="reveal">
          <Text>conteúdo revelado</Text>
        </AppReveal>
      </AppProviders>,
    );

    expect(getByText("conteúdo revelado")).toBeTruthy();
    expect(getByTestId("reveal")).toBeTruthy();
  });
});
