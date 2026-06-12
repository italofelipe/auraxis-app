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

  it("exibe detalhes tecnicos com a mensagem da excecao original", () => {
    const { getByText, getByTestId } = render(
      <AppProviders>
        <AppErrorNotice
          error={new Error("Cannot read property 'foo' of undefined")}
          showTechnicalDetails
          testID="notice"
        />
      </AppProviders>,
    );

    expect(getByText("Detalhes tecnicos")).toBeTruthy();
    expect(getByTestId("notice-technical-details").props.children).toContain(
      "Cannot read property 'foo' of undefined",
    );
  });

  it("exibe detalhes tecnicos legiveis para erro nao-Error", () => {
    const { getByTestId } = render(
      <AppProviders>
        <AppErrorNotice error="string failure" showTechnicalDetails testID="notice" />
      </AppProviders>,
    );

    expect(getByTestId("notice-technical-details").props.children).toContain(
      "string failure",
    );
  });

  it("exibe detalhes tecnicos sem stack para Error sem stack", () => {
    const error = new Error("sem stack");
    error.stack = "";
    const { getByTestId } = render(
      <AppProviders>
        <AppErrorNotice error={error} showTechnicalDetails testID="notice" />
      </AppProviders>,
    );

    expect(getByTestId("notice-technical-details").props.children).toBe(
      "Error: sem stack",
    );
  });

  it("serializa erros nao-Error como JSON nos detalhes tecnicos", () => {
    const { getByTestId } = render(
      <AppProviders>
        <AppErrorNotice
          error={{ code: "E_WEIRD", status: 500 }}
          showTechnicalDetails
          testID="notice"
        />
      </AppProviders>,
    );

    expect(getByTestId("notice-technical-details").props.children).toContain(
      "E_WEIRD",
    );
  });

  it("degrada para String() quando o erro nao e serializavel", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const { getByText } = render(
      <AppProviders>
        <AppErrorNotice error={circular} showTechnicalDetails />
      </AppProviders>,
    );

    expect(getByText("[object Object]")).toBeTruthy();
  });

  it("nao exibe detalhes tecnicos por padrao", () => {
    const { queryByText } = render(
      <AppProviders>
        <AppErrorNotice error={new Error("Boom")} />
      </AppProviders>,
    );

    expect(queryByText("Detalhes tecnicos")).toBeNull();
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
