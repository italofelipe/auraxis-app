import { render } from "@testing-library/react-native";
import { Paragraph } from "tamagui";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { TestProviders } from "@/shared/testing/test-providers";

import { AppQueryState } from "./app-query-state";

interface QueryPayload {
  readonly items: string[];
}

describe("AppQueryState", () => {
  beforeEach(() => {
    useAppShellStore.setState({
      connectivityStatus: "unknown",
      runtimeDegradedReason: null,
    });
  });

  it("renderiza estado offline quando o runtime perde conectividade antes de concluir a query", () => {
    useAppShellStore.setState({
      connectivityStatus: "offline",
      runtimeDegradedReason: "offline",
    });

    const { getByText } = render(
      <TestProviders>
        <AppQueryState
          query={{
            data: undefined,
            error: null,
            isPending: true,
            isError: false,
            isFetching: true,
            refetch: async () => undefined,
          }}
          options={{
            loading: {
              title: "Carregando ferramentas",
            },
            empty: {
              title: "Nenhuma ferramenta disponivel",
            },
            isEmpty: (data: QueryPayload) => data.items.length === 0,
          }}
        >
          {(data: QueryPayload) => (
            <Paragraph color="$color" fontFamily="$body" fontSize="$3">
              {data.items[0]}
            </Paragraph>
          )}
        </AppQueryState>
      </TestProviders>,
    );

    expect(getByText("Sem conexao para carregar agora")).toBeTruthy();
    expect(getByText("Tentar novamente")).toBeTruthy();
  });

  it("mantem o conteudo e exibe notice degradado quando a conectividade esta instavel", () => {
    useAppShellStore.setState({
      connectivityStatus: "degraded",
      runtimeDegradedReason: "healthcheck-failed",
    });

    const { getByText } = render(
      <TestProviders>
        <AppQueryState
          query={{
            data: {
              items: ["Ferramenta premium"],
            },
            error: null,
            isPending: false,
            isError: false,
            isFetching: true,
            refetch: async () => undefined,
          }}
          options={{
            loading: {
              title: "Carregando ferramentas",
            },
            empty: {
              title: "Nenhuma ferramenta disponivel",
            },
            isEmpty: (data: QueryPayload) => data.items.length === 0,
          }}
        >
          {(data: QueryPayload) => (
            <Paragraph color="$color" fontFamily="$body" fontSize="$3">
              {data.items[0]}
            </Paragraph>
          )}
        </AppQueryState>
      </TestProviders>,
    );

    expect(getByText("Servico instavel no momento")).toBeTruthy();
    expect(getByText("Ferramenta premium")).toBeTruthy();
  });
});
