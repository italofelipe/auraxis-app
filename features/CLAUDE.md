# CLAUDE.md — `features/*`

Diretiva operacional para agentes trabalhando dentro de qualquer feature do auraxis-app.

## Estrutura canônica por feature

```
features/<domain>/
  contracts.ts          # Tipos TypeScript derivados do OpenAPI
  mocks.ts              # Factories MSW/Jest para testes
  hooks/
    use-<domain>-query.ts           # TanStack Query wrapper
    use-<domain>-screen-controller.ts  # Lógica de tela + view models
    use-<domain>-mutations.ts       # Mutations (se houver)
  screens/
    <domain>-screen.tsx  # Composição de tela (só view, sem lógica)
  services/
    <domain>-service.ts  # Chamadas HTTP via core/http
  validators.ts          # Schemas Zod (se há formulários)
  validators.test.ts
  components/            # Componentes exclusivos da feature (opcional)
```

## Features existentes

| Domínio | Diretório | Descrição |
|---------|-----------|-----------|
| Contas bancárias | `accounts/` | Vinculação e listagem de contas |
| Alertas | `alerts/` | Notificações e alertas financeiros |
| Autenticação | `auth/` | Login, registro, recuperação de senha |
| Bootstrap | `bootstrap/` | Inicialização do app e feature flags |
| Orçamento | `budgets/` | Budget envelopes e categorias |
| Checkout | `checkout/` | Fluxo de assinatura Premium |
| Cartões de crédito | `credit-cards/` | Gestão de cartões |
| Dashboard | `dashboard/` | Visão geral financeira e saúde |
| Entitlements | `entitlements/` | Permissões por plano de assinatura |
| Fiscal | `fiscal/` | Notas fiscais (congelado — não implementar) |
| Focus | `focus/` | Focus Mode (flag: `focus`) |
| Metas | `goals/` | Metas financeiras com progresso |
| Legal | `legal/` | Termos de uso, política de privacidade |
| Observability | `observability/` | Métricas e rastreamento de sessão |
| Onboarding | `onboarding/` | Wizard de cadastro inicial |
| Planos | `plans/` | Visualização de planos disponíveis |
| Questionário | `questionnaire/` | Perfil de investidor |
| Entradas compartilhadas | `shared-entries/` | Entradas recorrentes cross-feature |
| Assinatura | `subscription/` | Gerenciamento de assinatura |
| Tags | `tags/` | Categorização de transações |

## Regras invioláveis

- **Screens são view-only.** Toda lógica vai para o screen controller hook.
- **Services são stateless.** Recebem params, chamam HTTP, retornam data ou throw.
- **Sem import lateral entre features.** `transactions/` não importa de `goals/`.
- **Contratos primeiro.** `contracts.ts` reflete o schema do backend — nunca manipule payloads crus fora dele.
- **Coverage >= 85%.** Validators, services e hooks devem ter testes unitários.

## Padrão de query hook

```typescript
// hooks/use-<domain>-query.ts
export function use<Domain>Query(params: <Domain>QueryParams) {
  return useQuery({
    queryKey: ['<domain>', params],
    queryFn: () => <Domain>Service.get(params),
    staleTime: STALE_TIME.SHORT, // importar de shared/config/query
  });
}
```

## Padrão de screen controller

```typescript
// hooks/use-<domain>-screen-controller.ts
export function use<Domain>ScreenController() {
  const query = use<Domain>Query(...);
  const mutation = use<Domain>Mutations();
  // derivar view model
  return { data: ..., isLoading: ..., onSubmit: ... };
}
```

## O que fazer autonomamente

- Criar/editar todos os arquivos dentro de `features/<domain>/`
- Adicionar testes unitários no mesmo diretório
- Estender tipos em `contracts.ts` quando o contrato evoluir

## O que perguntar antes

- Criar uma nova feature domain (novo diretório em `features/`)
- Mover código de uma feature para `shared/`
- Introduzir nova biblioteca de estado
