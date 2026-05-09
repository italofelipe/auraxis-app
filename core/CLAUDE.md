# CLAUDE.md — `core/*`

Diretiva para o runtime canônico do auraxis-app.
O `core/` é infraestrutura — modificações aqui afetam toda a aplicação.

## Módulos do core

| Módulo | Responsabilidade |
|--------|-----------------|
| `core/errors/` | Error boundaries, error mappers, AppError types |
| `core/http/` | Cliente HTTP tipado com interceptors (auth, retry, error, SSL pinning) |
| `core/navigation/` | Deep links, navigation ref, typed routes |
| `core/performance/` | Profiling, FPS monitor, bundle metrics |
| `core/providers/` | React providers globais (Query, Theme, Session, Toast) |
| `core/query/` | QueryClient config, stale-time buckets, persister offline |
| `core/security/` | Certificate pinning, jailbreak detection |
| `core/session/` | Gerenciamento de sessão (token storage, refresh automático) |
| `core/shell/` | App shell (splash, bootstrap sequence) |
| `core/telemetry/` | Sentry, analytics events, logging policy |

## Regras

- **Nunca** importar de `features/` dentro de `core/`.
- **Nunca** colocar lógica de produto em `core/` — apenas infraestrutura genérica.
- Mudanças em `core/providers/` exigem aprovação — afeta toda a árvore React.
- Mudanças em `core/http/` exigem testes de integração com os interceptors.
- `core/security/` contém SSL pinning e jailbreak detection — alterações exigem aprovação explícita.

## O que perguntar antes de modificar

- Qualquer arquivo em `core/providers/`
- `core/session/` (auth flow)
- `core/security/` (mecanismos de segurança, SSL pinning)
- `core/navigation/` (estrutura de deep links)
- `core/http/` (interceptors de autenticação e retry)

## Notas de SSL Pinning

`core/security/ssl-pinning.ts` implementa certificate pinning para os endpoints da API.
Consulte `docs/runbooks/ssl-pinning-rotation.md` antes de qualquer rotação de certificado.
