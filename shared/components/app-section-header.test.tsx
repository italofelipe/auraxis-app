import { render } from "@testing-library/react-native";
import { Paragraph } from "tamagui";

import { AppSectionHeader } from "@/shared/components/app-section-header";
import { TestProviders } from "@/shared/testing/test-providers";

describe("AppSectionHeader", () => {
  it("renderiza titulo e descricao", () => {
    const { getByText } = render(
      <TestProviders>
        <AppSectionHeader
          title="Resumo"
          description="Visao geral do periodo"
        />
      </TestProviders>,
    );

    expect(getByText("Resumo")).toBeTruthy();
    expect(getByText("Visao geral do periodo")).toBeTruthy();
  });

  it("renderiza action quando fornecida", () => {
    const { getByText } = render(
      <TestProviders>
        <AppSectionHeader
          title="Metas"
          action={<Paragraph>Ver tudo</Paragraph>}
        />
      </TestProviders>,
    );

    expect(getByText("Metas")).toBeTruthy();
    expect(getByText("Ver tudo")).toBeTruthy();
  });
});
