# Runbook — migração de `runtimeVersion` para policy `fingerprint`

> **Status: RECOMENDADO, DEFERIDO.** Este runbook documenta a mudança e o seu
> risco. **NÃO** aplique a mudança em `app.json` sem antes executar a validação
> com build real descrita aqui. Issue de rastreamento: [#647](https://github.com/italofelipe/auraxis-app/issues/647).

## Estado atual

`app.json`:

```jsonc
{
  "expo": {
    "version": "1.0.0",
    "runtimeVersion": { "policy": "appVersion" }
  }
}
```

Com `policy: appVersion`, o **runtimeVersion** de todo build e de todo OTA é
igual a `expo.version` (hoje `1.0.0`). O EAS Update só entrega um update a um
build instalado cujo runtimeVersion **casa exatamente** com o do update.

## O problema

`appVersion` acopla a compatibilidade de OTA à *string de marketing*, não ao
que realmente importa para um OTA seguro: a **camada nativa** (dependências com
código nativo, config plugins, permissões, versão do SDK do Expo).

Consequências no estado atual:

- **Falso positivo (perigoso).** Se uma dep nativa mudar mas a `version`
  continuar `1.0.0`, um OTA JS-only é entregue a um build cujo binário nativo é
  incompatível → crash em runtime (JS chama API nativa que não existe naquele
  binário). Este é exatamente o risco que motiva #647.
- **Falso negativo (atrito).** Todo bump de `version` (mesmo puramente de
  marketing, sem mudança nativa) muda o runtimeVersion e **corta OTA** para os
  builds antigos, forçando atualização pela loja mesmo quando um OTA bastaria.

## A mudança recomendada

Trocar a policy para `fingerprint`:

```jsonc
{
  "expo": {
    "version": "1.0.0",
    "runtimeVersion": { "policy": "fingerprint" }
  }
}
```

Com `fingerprint`, o Expo calcula o runtimeVersion a partir de um **hash das
entradas nativas** do projeto (deps nativas, config plugins, `app.json` nativo,
versão do Expo, etc.). O runtime só muda quando a camada nativa muda — que é
precisamente quando um OTA deixaria de ser seguro. É a policy recomendada pela
Expo para projetos CNG (Continuous Native Generation) no SDK 52+.

Requer o pacote `expo-updates` (já é dependência de OTA) e o cálculo de
fingerprint do `@expo/fingerprint` (transitivo do `expo`).

## Risco / impacto — por que não flipar às cegas

**A mudança altera a chave de compatibilidade de entrega de OTA.** Isso tem
duas implicações que só se validam com build real:

1. **Descontinuidade nos builds já instalados.** Os builds hoje em campo têm
   runtimeVersion `1.0.0` (appVersion). O primeiro build feito com
   `policy: fingerprint` terá um runtimeVersion **diferente** (o hash). A partir
   daí, **OTAs publicados sob o novo runtime NÃO alcançam os builds `1.0.0`
   antigos** — eles só voltam a receber OTA depois de instalarem, pela loja, um
   build já com fingerprint. Planeje a migração junto de um release de loja.
2. **Canais/branches do EAS Update.** É preciso confirmar que o canal
   (`preview`/`production`) publica o update sob o runtime esperado e que um
   device com o build de fingerprint efetivamente recebe o update. Um erro aqui
   silencia OTA em produção sem crash aparente — o app só "para de atualizar".

Por isso **não** basta editar `app.json` e mergear: a corretude depende de um
build nativo real e de um teste de entrega ponta a ponta.

## Passo de validação obrigatório (antes de aplicar)

1. **Branch de validação** (não `main`): editar `app.json` para
   `runtimeVersion.policy: fingerprint`.
2. **Build de preview real** (não OTA):
   ```bash
   eas build --profile preview --platform android
   # opcional: --platform ios
   ```
   Instalar o APK de preview num device.
3. **Conferir o runtimeVersion calculado**:
   ```bash
   npx expo-updates runtimeversion:resolve --platform android
   # ou: npx @expo/fingerprint fingerprint:generate
   ```
   Anotar o hash — é o novo runtimeVersion.
4. **Publicar um OTA JS-only** no mesmo canal do build de preview e confirmar a
   compatibilidade de runtime:
   ```bash
   eas update --branch preview --environment preview --message "fingerprint smoke"
   eas update:list --branch preview --limit 3
   ```
   O update precisa aparecer com o **mesmo runtimeVersion** do build de preview.
5. **Confirmar no device** que o build de preview recebe o OTA no segundo
   relaunch (mesma checagem do smoke de OTA em `docs/release-process.md`).
6. **Teste de incompatibilidade (opcional, mas ideal):** bumpar uma dep nativa
   na branch, rebuildar o fingerprint e confirmar que o runtime **muda** — ou
   seja, que um OTA sob o runtime antigo NÃO é entregue ao novo binário. É esta
   propriedade que corrige #647.

Só depois de 1–6 verdes, aplicar a mudança em `app.json` em `main`, alinhada a
um release de loja (para os builds antigos migrarem via loja).

## Rollback

Reverter `runtimeVersion.policy` para `appVersion` no `app.json` e refazer o
build de loja. OTAs publicados sob o runtime de fingerprint deixam de casar; o
comportamento volta ao acoplamento por `version`.

## Referências

- Expo — *Runtime versions and updates* (policy `fingerprint` vs `appVersion`).
- `@expo/fingerprint` — cálculo do hash de entradas nativas.
- `docs/release-process.md` — ciclo OTA vs build, gate de promoção.
- Issue [#647](https://github.com/italofelipe/auraxis-app/issues/647).
