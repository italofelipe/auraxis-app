import { render } from "@testing-library/react-native";

import { ReadTime } from "@/features/insights/fluida/components/read-time";
import { TestProviders } from "@/shared/testing/test-providers";

describe("ReadTime", () => {
  it("formats whole minutes as '{n} min de leitura'", () => {
    const { getByText } = render(
      <TestProviders>
        <ReadTime readMinutes={15} />
      </TestProviders>,
    );

    expect(getByText("15 min de leitura")).toBeTruthy();
  });

  it("clamps invalid reading times to the 1-minute floor", () => {
    const { getByText } = render(
      <TestProviders>
        <ReadTime readMinutes={0} />
      </TestProviders>,
    );

    expect(getByText("1 min de leitura")).toBeTruthy();
  });
});
