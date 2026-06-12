# API Envelope Contracts — matriz de auditoria service ↔ Flask

> Issue: [#538](https://github.com/italofelipe/auraxis-app/issues/538) · Épico: [#537](https://github.com/italofelipe/auraxis-app/issues/537)
> Auditoria executada em 2026-06-12 após crash em produção (dashboard/metas).

## A regra

O Flask responde **envelope** `{status, message, data, meta?}` via `compat_success(data=...)`.
O shape de `data` definido no **controller** (`app/controllers/**/resources.py`) é a
fonte de verdade — o snapshot OpenAPI não captura o wrapper interno.

Todo service do app DEVE:

1. Desembrulhar com `unwrapEnvelopeData<ShapeRealDoFlask>(response.data)` — tipado com o
   shape que o **Flask responde**, não com o que a tela deseja
2. **Mapear** explicitamente para o contrato interno (camelCase, coerções) — nunca
   repassar o payload cru tipado com o contrato interno
3. Tratar coleções ausentes com default (`payload.items ?? []`)
4. Coagir Decimals: o Flask serializa `fields.Decimal(as_string=True)` → **string**
   (`"1500.00"`), nunca assumir `number`
5. Testar com **fixture do envelope real** (copiado do controller), não com o shape
   desejado

Guard central: `core/query/query-feedback-state.ts` envolve `isEmpty` em try/catch —
shape inesperado degrada para empty-state em vez de ErrorBoundary. Isso é mitigação,
não licença para pular o mapeamento.

## Matriz (leituras da área privada, 2026-06-12)

| Service.método | Path | Flask `data=` | App esperava | Veredito |
|---|---|---|---|---|
| goals.listGoals | GET /goals | `{items: [GoalSchema]}` (amounts **string**) | `{goals: GoalRecord[]}` | ❌ **CORRIGIDO** — items→goals + coerção Decimal-string |
| transactions.listTransactions | GET /transactions | `{transactions: [...]}` | `{transactions, pagination}` | ✅ |
| budgets.listBudgets | GET /budgets | `{items: [...]}` | unwrap defensivo de lista | ✅ |
| credit-cards.listCreditCards | GET /credit-cards | `{credit_cards: [...]}` | mapeado → `{creditCards}` | ✅ |
| accounts.listAccounts | GET /accounts | `{accounts: [...]}` | `{accounts}` | ✅ |
| wallet.listEntries | GET /wallet | `{items, pagination}` | `{items, pagination}` | ✅ |
| tags.listTags | GET /tags | `{tags: [...]}` | `{tags}` | ✅ |
| alerts.listAlerts / getPreferences | GET /alerts, /alerts/preferences | `{alerts}` / `{preferences}` | idem | ✅ |
| spending-patterns.getLatest | GET /ai/insights/spending-patterns/latest | snake_case | mapeado | ✅ |
| weekly-snapshot.get | GET /ai/insights/weekly-summary | aninhado | mapeado | ✅ |
| insights.getLatest / history | GET insights | snake_case | `mapInsight` / perPage | ✅ |
| subscription.listPlans | GET /subscriptions/plans | `{plans: [...]}` | `payload.plans.map(mapPlan)` | ✅ |
| user-profile.listNotificationPreferences | GET /user/notification-preferences | snake_case | `mapNotificationPreference` | ✅ |
| fiscal.listReceivables / listFiscalDocuments | GET /fiscal/* | mapeado | mapeado | ✅ |

**Resultado**: 1 divergência real (goals — crash em produção), corrigida nesta issue.
Dois falsos positivos da primeira passada de auditoria (subscription, notification
preferences) — descartados por leitura direta do código.

## Por que os testes não pegaram

- Services eram testados (quando eram) com mocks no shape **desejado** — `listGoals`
  não tinha teste algum
- Dev roda com `EXPO_PUBLIC_API_MODE=mock` na maior parte do tempo — a integração real
  só acontece em device/preview
- O crash só aparece quando `AppQueryState.isEmpty` acessa o campo ausente

## Checklist para NOVOS endpoints

- [ ] Li o `compat_success(data=...)` do controller Flask
- [ ] Tipei o unwrap com o shape do Flask (snake_case, Decimals como string)
- [ ] Mapeei para o contrato interno com defaults para coleções
- [ ] Fixture de teste copiado da resposta real (envelope completo)
- [ ] `isEmpty` da tela tolera shape parcial (o guard central cobre, mas use `?.`)
