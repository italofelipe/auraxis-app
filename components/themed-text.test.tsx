import { render } from "@testing-library/react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

import { ThemedText } from "./themed-text";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: jest.fn(),
}));

const mockedUseThemeColor = jest.mocked(useThemeColor);

describe("ThemedText", () => {
  beforeEach(() => {
    mockedUseThemeColor.mockReset();
    mockedUseThemeColor.mockReturnValue("#123456");
  });

  it("renderiza com estilo default quando type nao e informado", () => {
    const { getByText } = render(<ThemedText>Default</ThemedText>);

    expect(getByText("Default")).toHaveStyle({
      color: "#123456",
      fontSize: 16,
      lineHeight: 24,
    });
  });

  it("renderiza com estilo title quando type=title", () => {
    const { getByText } = render(<ThemedText type="title">Title</ThemedText>);

    expect(getByText("Title")).toHaveStyle({
      color: "#123456",
      fontSize: 32,
      fontWeight: "bold",
    });
  });

  it("renderiza com estilo defaultSemiBold quando type=defaultSemiBold", () => {
    const { getByText } = render(
      <ThemedText type="defaultSemiBold">SemiBold</ThemedText>,
    );

    expect(getByText("SemiBold")).toHaveStyle({
      color: "#123456",
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600",
    });
  });

  it("renderiza com estilo subtitle quando type=subtitle", () => {
    const { getByText } = render(<ThemedText type="subtitle">Subtitle</ThemedText>);

    expect(getByText("Subtitle")).toHaveStyle({
      color: "#123456",
      fontSize: 20,
      fontWeight: "bold",
    });
  });

  it("renderiza com estilo link quando type=link", () => {
    const { getByText } = render(<ThemedText type="link">Link</ThemedText>);

    expect(getByText("Link")).toHaveStyle({
      color: "#0a7ea4",
      lineHeight: 30,
      fontSize: 16,
    });
  });
});
