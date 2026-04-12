import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { ApiError } from "@/core/http/api-error";

import { AppErrorNotice } from "./app-error-notice";

describe("AppErrorNotice", () => {
  it("renderiza CTA de retry para falha temporaria", () => {
    const handleRetry = jest.fn();
    const { getByText } = render(
      <AppProviders>
        <AppErrorNotice
          error={
            new ApiError({
              message: "Service unavailable",
              status: 503,
            })
          }
          onAction={handleRetry}
        />
      </AppProviders>,
    );

    expect(getByText("Servico temporariamente instavel")).toBeTruthy();
    fireEvent.press(getByText("Tentar novamente"));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("permite copy contextualizada para o fluxo atual", () => {
    const { getByText } = render(
      <AppProviders>
        <AppErrorNotice
          error={new Error("Boom")}
          fallbackTitle="Nao foi possivel carregar o dashboard"
          fallbackDescription="Recarregue a tela para tentar novamente."
        />
      </AppProviders>,
    );

    expect(getByText("Nao foi possivel carregar o dashboard")).toBeTruthy();
    expect(getByText("Recarregue a tela para tentar novamente.")).toBeTruthy();
  });
});
