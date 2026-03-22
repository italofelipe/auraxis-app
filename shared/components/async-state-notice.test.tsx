import { render } from "@testing-library/react-native";

import { AppProviders } from "@/components/providers/app-providers";

import { AsyncStateNotice } from "./async-state-notice";

describe("AsyncStateNotice", () => {
  it("renderiza título e descrição para estado vazio", () => {
    const { getByText } = render(
      <AppProviders>
        <AsyncStateNotice
          kind="empty"
          title="Nada por aqui"
          description="Adicione o primeiro item para começar"
        />
      </AppProviders>,
    );

    expect(getByText("Nada por aqui")).toBeTruthy();
    expect(getByText("Adicione o primeiro item para começar")).toBeTruthy();
  });

  it("renderiza título para estado de erro", () => {
    const { getByText } = render(
      <AppProviders>
        <AsyncStateNotice kind="error" title="Erro ao carregar" />
      </AppProviders>,
    );

    expect(getByText("Erro ao carregar")).toBeTruthy();
  });
});
