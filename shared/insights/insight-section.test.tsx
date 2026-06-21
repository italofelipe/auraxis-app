import { fireEvent, render } from "@testing-library/react-native";

import type { InsightSectionVM } from "@/shared/insights/insight-section-contracts";
import { InsightSection } from "@/shared/insights/insight-section";
import { TestProviders } from "@/shared/testing/test-providers";

const buildVM = (override: Partial<InsightSectionVM> = {}): InsightSectionVM => ({
  dimension: "transactions",
  severity: "attention",
  title: "Dia leve, mês concentrado",
  lead: "Ontem houve só uma compra pequena, mas a fatura pesa.",
  highlights: [
    { label: "Maior gasto do mês", value: "R$ 11.000,00", sub: "Fatura Maio" },
    { label: "Único crédito", value: "R$ 27.675,37", sub: "Salário · 30/06" },
  ],
  ...override,
});

const renderSection = (
  vm: InsightSectionVM | null,
  onReadFull = jest.fn(),
): ReturnType<typeof render> =>
  render(
    <TestProviders>
      <InsightSection vm={vm} onReadFull={onReadFull} />
    </TestProviders>,
  );

describe("InsightSection", () => {
  it("renders nothing when the VM is null (flag OFF)", () => {
    const { queryByTestId } = renderSection(null);

    expect(queryByTestId("insight-section")).toBeNull();
  });

  it("renders the compact lead: severity chip and headline", () => {
    const { getByTestId, getByText } = renderSection(buildVM());

    expect(getByTestId("insight-section")).toBeTruthy();
    expect(getByText("Atenção")).toBeTruthy();
    expect(getByText("Dia leve, mês concentrado")).toBeTruthy();
  });

  it("renders the highlights of the recorte", () => {
    const { getByText } = renderSection(buildVM());

    expect(getByText("Maior gasto do mês")).toBeTruthy();
    expect(getByText("R$ 11.000,00")).toBeTruthy();
    expect(getByText("Único crédito")).toBeTruthy();
  });

  it("renders the 'ler na íntegra' CTA and fires onReadFull when pressed", () => {
    const onReadFull = jest.fn();
    const { getByTestId } = renderSection(buildVM(), onReadFull);

    fireEvent.press(getByTestId("insight-section-read-full"));

    expect(onReadFull).toHaveBeenCalledTimes(1);
  });

  it("renders the lead paragraph and stays compact without highlights", () => {
    const { getByText, queryByTestId } = renderSection(
      buildVM({ highlights: [] }),
    );

    expect(
      getByText("Ontem houve só uma compra pequena, mas a fatura pesa."),
    ).toBeTruthy();
    expect(queryByTestId("insight-section-read-full")).toBeTruthy();
  });

  it("labels the section with an accessible severity for each level", () => {
    const { getByText } = renderSection(buildVM({ severity: "alert" }));

    expect(getByText("Alerta")).toBeTruthy();
  });
});
