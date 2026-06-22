import { render } from "@testing-library/react-native";

import { BeatKicker } from "@/features/insights/fluida/components/beat-kicker";
import { TestProviders } from "@/shared/testing/test-providers";

describe("BeatKicker", () => {
  it("renders the kicker label in uppercase-friendly copy", () => {
    const { getByText } = render(
      <TestProviders>
        <BeatKicker icon="clock-outline" label="Como se compara" />
      </TestProviders>,
    );

    expect(getByText("Como se compara")).toBeTruthy();
  });

  it("exposes a stable test id for the beat header", () => {
    const { getByTestId } = render(
      <TestProviders>
        <BeatKicker icon="chart-bar" label="O ritmo de saídas" testID="kicker" />
      </TestProviders>,
    );

    expect(getByTestId("kicker")).toBeTruthy();
  });
});
