import { ApiError } from "@/core/http/api-error";

import {
  createQueryFeedbackState,
  type QueryFeedbackStateInput,
  type QueryFeedbackStateOptions,
} from "./query-feedback-state";

interface CollectionPayload {
  readonly items: string[];
}

const createQuery = (
  overrides: Partial<QueryFeedbackStateInput<CollectionPayload>>,
): QueryFeedbackStateInput<CollectionPayload> => ({
  data: undefined,
  error: null,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn(),
  ...overrides,
});

const createOptions = (): QueryFeedbackStateOptions<CollectionPayload> => ({
  loading: {
    title: "Carregando itens",
    description: "Buscando os registros mais recentes.",
  },
  empty: {
    title: "Nenhum item encontrado",
    description: "Os resultados vao aparecer aqui quando existirem dados.",
  },
  error: {
    fallbackTitle: "Nao foi possivel carregar agora",
    fallbackDescription: "Tente novamente em alguns instantes.",
  },
  isEmpty: (data) => data.items.length === 0,
});

describe("createQueryFeedbackState", () => {
  it("prioriza estado offline quando a query ainda nao tem dados e o runtime esta sem conexao", () => {
    const state = createQueryFeedbackState({
      query: createQuery({
        isPending: true,
      }),
      options: createOptions(),
      connectivityStatus: "offline",
      degradedReason: "offline",
      onRetry: jest.fn(),
    });

    expect(state).toMatchObject({
      kind: "offline",
      title: "Sem conexao para carregar agora",
      actionLabel: "Tentar novamente",
    });
  });

  it("mantem o conteudo e adiciona notice degradado quando ja existe dado em cache", () => {
    const state = createQueryFeedbackState({
      query: createQuery({
        data: {
          items: ["wallet", "dashboard"],
        },
        isFetching: true,
      }),
      options: createOptions(),
      connectivityStatus: "degraded",
      degradedReason: "healthcheck-failed",
      onRetry: jest.fn(),
    });

    expect(state.kind).toBe("content");
    if (state.kind !== "content") {
      throw new Error("expected content state");
    }

    expect(state.notice).toMatchObject({
      kind: "degraded",
      title: "Servico instavel no momento",
      actionLabel: "Tentar novamente",
    });
    expect(state.isRefreshing).toBe(true);
  });

  it("retorna estado de erro canônico para falhas que nao sao offline nem degradadas", () => {
    const state = createQueryFeedbackState({
      query: createQuery({
        error: new ApiError({
          message: "Internal server error",
          status: 500,
        }),
        isError: true,
      }),
      options: createOptions(),
      connectivityStatus: "online",
      degradedReason: null,
      onRetry: jest.fn(),
    });

    expect(state).toMatchObject({
      kind: "error",
      fallbackTitle: "Nao foi possivel carregar agora",
      fallbackDescription: "Tente novamente em alguns instantes.",
    });
  });

  it("retorna estado vazio quando a query finaliza sem itens", () => {
    const state = createQueryFeedbackState({
      query: createQuery({
        data: {
          items: [],
        },
      }),
      options: createOptions(),
      connectivityStatus: "online",
      degradedReason: null,
    });

    expect(state).toEqual({
      kind: "empty",
      title: "Nenhum item encontrado",
      description: "Os resultados vao aparecer aqui quando existirem dados.",
    });
  });
});
