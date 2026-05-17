import {
  ALLOWED_DEEP_LINK_PATHS,
  buildAppUrl,
  buildCheckoutReturnUrl,
  parseAppUrl,
  sanitizeAppUrl,
} from "@/core/navigation/deep-linking";
import { appRouteRegistry, appRoutes } from "@/core/navigation/routes";

// eslint-disable-next-line max-lines-per-function
describe("deep linking", () => {
  it("mantem a allowlist explicita sincronizada com o registry canonico", () => {
    const registeredPaths = appRouteRegistry
      .map((route) => route.path)
      .toSorted();

    expect([...ALLOWED_DEEP_LINK_PATHS].toSorted()).toEqual(registeredPaths);
  });

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
        "auraxisapp://assinatura?status=paid&provider=asaas&plan_slug=premium&external_reference=chk_123&token=%3Credacted%3E",
      status: "success",
      provider: "asaas",
      planSlug: "premium",
      externalReference: "chk_123",
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
    });
  });

  it("trata a raiz do app como rota valida", () => {
    expect(parseAppUrl("auraxisapp://")).toEqual({
      kind: "route",
      href: appRoutes.root,
      rawUrl: "auraxisapp://",
    });
  });

  it("aceita rotas legais por scheme e universal link confiavel", () => {
    expect(parseAppUrl("auraxisapp://privacy-policy")).toEqual({
      kind: "route",
      href: appRoutes.legal.privacyPolicy,
      rawUrl: "auraxisapp://privacy-policy",
    });
    expect(parseAppUrl("https://auraxis.app/terms-of-service")).toEqual({
      kind: "route",
      href: appRoutes.legal.termsOfService,
      rawUrl: "https://auraxis.app/terms-of-service",
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

  it("rejeita universal links fora dos hosts confiaveis", () => {
    expect(parseAppUrl("https://evil.example/dashboard")).toBeNull();
    expect(parseAppUrl("http://auraxis.app/dashboard")).toBeNull();
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

  it("redige parametros sensiveis de URL antes de persisti-los no runtime", () => {
    expect(
      sanitizeAppUrl(
        "auraxisapp://assinatura?status=paid&token=secret&checkout_token=secret-2",
      ),
    ).toBe(
      "auraxisapp://assinatura?status=paid&token=%3Credacted%3E&checkout_token=%3Credacted%3E",
    );
  });

  it("redige outros parametros sensiveis alem de tokens", () => {
    expect(
      sanitizeAppUrl(
        "auraxisapp://login?email=italo@auraxis.dev&password=12345678&auth_code=abc123",
      ),
    ).toBe(
      "auraxisapp://login?email=%3Credacted%3E&password=%3Credacted%3E&auth_code=%3Credacted%3E",
    );
  });

  it("reconhece /checkout/success como retorno e infere status sem querystring", () => {
    expect(
      parseAppUrl("auraxisapp://checkout/success?provider=asaas"),
    ).toEqual({
      kind: "checkout-return",
      href: appRoutes.private.checkoutSuccess,
      rawUrl: "auraxisapp://checkout/success?provider=asaas",
      status: "success",
      provider: "asaas",
      planSlug: null,
      externalReference: null,
    });
  });

  it("reconhece /checkout/cancel como retorno mesmo sem status query", () => {
    expect(parseAppUrl("auraxisapp://checkout/cancel")).toEqual({
      kind: "checkout-return",
      href: appRoutes.private.checkoutCancel,
      rawUrl: "auraxisapp://checkout/cancel",
      status: "cancel",
      provider: null,
      planSlug: null,
      externalReference: null,
    });
  });

  it("status explicito do query sobrescreve a inferencia pelo path", () => {
    expect(
      parseAppUrl("auraxisapp://checkout/success?status=pending"),
    ).toMatchObject({
      kind: "checkout-return",
      href: appRoutes.private.checkoutSuccess,
      status: "pending",
    });
  });
});
