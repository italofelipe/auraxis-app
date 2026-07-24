# Incidente mobile: crash ao abrir Insights e Cartões

**Data da análise:** 2026-07-24

**Issue:** [auraxis-app#726](https://github.com/italofelipe/auraxis-app/issues/726)

**Versão afetada:** 1.13.8

**Plataformas afetadas:** iOS e Android

**Área:** navegação privada e dependências nativas

## Sintoma

O login concluía e o Dashboard permanecia funcional, mas tocar nas abas
`Insights` ou `Cartões` encerrava imediatamente o aplicativo. O comportamento
era equivalente em iOS e Android.

As duas rotas são montadas sob o mesmo navigator privado:

- `app/(private)/insights.tsx`;
- `app/(private)/cartoes.tsx`.

Insights ativa SVG/Reanimated e a consulta do insight atual. Cartões monta
queries, carrossel, gráficos e o tour guiado. Assim, o primeiro foco nessas
rotas aumenta o uso da camada React Native/nativa que não é exercitada enquanto
o usuário permanece no Dashboard.

## Diagnóstico

Os testes existentes das telas e do navigator passaram:

```text
3 suites, 20 tests, all passing
```

Isso descartou uma exceção determinística na composição JavaScript com os
mocks do Jest, mas não validou os módulos nativos presentes no binário.

Em seguida, `npx expo-doctor` encontrou sete pacotes fora das versões esperadas
para o Expo SDK 55:

| Pacote | No binário 1.13.8 | Matriz esperada |
|---|---:|---:|
| `react` | 19.2.7 | 19.2.0 |
| `react-dom` | 19.2.7 | 19.2.0 |
| `react-native` | 0.83.10 | 0.83.6 |
| `react-native-svg` | 15.15.5 | 15.15.3 |
| `react-native-webview` | 13.16.1 | 13.16.0 |
| `@react-navigation/bottom-tabs` | `^7.18.13` | `^7.15.5` |
| `@react-navigation/native` | `7.3.13` | `^7.1.33` |

O renderer de testes também permanecia em 19.2.7 e se tornou incompatível
quando React foi realinhado para 19.2.0.

## Causa raiz

Atualizações automáticas alteraram versões coordenadas pelo Expo sem um gate de
compatibilidade no `quality-check`. O repositório continuava passando lint,
tipagem e Jest porque esse harness não carrega as implementações nativas reais
de React Navigation, React Native, SVG ou WebView.

Sem o stack trace nativo dos aparelhos, não é possível atribuir o sinal fatal a
uma função específica de uma dessas bibliotecas. A incompatibilidade da matriz
é, contudo, uma violação reproduzível nas duas plataformas, foi detectada pela
ferramenta oficial do Expo e coincide com o primeiro build que tornou o fluxo
testável após a correção do login.

O incidente anterior de montagem ansiosa foi mantido corrigido:
`lazy: true` e `detachInactiveScreens` continuam ativos. O novo crash só
aparecia quando as rotas eram efetivamente focadas.

## Correção

As dependências foram realinhadas com:

```bash
npx expo install --fix
npx expo install --dev react-test-renderer@19.2.0
```

O `package.json` e o lockfile agora descrevem a matriz aceita pelo SDK 55.

Também foi adicionado:

```bash
npm run expo:check
```

Esse comando faz parte de `npm run quality-check` e bloqueia futuros PRs que
tentem atualizar isoladamente React, React Native, React Navigation ou módulos
nativos para uma versão que o Expo instalado não reconheça.

O teste `__tests__/app/critical-tab-routes.test.tsx` monta os wrappers reais de
Insights e Cartões e confirma que cada um resolve a tela de produção sem lançar
erro JavaScript. Ele complementa, mas não substitui, o check da matriz nativa.

## Validação

Validações mínimas:

```bash
npm run expo:check
npx jest --runInBand --forceExit \
  __tests__/app/critical-tab-routes.test.tsx \
  __tests__/app/private-layout.test.tsx \
  features/insights/screens/insights-fluida-screen.test.tsx \
  features/credit-cards/screens/credit-cards-screen.test.tsx
npm run quality-check
```

Resultado local:

- instalação limpa com `npm ci`: aprovada;
- matriz Expo: aprovada (`Dependencies are up to date`);
- regressão focal: 4 suites, 22 testes aprovados;
- bundles de produção: iOS e Android exportados com sucesso;
- quality gate: lint, tipagem, matriz Expo, nove verificações de governança,
  contratos, codegen, 429 suites, 2.804 testes e seis snapshots aprovados;
- cobertura global: 94,79% statements, 84,88% branches, 94,91% functions e
  94,76% lines.

Antes da promoção, exportar os bundles iOS/Android e executar o smoke abaixo em
binários nativos.

## Smoke obrigatório

Em iOS e Android:

1. Instalar o novo build sobre estado limpo.
2. Fazer login e aguardar o Dashboard estabilizar.
3. Abrir `Insights`; confirmar conteúdo/carregamento/erro sem encerramento.
4. Voltar ao Dashboard e abrir `Cartões`; confirmar
   conteúdo/carregamento/vazio/erro sem encerramento.
5. Alternar entre `Início`, `Transações`, `Insights`, `Cartões` e `Mais`.
6. Colocar o app em background, retornar e repetir Insights/Cartões.
7. Confirmar no Sentry a ausência de novos eventos fatais para a versão.

## Entrega

Esta mudança altera React Native e outros módulos do runtime. Ela exige novos
binários iOS e Android; um OTA isolado não corrige os módulos já compilados no
build 1.13.8. A política de `runtimeVersion: fingerprint` deve gerar um runtime
novo e impedir que o bundle seja entregue a um binário incompatível.

## Risco residual

- Esta máquina não possui `simctl` nem `adb`; o smoke em device precisa ocorrer
  no build distribuído.
- O `expo-doctor` ainda aponta propriedades antigas no schema de `app.json`.
  Elas não foram alteradas nesta issue porque `app.json` exige aprovação humana
  explícita e o erro é independente do drift de dependências.
- Se o crash persistir após o build alinhado, anexar à issue #726 o stack trace
  nativo/Sentry, versão do SO, modelo do aparelho e aba anterior. O próximo
  isolamento deve desabilitar temporariamente a transição customizada e os
  componentes SVG/Reanimated separadamente.

## Referências

- [Expo — Upgrade Expo SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Expo — React Native version mismatch](https://docs.expo.dev/troubleshooting/react-native-version-mismatch/)
- [Expo SDK 55](https://expo.dev/changelog/sdk-55)
