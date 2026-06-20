import { render } from "@testing-library/react-native";

import { Meter } from "@/shared/components/charts/meter";
import { TestProviders } from "@/shared/testing/test-providers";

describe("Meter", () => {
  it("renders without crashing", () => {
    const { getByTestId } = render(
      <TestProviders>
        <Meter pct={45} testID="meter" />
      </TestProviders>,
    );

    expect(getByTestId("meter")).toBeTruthy();
  });

  it("renders with a caller-provided danger colour and clamped pct", () => {
    const { getByTestId } = render(
      <TestProviders>
        <Meter pct={130} color="#C2414D" testID="meter-danger" />
      </TestProviders>,
    );

    expect(getByTestId("meter-danger")).toBeTruthy();
  });
});
