import { render } from "@testing-library/react-native";

import { SevChip } from "@/features/insights/fluida/components/sev-chip";
import { TestProviders } from "@/shared/testing/test-providers";

describe("SevChip", () => {
  it("renders the 'Tudo certo' label for the ok severity", () => {
    const { getByText } = render(
      <TestProviders>
        <SevChip severity="ok" />
      </TestProviders>,
    );

    expect(getByText("Tudo certo")).toBeTruthy();
  });

  it("renders the 'Atenção' label for the attention severity", () => {
    const { getByText } = render(
      <TestProviders>
        <SevChip severity="attention" />
      </TestProviders>,
    );

    expect(getByText("Atenção")).toBeTruthy();
  });

  it("renders the 'Alerta' label and an accessible severity description", () => {
    const { getByText, getByLabelText } = render(
      <TestProviders>
        <SevChip severity="alert" />
      </TestProviders>,
    );

    expect(getByText("Alerta")).toBeTruthy();
    expect(getByLabelText("Severidade: Alerta")).toBeTruthy();
  });
});
