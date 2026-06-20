import { fireEvent, render } from "@testing-library/react-native";

import { AreaLineChart } from "@/shared/components/charts/area-line-chart";
import { TestProviders } from "@/shared/testing/test-providers";

const points = [
  { label: "JAN", value: 1200 },
  { label: "FEV", value: 1800 },
  { label: "MAR", value: 1500 },
] as const;

describe("AreaLineChart", () => {
  it("renders the x-axis labels", () => {
    const { getByText } = render(
      <TestProviders>
        <AreaLineChart points={points} color="#0E6376" currentIndex={1} />
      </TestProviders>,
    );

    expect(getByText("JAN")).toBeTruthy();
    expect(getByText("FEV")).toBeTruthy();
    expect(getByText("MAR")).toBeTruthy();
  });

  it("invokes onSelectPoint when a point is pressed", () => {
    const onSelectPoint = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <TestProviders>
        <AreaLineChart
          points={points}
          color="#0E6376"
          onSelectPoint={onSelectPoint}
        />
      </TestProviders>,
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Circle } = require("react-native-svg");
    const circles = UNSAFE_getAllByType(Circle);
    fireEvent.press(circles[0]);

    expect(onSelectPoint).toHaveBeenCalledWith(0);
  });

  it("renders without crashing for empty points", () => {
    const { getByTestId } = render(
      <TestProviders>
        <AreaLineChart points={[]} color="#0E6376" testID="area" />
      </TestProviders>,
    );

    expect(getByTestId("area")).toBeTruthy();
  });
});
