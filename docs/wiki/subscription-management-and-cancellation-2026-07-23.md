# Gestao e cancelamento de assinatura no app

**Data:** 2026-07-23

**Issue:** [auraxis-app#698](https://github.com/italofelipe/auraxis-app/issues/698)

**Plataformas:** iOS e Android

## Resumo

A tela mobile de assinatura mostrava um botao `Gerenciar assinatura`, mas ele
apenas tentava abrir `https://app.auraxis.com.br/conta/assinatura`. Essa rota
nao existe no Web, cujo caminho canonico e `/subscription`. O app ja possuia o
service e a mutation para `POST /subscriptions/cancel`, porem nenhum fluxo da
tela os acionava.

O resultado era uma gestao inoperante: assinaturas do gateway nao podiam ser
canceladas no app e o fallback Web levava a um destino incorreto.

## Causa raiz

Havia tres partes implementadas isoladamente, sem orquestracao:

1. `subscriptionService.cancelSubscription()` ja mapeava a resposta da API.
2. `useCancelSubscriptionMutation()` ja encapsulava a mutation.
3. `SubscriptionScreen` ignorava ambas e ligava o unico CTA diretamente a uma
   constante Web desatualizada.

Tambem nao existia uma decisao baseada no `provider`. Tratar da mesma forma uma
assinatura controlada pela Auraxis e outra controlada pela App Store/Google
Play poderia enviar o usuario ao sistema errado ou solicitar um cancelamento
que a API nao possui autoridade para executar.

## Solucao

### Matriz de provider

| Provider normalizado | Superficie de gestao | Comportamento |
|---|---|---|
| `asaas`, `stub` | API Auraxis | Confirmacao local e `POST /subscriptions/cancel` |
| provider ausente em `trialing`, `active` ou `past_due` | API Auraxis | Mesmo fluxo, cobrindo trial interno |
| `apple`, `app_store`, `app-store`, `appstore` | App Store | Abre `https://apps.apple.com/account/subscriptions` |
| `google`, `google_play`, `google-play`, `play_store`, `play-store` | Google Play | Abre `https://play.google.com/store/account/subscriptions` |
| outro provider ativo | Web Auraxis | Abre `https://app.auraxis.com.br/subscription` |

Providers de loja continuam com acesso a gestao mesmo depois do status
`canceled`, porque a loja pode oferecer detalhes ou reativacao. Providers da
API nao exibem um novo cancelamento para `free`, `canceled` ou `expired`.

### Cancelamento pela API

1. O CTA abre um modal e nao dispara rede.
2. O modal explica que a renovacao sera interrompida e mostra, quando
   disponivel, `current_period_end` como data final de acesso.
3. A confirmacao chama a mutation canonica.
4. Um guard sincrono bloqueia taps duplicados, inclusive antes do rerender que
   atualiza `isPending`.
5. Sucesso grava a resposta em `["subscription", "me"]` e invalida os grupos
   `subscription` e `entitlements`.
6. A tela fecha o modal e confirma a data final de acesso.
7. Erro mantem o modal aberto, nao altera o estado conhecido e oferece retry.

### Gestao externa

Apple e Google recebem uma explicacao de que a loja controla renovacao e
cancelamento. Se o sistema nao conseguir abrir a URL, o app exibe erro com
retry e permanece na tela.

As URLs seguem a documentacao oficial:

- [Apple — Handling Subscriptions Billing](https://developer.apple.com/documentation/storekit/handling-subscriptions-billing)
- [Google Play Billing — About subscriptions](https://developer.android.com/google/play/billing/subscriptions)

## Arquivos principais

- `features/subscription/services/subscription-management.ts`: matriz e
  fallback seguro.
- `features/subscription/hooks/use-subscription-management-controller.ts`:
  confirmacao, mutation, idempotencia, cache e analytics.
- `features/subscription/components/subscription-cancel-modal.tsx`: confirmacao,
  loading e retry.
- `features/subscription/screens/subscription-screen.tsx`: contexto por
  provider e feedback final.
- `shared/config/web-urls.ts`: rota Web canonica e centros oficiais das lojas.

## Validacao automatizada

Cobertura focada:

```bash
CI=1 npm test -- --runInBand --forceExit \
  features/subscription/services/subscription-management.test.ts \
  features/subscription/services/subscription-service.test.ts \
  features/subscription/hooks/use-subscription-management-controller.test.tsx \
  features/subscription/hooks/use-subscription-screen-controller.test.tsx \
  features/subscription/screens/subscription-screen.test.tsx
```

Os testes cobrem:

- Asaas, stub, trial sem provider, Apple, Google e provider
  desconhecido;
- rota e mapeamento de `POST /subscriptions/cancel`;
- atualizacao de cache e invalidacao de entitlements;
- bloqueio de duas requisicoes simultaneas;
- erro e retry de API/Linking;
- confirmacao, loading, data final e estado cancelado na tela.

O gate completo obrigatorio e:

```bash
npm run quality-check
```

## Smoke obrigatorio em iOS e Android

Executar o mesmo roteiro em um build iOS e em um Android:

1. Entrar com usuario que tenha assinatura ativa Asaas.
2. Abrir `Mais > Assinatura` ou o deep link `auraxisapp://assinatura`.
3. Confirmar plano, status, provider contextual e data da proxima cobranca.
4. Tocar `Cancelar assinatura` e confirmar que nenhuma alteracao ocorre antes
   do segundo CTA.
5. Tocar `Manter assinatura` e confirmar que o modal fecha.
6. Abrir novamente, confirmar o cancelamento e aguardar o feedback final.
7. Confirmar status `Cancelada`, `Cancelada em` e `Acesso ate`.
8. Fechar/reabrir o app e confirmar que o estado persiste.
9. Em conta de teste Apple/Google, confirmar que o CTA abre a gestao da loja e
   que a tela da Auraxis nao chama o endpoint de cancelamento.
10. Desligar a conectividade antes da confirmacao e validar erro + retry.

O fluxo Maestro `.maestro/08_subscription_checkout_smoke.yaml` cobre a
abertura e o abandono seguro da confirmacao. O cancelamento real permanece
manual porque altera o estado financeiro da conta de teste.

## Riscos residuais

- O app ainda nao implementa compra nativa StoreKit/Play Billing; os aliases de
  provider deixam a gestao pronta para estados vindos do backend, sem fingir
  uma integracao de compra que nao existe.
- O smoke real depende de contas de teste com assinatura ativa em cada
  provider e nao pode ser concluido apenas pelo Jest.
- Provider novo cai intencionalmente na pagina Web canonica ate ser adicionado
  de forma explicita a matriz.
