import { render } from "@testing-library/react-native";

import { TextBeat } from "@/features/insights/fluida/components/text-beat";
import { TestProviders } from "@/shared/testing/test-providers";

const paragraph =
  "O lançamento de ontem é pequeno e pontual — um mousepad em Eletrônicos.";

describe("TextBeat", () => {
  it("renders the paragraph text", () => {
    const { getByText } = render(
      <TestProviders>
        <TextBeat>{paragraph}</TextBeat>
      </TestProviders>,
    );

    expect(getByText(/mousepad em Eletrônicos/)).toBeTruthy();
  });

  it("renders a serif drop cap of the first letter when dropCap is set", () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <TextBeat dropCap>{paragraph}</TextBeat>
      </TestProviders>,
    );

    const cap = getByTestId("text-beat-dropcap");
    expect(cap).toHaveTextContent("O");

    const style = [cap.props.style].flat();
    const fontFamilies = style
      .map((entry: { fontFamily?: string } | undefined) => entry?.fontFamily)
      .filter(Boolean);
    expect(fontFamilies).toContain("Newsreader_600SemiBold");

    // The remaining text keeps the rest of the paragraph (sans the drop cap).
    expect(getByText(/lançamento de ontem/)).toBeTruthy();
  });

  it("does not render a drop cap by default", () => {
    const { queryByTestId } = render(
      <TestProviders>
        <TextBeat>{paragraph}</TextBeat>
      </TestProviders>,
    );

    expect(queryByTestId("text-beat-dropcap")).toBeNull();
  });
});
