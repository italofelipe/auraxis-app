import { render } from "@testing-library/react-native";

import type { InsightLeadVM } from "@/features/insights/fluida/contracts";
import { InsightLead } from "@/features/insights/fluida/components/insight-lead";
import { TestProviders } from "@/shared/testing/test-providers";

const buildLead = (override: Partial<InsightLeadVM> = {}): InsightLeadVM => ({
  dimension: "transactions",
  cadence: "daily",
  severity: "ok",
  title: "Dia leve, mas dentro de um mês concentrado",
  lead: "Ontem houve só uma compra pequena.",
  readMinutes: 3,
  ...override,
});

describe("InsightLead", () => {
  it("renders the kicker (dimension label), headline and opening paragraph", () => {
    const { getByText, getByTestId } = render(
      <TestProviders>
        <InsightLead lead={buildLead()} />
      </TestProviders>,
    );

    expect(getByText("Transacoes")).toBeTruthy();
    expect(getByTestId("insight-lead-headline")).toHaveTextContent(
      "Dia leve, mas dentro de um mês concentrado",
    );
    expect(getByText("Ontem houve só uma compra pequena.")).toBeTruthy();
  });

  it("renders the severity chip and the reading-time badge from the VM", () => {
    const { getByText } = render(
      <TestProviders>
        <InsightLead lead={buildLead({ severity: "alert", readMinutes: 5 })} />
      </TestProviders>,
    );

    expect(getByText("Alerta")).toBeTruthy();
    expect(getByText("5 min de leitura")).toBeTruthy();
  });

  it("renders the headline in the serif font face", () => {
    const { getByTestId } = render(
      <TestProviders>
        <InsightLead lead={buildLead()} />
      </TestProviders>,
    );

    const headline = getByTestId("insight-lead-headline");
    const flattened = headline.props.style
      ? [headline.props.style].flat()
      : [];
    const fontFamilies = flattened
      .map((entry: { fontFamily?: string } | undefined) => entry?.fontFamily)
      .filter(Boolean);

    expect(fontFamilies).toContain("Newsreader_600SemiBold");
  });
});
