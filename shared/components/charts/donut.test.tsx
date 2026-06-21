import { render } from "@testing-library/react-native";

import { Donut } from "@/shared/components/charts/donut";
import { TestProviders } from "@/shared/testing/test-providers";

const data = [
  { id: "food", label: "Alimentação", color: "#0E6376", total: 600 },
  { id: "transport", label: "Transporte", color: "#2E7CF6", total: 300 },
  { id: "leisure", label: "Lazer", color: "#9B5DE5", total: 100 },
] as const;

describe("Donut", () => {
  it("renders the centre labels", () => {
    const { getByText } = render(
      <TestProviders>
        <Donut data={data} centerTop="JUN" centerValue="R$ 11,9k" />
      </TestProviders>,
    );

    expect(getByText("JUN")).toBeTruthy();
    expect(getByText("R$ 11,9k")).toBeTruthy();
  });

  it("renders without crashing for empty data", () => {
    const { getByTestId } = render(
      <TestProviders>
        <Donut data={[]} testID="donut" />
      </TestProviders>,
    );

    expect(getByTestId("donut")).toBeTruthy();
  });
});
