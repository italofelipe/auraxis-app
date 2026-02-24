import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { Collapsible } from "./collapsible";

const mockIconSymbol = jest.fn((_props: unknown): null => null);

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: (props: unknown) => mockIconSymbol(props),
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}));

const mockedUseColorScheme = jest.mocked(useColorScheme);

describe("Collapsible", () => {
  beforeEach(() => {
    mockIconSymbol.mockClear();
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

  it("usa cor de icone do tema claro por padrao", () => {
    render(
      <Collapsible title="Secao">
        <Text>Conteudo interno</Text>
      </Collapsible>,
    );

    expect(mockIconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ color: Colors.light.icon }),
    );
  });

  it("usa cor de icone do tema escuro", () => {
    mockedUseColorScheme.mockReturnValue("dark");

    render(
      <Collapsible title="Secao">
        <Text>Conteudo interno</Text>
      </Collapsible>,
    );

    expect(mockIconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ color: Colors.dark.icon }),
    );
  });

  it("faz fallback para tema claro quando color scheme e nulo", () => {
    mockedUseColorScheme.mockReturnValue(null);

    render(
      <Collapsible title="Secao">
        <Text>Conteudo interno</Text>
      </Collapsible>,
    );

    expect(mockIconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ color: Colors.light.icon }),
    );
  });
});
