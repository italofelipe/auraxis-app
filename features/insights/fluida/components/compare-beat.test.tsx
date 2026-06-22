import { render } from "@testing-library/react-native";

import type { InsightRetroItem } from "@/features/insights/fluida/contracts";
import { CompareBeat } from "@/features/insights/fluida/components/compare-beat";
import { formatSignedAmount } from "@/features/insights/fluida/sign";
import { TestProviders } from "@/shared/testing/test-providers";

const items: readonly InsightRetroItem[] = [
  {
    key: "yesterday",
    label: "Ontem · 20 jun",
    value: 156.3,
    sign: "neg",
    caption: "Apenas 1 lançamento (Mousepad bullpad).",
  },
  {
    key: "vs_week",
    label: "vs. semana passada",
    value: 9800,
    sign: "pos",
    caption: "A semana atual gastou ~40% a mais que a anterior.",
  },
];

describe("CompareBeat", () => {
  it("renders the 'Como se compara' kicker and one card per item", () => {
    const { getByText } = render(
      <TestProviders>
        <CompareBeat items={items} />
      </TestProviders>,
    );

    expect(getByText("Como se compara")).toBeTruthy();
    expect(getByText("Ontem · 20 jun")).toBeTruthy();
    expect(getByText("vs. semana passada")).toBeTruthy();
    expect(getByText("Apenas 1 lançamento (Mousepad bullpad).")).toBeTruthy();
  });

  it("formats each value with its sign prefix", () => {
    const { getByText } = render(
      <TestProviders>
        <CompareBeat items={items} />
      </TestProviders>,
    );

    expect(getByText(formatSignedAmount(156.3, "neg"))).toBeTruthy();
    expect(getByText(formatSignedAmount(9800, "pos"))).toBeTruthy();
  });

  it("colours the negative value with the danger token and the positive with success", () => {
    const { getByTestId } = render(
      <TestProviders>
        <CompareBeat items={items} />
      </TestProviders>,
    );

    const negValue = getByTestId("compare-value-yesterday");
    const posValue = getByTestId("compare-value-vs_week");

    const colorOf = (node: { props: { style?: unknown } }): string | undefined => {
      const entries = [node.props.style].flat() as ({ color?: string } | undefined)[];
      return entries.map((entry) => entry?.color).filter(Boolean)[0];
    };

    // Danger and success resolve to different colours; the negative card must
    // not share the positive card's colour.
    expect(colorOf(negValue)).toBeDefined();
    expect(colorOf(posValue)).toBeDefined();
    expect(colorOf(negValue)).not.toBe(colorOf(posValue));
  });

  it("renders nothing when there are no items", () => {
    const { queryByText } = render(
      <TestProviders>
        <CompareBeat items={[]} />
      </TestProviders>,
    );

    expect(queryByText("Como se compara")).toBeNull();
  });
});
