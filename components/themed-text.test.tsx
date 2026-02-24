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

  it("renderiza com estilo title quando type=title", () => {
    const { getByText } = render(<ThemedText type="title">Title</ThemedText>);

    expect(getByText("Title")).toHaveStyle({
      color: "#123456",
      fontSize: 32,
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
