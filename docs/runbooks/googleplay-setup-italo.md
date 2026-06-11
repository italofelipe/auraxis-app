# Google Play — Setup do console (guia passo a passo para o Italo)

> **Issue:** [#523](https://github.com/italofelipe/auraxis-app/issues/523) · **Épico:** [#518](https://github.com/italofelipe/auraxis-app/issues/518)
> **Tempo estimado:** ~45 min (Partes A–C) + ~10 min depois do 1º build (Parte D)
> **Pré-requisito:** conta do Google Play Console criada e taxa paga ✅
> Todos os textos para colar estão em `docs/runbooks/googleplay-metadata-drafts.md`.

As partes A–C não dependem de build. A Parte D precisa do AAB do primeiro
build (Claude orquestra; você só roda 1 comando — ver Parte E).

---

## Parte A — Criar o app no Play Console (~10 min)

1. https://play.google.com/console → **Create app**
2. Preencher:
   - App name: `Auraxis`
   - Default language: `Portuguese (Brazil) – pt-BR`
   - App or game: **App** · Free or paid: **Free**
   - Aceitar as declarações (Developer Program Policies + US export laws)
3. **Create app** → você cai no dashboard do app.

## Parte B — Declarações iniciais (~20 min)

No dashboard, seção **"Set up your app"** (ou App content no menu lateral).
Respostas prontas na seção 6 do metadata-drafts:

1. **Privacy policy**: `https://app.auraxis.com.br/privacy-policy`
2. **App access**: "All or some functionality is restricted" → adicionar a
   conta demo (seção 5 do drafts). Se a conta `appreview@auraxis.com.br` ainda
   não existir em produção, crie pelo próprio app antes.
3. **Ads**: No
4. **Content rating**: questionário IARC — respostas na seção 8 do drafts
   (categoria Utility/Other; tudo "No" exceto compras digitais)
5. **Target audience**: 18+ → "No" para appeals to children
6. **News app**: No
7. **Data safety**: preencher conforme a **seção 7 do drafts** (tabela completa,
   linha a linha). É a parte mais longa (~10 min)
8. **Government app**: No
9. **Financial features**: apenas gestão de finanças pessoais/orçamento —
   **não** marcar banking/empréstimos/crypto (ver nota na seção 6 do drafts)
10. **Store listing** (rascunho mínimo): colar App name, short description e
    full description (seções 1–3 do drafts). Ícone 512px e feature graphic
    podem ficar pendentes para o internal testing.

## Parte C — Service account p/ automação do `eas submit` (~15 min)

Permite que o pipeline envie AABs ao Play sem você. Só precisa ser feito 1 vez.

1. https://console.cloud.google.com → criar projeto (ou usar existente):
   nome sugerido `auraxis-play-publisher`
2. **APIs & Services → Library** → buscar **"Google Play Android Developer API"**
   → **Enable**
3. **IAM & Admin → Service Accounts → Create service account**:
   - Name: `eas-play-submitter`
   - Sem roles de projeto (as permissões vêm do Play Console) → **Done**
4. Na service account criada → **Keys → Add key → Create new key → JSON** →
   baixa o arquivo `*.json`
5. De volta ao **Play Console** → **Users and permissions → Invite new users** →
   colar o email da service account (`eas-play-submitter@auraxis-play-publisher.iam.gserviceaccount.com`):
   - Em **App permissions**, adicionar o app Auraxis
   - Permissões mínimas: **"Release apps to testing tracks"** + **"View app
     information and download bulk reports"**
   - Send invite
6. **Me entregar o JSON** (caminho local do arquivo — NÃO commitar, NÃO colar
   em chat público). Eu gravo como EAS secret file `GOOGLE_SERVICE_ACCOUNT`
   (já referenciado no `eas.json`) e deleto a cópia local.

## Parte D — Primeiro release no internal testing (~10 min, depois do 1º build)

O Google exige que o **primeiro AAB** seja enviado manualmente pelo console
(cria o package name). Depois disso o `eas submit` automatiza tudo.

1. Eu te passo o link do `.aab` do primeiro build (artifact do EAS)
2. Play Console → **Testing → Internal testing → Create new release**
3. Em **App signing**: aceitar **Play App Signing** (default — o Google guarda
   a chave de assinatura final; a upload key é a do EAS)
4. Upload do `.aab` → release name automático → **Next → Save and publish**
5. Aba **Testers**: criar lista de emails (até 100) → adicionar seu email e o
   dos testadores → salvar
6. Copiar o **opt-in link** (web) e mandar para os testadores — cada um aceita
   e instala pela Play Store. Disponível em minutos, sem review.

## Parte E — Comandos que só você pode rodar (terminal)

Rode direto nesta sessão do Claude com o prefixo `!`:

1. **Primeiro build Android** (gera o keystore gerenciado pelo EAS — interativo
   só na 1ª vez; responda "Yes" para "Generate a new Android Keystore"):
   ```
   ! cd repos/auraxis-app && npx eas-cli build --platform android --profile production
   ```
2. **Validar o certificado iOS** (destrava builds iOS non-interactive — causa
   da falha das tags v1.6.x; precisa do login Apple `felipe.italo@hotmail.com`):
   ```
   ! cd repos/auraxis-app && npx eas-cli credentials
   ```
   → escolher **iOS → production → Build credentials → Distribution Certificate**
   e deixar o EAS validar/criar.
3. **Autorizar o MCP do Sentry** (1 clique — me permite criar o projeto
   `auraxis-app` e gravar o DSN nas envs): abrir a URL OAuth que está no
   handoff da sessão (`.context/handoffs/`).

## Depois disso (volta pro Claude)

- [ ] Gravar `GOOGLE_SERVICE_ACCOUNT` como EAS secret file e validar `eas submit`
- [ ] Criar projeto Sentry + gravar `EXPO_PUBLIC_SENTRY_DSN`/`SENTRY_AUTH_TOKEN`
- [ ] Disparar o primeiro ciclo completo (store-release dispatch) e o smoke alfa
      (checklist em `docs/release-process.md`)
