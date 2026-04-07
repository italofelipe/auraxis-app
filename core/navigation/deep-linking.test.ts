import {
  buildAppUrl,
  buildCheckoutReturnUrl,
  parseAppUrl,
} from "@/core/navigation/deep-linking";
import { appRoutes } from "@/core/navigation/routes";

describe("deep linking", () => {
  it("resolve rotas publicas a partir do scheme do app", () => {
    expect(parseAppUrl("auraxisapp://login")).toEqual({
      kind: "route",
      href: appRoutes.public.login,
      rawUrl: "auraxisapp://login",
    });
  });

  it("interpreta retorno de checkout hospedado", () => {
    expect(
      parseAppUrl(
        "auraxisapp://assinatura?status=paid&provider=asaas&plan_slug=premium&external_reference=chk_123&token=checkout_456",
      ),
    ).toEqual({
      kind: "checkout-return",
      href: appRoutes.private.subscription,
      rawUrl:
        "auraxisapp://assinatura?status=paid&provider=asaas&plan_slug=premium&external_reference=chk_123&token=checkout_456",
      status: "success",
      provider: "asaas",
      planSlug: "premium",
      externalReference: "chk_123",
      checkoutToken: "checkout_456",
    });
  });

  it("aceita retorno de checkout em URL web", () => {
    expect(
      parseAppUrl("https://auraxis.app/assinatura?checkout_status=pending"),
    ).toEqual({
      kind: "checkout-return",
      href: appRoutes.private.subscription,
      rawUrl: "https://auraxis.app/assinatura?checkout_status=pending",
      status: "pending",
      provider: null,
      planSlug: null,
      externalReference: null,
      checkoutToken: null,
    });
  });

  it("trata a raiz do app como rota valida", () => {
    expect(parseAppUrl("auraxisapp://")).toEqual({
      kind: "route",
      href: appRoutes.root,
      rawUrl: "auraxisapp://",
    });
  });

  it("normaliza status desconhecido e ignora rotas invalidas", () => {
    expect(
      parseAppUrl("auraxisapp://assinatura?result=unexpected"),
    ).toMatchObject({
      kind: "checkout-return",
      status: "unknown",
    });
    expect(parseAppUrl("auraxisapp://rota-inexistente")).toBeNull();
    expect(parseAppUrl("nao-e-uma-url")).toBeNull();
  });

  it("gera URLs internas com e sem querystring", () => {
    expect(buildAppUrl(appRoutes.root)).toBe("auraxisapp://");
    expect(
      buildAppUrl(appRoutes.private.dashboard, {
        source: "push",
      }),
    ).toBe("auraxisapp://dashboard?source=push");
  });

  it("gera a URL de retorno canônica do checkout", () => {
    expect(buildCheckoutReturnUrl()).toBe(
      "auraxisapp://assinatura?checkout_return=1",
    );
  });
});
