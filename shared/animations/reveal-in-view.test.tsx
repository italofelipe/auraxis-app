import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { resetAppShellStore } from "@/core/shell/app-shell-store";

import { RevealInView } from "./reveal-in-view";

describe("RevealInView", () => {
  beforeEach(() => {
    resetAppShellStore();
  });

  it("renderiza o conteúdo filho", () => {
    const { getByText } = render(
      <RevealInView index={0}>
        <Text>conteúdo do reveal</Text>
      </RevealInView>,
    );

    expect(getByText("conteúdo do reveal")).toBeTruthy();
  });

  it("expõe o testID para asserção nas telas hospedeiras", () => {
    const { getByTestId } = render(
      <RevealInView index={3} testID="reveal-secao">
        <Text>x</Text>
      </RevealInView>,
    );

    expect(getByTestId("reveal-secao")).toBeTruthy();
  });
});
