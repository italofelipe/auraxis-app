import { render } from "@testing-library/react-native";

import { HBars } from "@/shared/components/charts/h-bars";
import { TestProviders } from "@/shared/testing/test-providers";

const data = [
  { id: "inter", label: "Inter", color: "#FF7A00", value: 800 },
  { id: "nubank", label: "Nubank", color: "#820AD1", value: 400 },
] as const;

describe("HBars", () => {
  it("renders labels and currency-formatted values by default", () => {
    const { getByText } = render(
      <TestProviders>
        <HBars data={data} />
      </TestProviders>,
    );

    expect(getByText("Inter")).toBeTruthy();
    expect(getByText("Nubank")).toBeTruthy();
    expect(getByText("R$ 800,00")).toBeTruthy();
  });

  it("uses a custom value formatter", () => {
    const { getByText } = render(
      <TestProviders>
        <HBars data={data} formatValue={(value) => `${value} pts`} />
      </TestProviders>,
    );

    expect(getByText("800 pts")).toBeTruthy();
  });
});
