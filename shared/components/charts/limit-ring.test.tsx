import { render } from "@testing-library/react-native";

import { LimitRing } from "@/shared/components/charts/limit-ring";
import { TestProviders } from "@/shared/testing/test-providers";

describe("LimitRing", () => {
  it("renders the rounded percentage and default label", () => {
    const { getByText } = render(
      <TestProviders>
        <LimitRing pct={72.4} color="#0E6376" />
      </TestProviders>,
    );

    expect(getByText("72%")).toBeTruthy();
    expect(getByText("usado")).toBeTruthy();
  });

  it("clamps an out-of-range percentage", () => {
    const { getByText } = render(
      <TestProviders>
        <LimitRing pct={140} color="#C2414D" centerLabel="limite" />
      </TestProviders>,
    );

    expect(getByText("100%")).toBeTruthy();
    expect(getByText("limite")).toBeTruthy();
  });
});
