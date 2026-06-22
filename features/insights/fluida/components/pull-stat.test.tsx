import { render } from "@testing-library/react-native";

import type { InsightHighlight } from "@/features/insights/fluida/contracts";
import { PullStat } from "@/features/insights/fluida/components/pull-stat";
import { TestProviders } from "@/shared/testing/test-providers";

const highlight: InsightHighlight = {
  label: "Peso da Fatura Maio",
  value: "55%",
  sub: "de todas as despesas do mês",
};

describe("PullStat", () => {
  it("renders the label, the big value and the sub-caption", () => {
    const { getByText, getByTestId } = render(
      <TestProviders>
        <PullStat highlight={highlight} />
      </TestProviders>,
    );

    expect(getByText("Peso da Fatura Maio")).toBeTruthy();
    expect(getByTestId("pull-stat-value")).toHaveTextContent("55%");
    expect(getByText("de todas as despesas do mês")).toBeTruthy();
  });

  it("renders the value in the mono (IBM Plex Mono) face with tabular figures", () => {
    const { getByTestId } = render(
      <TestProviders>
        <PullStat highlight={highlight} />
      </TestProviders>,
    );

    const value = getByTestId("pull-stat-value");
    const style = [value.props.style].flat();
    const fontFamilies = style
      .map((entry: { fontFamily?: string } | undefined) => entry?.fontFamily)
      .filter((family): family is string => Boolean(family));
    const fontVariants = style
      .flatMap((entry: { fontVariant?: readonly string[] } | undefined) =>
        entry?.fontVariant ?? [],
      );

    // The mono face resolves to an IBM Plex Mono weight (the SemiBold cut at
    // weight 600), so assert the family rather than a specific cut.
    expect(fontFamilies.some((family: string) => family.startsWith("IBMPlexMono"))).toBe(
      true,
    );
    expect(fontVariants).toContain("tabular-nums");
  });
});
