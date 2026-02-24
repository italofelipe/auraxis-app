import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { Collapsible } from "./collapsible";

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}));

const mockedUseColorScheme = jest.mocked(useColorScheme);

describe("Collapsible", () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReset();
    mockedUseColorScheme.mockReturnValue("light");
  });

  it("alterna conteúdo ao pressionar o cabeçalho", () => {
    const { getByText, queryByText } = render(
      <Collapsible title="Secao">
        <Text>Conteudo interno</Text>
      </Collapsible>,
    );

    expect(queryByText("Conteudo interno")).toBeNull();

    fireEvent.press(getByText("Secao"));
    expect(getByText("Conteudo interno")).toBeTruthy();

    fireEvent.press(getByText("Secao"));
    expect(queryByText("Conteudo interno")).toBeNull();
  });
});
