# Assistente financeiro com IA no mobile

**Data:** 2026-07-24

**Issue:** [auraxis-app#712](https://github.com/italofelipe/auraxis-app/issues/712)

**Epic de paridade:** [auraxis-app#508](https://github.com/italofelipe/auraxis-app/issues/508)

**Plataformas:** iOS e Android

## Resumo

A Web já oferecia o recurso `Pergunte à IA`: uma entrada persistente nas telas
autenticadas, conversa financeira Premium, exemplos de perguntas, resposta
ancorada nos dados do próprio usuário e tratamento específico de entitlement,
consentimento, quota e falhas do provider.

O app possuía componentes de insights de IA, mas não consumia `POST /ai/chat`.
Também havia uma diferença crítica: o aceite de IA era salvo somente no
SecureStore do aparelho, enquanto a API exige um evento LGPD em
`POST /me/consents`. Copiar apenas a tela da Web produziria um chat que sempre
falharia com `AI_CONSENT_REQUIRED`.

Esta entrega fecha o gap funcional e corrige o consentimento compartilhado dos
insights para usar o servidor como autoridade.

## Resultado entregue

- launcher flutuante em todas as telas privadas;
- bottom sheet com título, transparência, exemplos e transcript da sessão;
- paywall pelo entitlement canônico `advanced_simulations`;
- kill switch `app.features.ai-chat`;
- consentimento LGPD real em `GET/POST /me/consents`;
- perguntas de 1 a 1.000 caracteres em `POST /ai/chat`;
- loading, timeout de 45 segundos, erro classificado e retry;
- retry sem duplicar a mensagem do usuário;
- renovação de consentimento seguida de retry automático da pergunta pendente;
- resposta com chip opcional do período retornado pela API;
- strings em português e inglês;
- mock funcional para desenvolvimento sem backend;
- analytics minimizado, sem pergunta, resposta ou valor financeiro.

Durante o E2E visual, três incompatibilidades da infraestrutura de preview
foram encontradas e corrigidas:

- o roteador mock ignorava `config.params`, fazendo o entitlement
  `advanced_simulations` chegar vazio;
- o Expo Web tentava abrir `expo-secure-store`, que não possui backend Web;
  dados sensíveis agora ficam somente em memória volátil no preview e
  continuam criptografados pelo SecureStore no iOS/Android;
- o Tamagui atual exige aliases `true` para `size` e `space`, e o portal do
  modal não recebia cores concretas do botão. Os aliases e a resolução
  semântica do `AppButton` foram protegidos por testes.

## Contratos usados

### Pergunta financeira

```http
POST /ai/chat
```

Request:

```json
{
  "question": "Quanto gastei com alimentação este mês?"
}
```

Resposta mapeada:

```json
{
  "answer": "Até agora você gastou...",
  "model": "gpt-4o-mini",
  "tokens_used": 380,
  "cost_usd": 0.000057,
  "period_label": "julho/2026",
  "tool_rounds": 1
}
```

O app exibe somente `answer` e, quando presente, `period_label`. Modelo, tokens
e custo não são enviados para analytics e não aparecem como informação
comercial ao usuário.

### Consentimento

```http
GET /me/consents
POST /me/consents
```

Grant:

```json
{
  "kind": "ai",
  "version": "1.0",
  "action": "granted",
  "source": "app"
}
```

Uma leitura remota bem-sucedida sempre prevalece sobre o SecureStore. Se o
servidor informar ausência/revogação, o cache local é apagado. Se a leitura
remota falhar por indisponibilidade, o cache pode manter a apresentação
resiliente; o próprio `POST /ai/chat` ainda preserva a validação autoritativa do
backend.

## Regras de acesso e quota

O app consulta `advanced_simulations` para evitar uma chamada sabidamente
negada e mostrar o CTA Premium. A API continua sendo a autoridade final.

Nenhum limite diário foi copiado para o cliente. `AI_INSIGHT_BUDGET_EXCEEDED`
ou HTTP 429 apresenta o estado de quota e não dispara retry automático. Isso
evita divergência quando o backend alterar limite, janela ou política de custo.

## Erros e recuperação

| Contrato/condição | Estado mobile | Recuperação |
|---|---|---|
| `ENTITLEMENT_REQUIRED` ou 403 desconhecido | `entitlement` | abrir Premium |
| `AI_CONSENT_REQUIRED` | `consent` | renovar consentimento e repetir a pergunta uma vez |
| `AI_INSIGHT_BUDGET_EXCEEDED` ou 429 | `budget` | aguardar liberação do backend |
| `VALIDATION_ERROR` ou 400 | `validation` | corrigir a pergunta |
| timeout de transporte | `timeout` | retry explícito |
| provider/5xx/contrato inválido | `server` | retry explícito |

O transcript adiciona a pergunta antes da rede. Em falha, a pergunta pendente é
guardada separadamente; o retry chama a API novamente sem criar uma segunda
bolha do usuário.

## Privacidade e observabilidade

Eventos permitidos:

- `ai.chat.opened`: apenas se o gate Premium estava disponível;
- `ai.chat.question.sent`: apenas `initial` ou `retry`;
- `ai.chat.answer.received`: apenas booleanos de período e uso de ferramentas;
- `ai.chat.request.failed`: classificação e se a falha é retryable.

Dados proibidos:

- pergunta e resposta;
- e-mail ou identificador do usuário;
- valores e categorias financeiras;
- modelo, tokens e custo;
- conteúdo do transcript.

O transcript fica somente na memória do layout privado. Fechar o sheet preserva
a conversa da sessão; logout desmonta o layout e descarta tudo.

## Arquivos principais

- `features/ai-chat/screens/ai-chat-host.tsx`: launcher, sheet e gates;
- `features/ai-chat/hooks/use-ai-chat-controller.ts`: flag, entitlement e
  consentimento;
- `features/ai-chat/hooks/use-ai-chat-session.ts`: transcript, envio e retry;
- `features/ai-chat/services/ai-chat-service.ts`: contrato HTTP e timeout;
- `features/insights/services/ai-consent-service.ts`: autoridade LGPD remota;
- `core/storage/secure-key-value-storage.ts`: SecureStore nativo e memória
  volátil no preview Web;
- `config/feature-flags.json`: kill switch;
- `shared/mocks/api/router.ts`: fluxo de demonstração.

## Validação automatizada

O escopo adiciona testes para:

- envelope v2 e payload legado/flat;
- mapeamento snake_case para o domínio mobile;
- pergunta vazia, normalização e limite de 1.000 caracteres;
- resposta inválida;
- todas as classes de erro e retryability;
- consentimento concedido, ausente, revogado e fallback offline;
- flag desligada, entitlement, hidratação e grant;
- transcript preservado ao fechar/reabrir;
- retry sem duplicação;
- ausência de pergunta/resposta em analytics;
- Premium gate, consent gate, loading, transcript, envio e retry na UI;
- rotas mock de consentimento e chat;
- integração do host com o layout privado.

Comandos focados:

```bash
npm test -- --runInBand --silent \
  features/ai-chat \
  features/insights/hooks/use-ai-insight-consent.test.tsx \
  features/insights/services/ai-consent-service.test.ts \
  core/observability/use-analytics.test.tsx \
  shared/mocks/api/router.test.ts \
  __tests__/app/private-layout.test.tsx
```

Gate final:

```bash
npm run quality-check
```

## Evidência visual E2E

O cenário foi executado no app Expo Web em viewport mobile de `390x844`, com a
API mock versionada do próprio repositório e dados fictícios. O percurso
validado foi:

1. login;
2. resolução do entitlement Premium;
3. abertura pelo launcher global;
4. concessão do consentimento em `POST /me/consents`;
5. pergunta sugerida;
6. resposta de `POST /ai/chat` com período.

| Etapa | Evidência |
|---|---|
| launcher global no dashboard privado | [`docs/evidence/issue-712/01-ai-launcher-dashboard.png`](../evidence/issue-712/01-ai-launcher-dashboard.png) |
| transparência e consentimento antes da primeira pergunta | [`docs/evidence/issue-712/02-ai-consent.png`](../evidence/issue-712/02-ai-consent.png) |
| pergunta, resposta e período no transcript | [`docs/evidence/issue-712/03-ai-answer.png`](../evidence/issue-712/03-ai-answer.png) |

O host desta execução não possui Xcode `simctl` nem Android `adb`; por isso,
as capturas automatizadas são do bundle Expo Web responsivo. A composição,
contratos e estados nativos são cobertos pelos testes React Native, e o smoke
manual em devices continua listado abaixo.

## Smoke em iOS e Android

1. Entrar com uma conta Premium sem consentimento de IA.
2. Em cada tab privada, confirmar a presença do launcher sem bloquear a tab bar.
3. Abrir o assistente e validar título, transparência e exemplos.
4. Conceder consentimento e confirmar que o composer aparece sem reiniciar.
5. Enviar uma pergunta e validar bolha do usuário, loading e resposta.
6. Fechar e reabrir; confirmar transcript preservado.
7. Simular timeout/5xx e confirmar retry sem segunda bolha do usuário.
8. Simular `AI_CONSENT_REQUIRED`, renovar e confirmar retry automático.
9. Usar conta Free e confirmar que nenhuma chamada de chat ocorre.
10. Desligar `app.features.ai-chat` e confirmar remoção imediata da entrada.
11. Fazer logout/login e confirmar transcript vazio.
12. Repetir em tema claro/escuro, teclado aberto e fontes ampliadas.

## Riscos residuais

- O backend é single-turn; mensagens anteriores são contexto visual e não são
  reenviadas para a IA.
- O snapshot OpenAPI versionado no app ainda não contém `POST /ai/chat`; o
  endpoint está registrado temporariamente em `known-openapi-gaps.json` até a
  próxima sincronização canônica. `GET/POST /me/consents` já existem no
  snapshot.
- A comprovação com dados reais depende de conta Premium, consentimento e
  provider de IA disponíveis no ambiente de teste. O E2E registrado usa a API
  mock e não afirma validar uma resposta financeira real.
- O SSR do Expo ainda emite um aviso preexistente de `expo-notifications`
  tentando ler `localStorage`; ele não bloqueia o bundle cliente nem faz parte
  do fluxo de chat.
