import { queryKeys } from "@/core/query/query-keys";
import {
  authenticatedQueryRoots,
  clearAuthenticatedQueryCache,
  createSessionFailurePresentation,
  resetRuntimeAfterSessionInvalidation,
} from "@/core/session/session-invalidation";

describe("session invalidation helpers", () => {
  it("mapeia motivos de invalidacao para copy canonica de recovery", () => {
    expect(createSessionFailurePresentation("expired")).toEqual({
      title: "Sua sessao expirou",
      description: "Entre novamente para continuar com seguranca.",
      dismissLabel: "Fechar",
    });

    expect(createSessionFailurePresentation("bootstrap-invalid")).toEqual({
      title: "Nao foi possivel recuperar sua sessao",
      description:
        "A sessao salva neste dispositivo foi limpa com seguranca. Entre novamente para continuar.",
      dismissLabel: "Fechar",
    });

    expect(createSessionFailurePresentation("manual")).toBeNull();
  });

  it("cancela e remove todas as roots autenticadas do query client", async () => {
    const queryClient = {
      cancelQueries: jest.fn().mockResolvedValue(undefined),
      removeQueries: jest.fn(),
    };

    await clearAuthenticatedQueryCache(queryClient);

    expect(queryClient.cancelQueries).toHaveBeenCalledTimes(
      authenticatedQueryRoots.length,
    );
    expect(queryClient.removeQueries).toHaveBeenCalledTimes(
      authenticatedQueryRoots.length,
    );
    expect(queryClient.cancelQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.bootstrap.root,
    });
    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.tools.root,
    });
  });

  it("zera artefatos autenticados do shell depois da invalidacao", async () => {
    const queryClient = {
      cancelQueries: jest.fn().mockResolvedValue(undefined),
      removeQueries: jest.fn(),
    };
    const setEntitlementsVersion = jest.fn();
    const setPendingCheckoutReturn = jest.fn();

    await resetRuntimeAfterSessionInvalidation({
      queryClient,
      setEntitlementsVersion,
      setPendingCheckoutReturn,
    });

    expect(setEntitlementsVersion).toHaveBeenCalledWith(null);
    expect(setPendingCheckoutReturn).toHaveBeenCalledWith(null);
  });
});
