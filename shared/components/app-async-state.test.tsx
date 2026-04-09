import { fireEvent, render } from "@testing-library/react-native";
import { ApiError } from "@/core/http/api-error";

import { TestProviders } from "@/shared/testing/test-providers";

import { AppAsyncState } from "./app-async-state";

describe("AppAsyncState", () => {
  it("renderiza estado offline com CTA de retry", () => {
    const handleRetry = jest.fn();
    const { getByText } = render(
      <TestProviders>
        <AppAsyncState
          state={{
            kind: "offline",
            title: "Sem conexao para carregar agora",
            description: "Reconecte-se para atualizar o catalogo.",
            actionLabel: "Tentar novamente",
            onAction: handleRetry,
          }}
        />
      </TestProviders>,
    );

    fireEvent.press(getByText("Tentar novamente"));

    expect(getByText("Sem conexao para carregar agora")).toBeTruthy();
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("delegates error rendering to the canonical error notice", () => {
    const { getByText } = render(
      <TestProviders>
        <AppAsyncState
          state={{
            kind: "error",
            error: new ApiError({
              message: "Service unavailable",
              status: 503,
            }),
            fallbackTitle: "Nao foi possivel carregar o feed",
            fallbackDescription: "Tente novamente em instantes.",
          }}
        />
      </TestProviders>,
    );

    expect(getByText("Nao foi possivel carregar o feed")).toBeTruthy();
    expect(getByText("Tente novamente em instantes.")).toBeTruthy();
  });
});
