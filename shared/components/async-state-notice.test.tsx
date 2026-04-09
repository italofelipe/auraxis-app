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

  it("renderiza estados de conectividade para offline e degraded", () => {
    const { getByText, rerender } = render(
      <AppProviders>
        <AsyncStateNotice
          kind="offline"
          title="Sem conexao agora"
          description="Tente novamente quando a internet voltar."
        />
      </AppProviders>,
    );

    expect(getByText("Sem conexao agora")).toBeTruthy();

    rerender(
      <AppProviders>
        <AsyncStateNotice
          kind="degraded"
          title="Servico instavel"
          description="Alguns dados podem demorar mais que o normal."
        />
      </AppProviders>,
    );

    expect(getByText("Servico instavel")).toBeTruthy();
  });
});
