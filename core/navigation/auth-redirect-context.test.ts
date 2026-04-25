import { useAuthRedirectStore } from "@/core/navigation/auth-redirect-context";

const reset = () => {
  useAuthRedirectStore.setState({ intendedRoute: null });
};

describe("useAuthRedirectStore", () => {
  beforeEach(reset);

  it("captura uma rota privada canonica", () => {
    useAuthRedirectStore.getState().capture("/metas");
    expect(useAuthRedirectStore.getState().intendedRoute).toBe("/metas");
  });

  it("ignora caminhos fora do registro de rotas privadas", () => {
    useAuthRedirectStore.getState().capture("/login");
    expect(useAuthRedirectStore.getState().intendedRoute).toBeNull();

    useAuthRedirectStore.getState().capture("/qualquer-coisa-falsa");
    expect(useAuthRedirectStore.getState().intendedRoute).toBeNull();
  });

  it("consome a rota e limpa o estado", () => {
    useAuthRedirectStore.getState().capture("/carteira");
    const consumed = useAuthRedirectStore.getState().consume();
    expect(consumed).toBe("/carteira");
    expect(useAuthRedirectStore.getState().intendedRoute).toBeNull();
  });

  it("retorna null ao consumir vazio", () => {
    expect(useAuthRedirectStore.getState().consume()).toBeNull();
  });

  it("clear redefine para null", () => {
    useAuthRedirectStore.getState().capture("/metas");
    useAuthRedirectStore.getState().clear();
    expect(useAuthRedirectStore.getState().intendedRoute).toBeNull();
  });
});
