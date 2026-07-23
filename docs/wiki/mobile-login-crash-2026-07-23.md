# Incidente mobile: crash no handoff pós-login

**Data da análise:** 2026-07-23

**Issue:** [auraxis-app#704](https://github.com/italofelipe/auraxis-app/issues/704)

**Plataformas afetadas:** iOS e Android

**Área:** autenticação, sessão e navegação privada

## Resumo

Depois de um login válido, a sessão era persistida e o app navegava para o
layout privado. Nesse primeiro mount, o navigator de tabs estava configurado
para renderizar antecipadamente todas as rotas e manter telas inativas
anexadas à hierarquia nativa.

O diretório `app/(private)` contém 55 arquivos de tela. Inicializar esse grafo
inteiro no handoff de autenticação aumenta abruptamente o uso de memória,
executa efeitos de telas que o usuário ainda não abriu e amplia a superfície
para falhas nativas. Como a configuração é compartilhada pelo React Navigation,
o comportamento explica a reprodução tanto no iOS quanto no Android.

## Evidências

1. `useLoginMutation` aguarda `signIn`, que persiste a sessão canônica.
2. `useLoginScreenController` navega para o redirect pretendido ou `/dashboard`.
3. A navegação monta `app/(private)/_layout.tsx`.
4. O commit `e587b70` (`feat(app): redesenhar menu inferior liquido (#635)`)
   introduziu simultaneamente:
   - `screenOptions.lazy: false`;
   - `detachInactiveScreens: false`.
5. A documentação do Bottom Tabs Navigator define `lazy: true` e
   `detachInactiveScreens: true` como os padrões voltados a inicialização sob
   demanda e economia de memória.
6. O teste de regressão novo falhou antes da correção recebendo `lazy: false`
   e passou depois da mudança.

Referência:
[React Navigation — Bottom Tabs Navigator](https://reactnavigation.org/docs/bottom-tab-navigator/).

## Causa raiz

O handoff pós-login estava acoplado a uma política de montagem agressiva do
navigator privado. `lazy: false` mandava renderizar as rotas no primeiro render
do navigator, enquanto `detachInactiveScreens: false` desabilitava a proteção
que remove telas inativas da hierarquia nativa.

Não houve mudança no contrato da API, no formato dos tokens, no SecureStore ou
nas credenciais. A falha acontecia depois da autenticação, durante a entrada no
shell privado.

Sem logs nativos ou devices disponíveis nesta máquina, não é possível atribuir
o encerramento a uma exceção nativa específica ou provar a pressão de memória
de cada aparelho. A relação temporal, o ponto exato do handoff e a configuração
cross-platform tornam a política de montagem a causa técnica de maior
confiança. O smoke test em builds reais permanece obrigatório.

## Correção

O layout privado agora declara explicitamente:

```tsx
<Tabs
  detachInactiveScreens
  screenOptions={{
    lazy: true,
    // transição, tema e demais opções permanecem iguais
  }}
/>
```

Efeitos esperados:

- somente a rota focada é montada na entrada da área autenticada;
- cada tab é inicializada quando aberta pela primeira vez;
- telas inativas saem da hierarquia nativa;
- definições de rotas, estado de navegação, tab bar e transição horizontal
  continuam inalterados.

## Alternativas consideradas

- **Remover a transição horizontal:** reduziria o escopo visual, mas a transição
  não exige inicialização antecipada de todas as rotas.
- **Dividir as 55 rotas em múltiplos navigators:** pode melhorar a arquitetura
  no futuro, porém é uma mudança ampla e desnecessária para interromper o
  incidente.
- **Deixar os valores implícitos:** ambos já são padrões da biblioteca, mas os
  valores explícitos tornam o contrato visível e testável contra regressões.

## Validação automatizada

Teste de regressão:

```bash
npm test -- --runInBand --forceExit __tests__/app/private-layout.test.tsx
```

Fluxo adjacente:

```bash
npm test -- --runInBand --forceExit \
  features/auth/hooks/use-auth-mutations.test.ts \
  features/auth/hooks/use-login-screen-controller.test.tsx \
  core/session/session-store.test.ts \
  core/session/session-storage.test.ts \
  __tests__/app/private-layout.test.tsx
```

Resultado local: 5 suites, 34 testes, todos aprovados. O warning de i18n e a
necessidade de `--forceExit` já existiam no harness do layout e não foram
introduzidos pela correção.

O quality gate completo também foi executado com sucesso:

```bash
GRAPHQL_SCHEMA_PATH=/caminho/para/auraxis-api/schema.graphql \
  npm run quality-check
```

Resultado: lint, typecheck, nove verificações de governança, contratos, codegen,
418 suites, 2.736 testes e seis snapshots aprovados.

Os bundles de produção foram exportados para as duas plataformas:

```bash
npx expo export --platform ios --output-dir <diretorio-temporario>
npx expo export --platform android --output-dir <diretorio-temporario>
```

As duas exportações concluíram sem erro. O aviso de configuração do Sentry usa
variáveis do ambiente de build e não bloqueou os bundles.

## Smoke test obrigatório em iOS e Android

Executar em build que contenha a correção, uma vez em cada plataforma:

1. Iniciar com estado limpo.
2. Informar credenciais inválidas e confirmar que o app permanece no login com
   mensagem de erro.
3. Informar credenciais válidas e confirmar que o dashboard aparece sem
   encerramento, tela branca ou reinício.
4. Abrir, em sequência, `Transações`, `Insights`, `Cartões` e `Mais`.
5. Voltar ao dashboard e confirmar que a tab bar e a transição horizontal
   permanecem estáveis.
6. Encerrar e reabrir o app; confirmar que a sessão persistida retorna à área
   autenticada.
7. Fazer logout e confirmar retorno ao login.

O fluxo Maestro existente `.maestro/01_login.yaml` cobre login limpo e presença
do dashboard. Ele deve ser executado em device/emulador iOS e Android quando o
ambiente nativo estiver disponível.

## Risco residual e observabilidade

- Esta máquina não possui `simctl` nem `adb`; não houve smoke local em device.
- O PR não altera `app.json`, `eas.json`, runtime version ou dependências
  nativas.
- Após distribuir o build, monitorar Sentry para encerramentos entre
  `auth.session_established` e o primeiro evento de navegação do dashboard.
- Se um crash nativo persistir, anexar à issue #704 o stack trace, modelo do
  aparelho, versão do sistema, versão/build do app e canal de atualização.

## Prevenção

- Manter o teste de `lazy` e `detachInactiveScreens` no layout privado.
- Tratar mudanças que montam vários módulos nativos no boot ou pós-login como
  alterações de alto risco.
- Validar em device qualquer mudança de navegação, splash ou runtime antes de
  publicar OTA ou build de loja.
