import {
  resolvePrivateRouteGuard,
  resolvePublicRouteGuard,
  resolveRootRoute,
} from "@/core/navigation/route-guards";
import { appRoutes } from "@/core/navigation/routes";

describe("route guards", () => {
  it("bloqueia rota privada ate hidratar a sessao", () => {
    expect(
      resolvePrivateRouteGuard({
        hydrated: false,
        isAuthenticated: false,
      }),
    ).toEqual({
      ready: false,
      redirectTo: null,
    });
  });

  it("redireciona rota privada para login quando deslogado", () => {
    expect(
      resolvePrivateRouteGuard({
        hydrated: true,
        isAuthenticated: false,
      }),
    ).toEqual({
      ready: true,
      redirectTo: appRoutes.public.login,
    });
  });

  it("redireciona rota publica para dashboard quando autenticado", () => {
    expect(
      resolvePublicRouteGuard({
        hydrated: true,
        isAuthenticated: true,
      }),
    ).toEqual({
      ready: true,
      redirectTo: appRoutes.private.dashboard,
    });
  });

  it("resolve a rota raiz com base na autenticacao", () => {
    expect(
      resolveRootRoute({
        hydrated: true,
        isAuthenticated: true,
      }),
    ).toEqual({
      ready: true,
      redirectTo: appRoutes.private.dashboard,
    });
  });
});
