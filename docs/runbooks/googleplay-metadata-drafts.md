# Google Play Console — Metadata drafts (PT-BR)

> **Status:** drafts prontos para colar. Italo refina/aprova ao preencher o console.
> **Issue tracker:** [#523](https://github.com/italofelipe/auraxis-app/issues/523)
> **Épico:** [#518](https://github.com/italofelipe/auraxis-app/issues/518)
> **Fonte adaptada:** `docs/runbooks/appstore-metadata-drafts.md` (App Store, issue #440)

Cada campo abaixo respeita o limite de caracteres do Play Console. Para o
**internal testing** (alfa) só os itens marcados ⭐ são obrigatórios — o resto
pode ser preenchido depois, antes do closed testing/produção.

---

## 1. Identificação básica ⭐

| Campo | Valor |
|:------|:------|
| App name (30 chars máx) | **Auraxis** |
| Default language | Portuguese (Brazil) — `pt-BR` |
| App or game | App |
| Free or paid | **Free** (assinatura via in-app depois; alfa não cobra) |
| Package name | `com.sensoriumit.auraxis` (definido pelo primeiro AAB enviado) |
| Category | Finance |
| Email de contato ⭐ | `suporte@auraxis.com.br` |

---

## 2. Short description (80 chars máx)

| Versão | Texto | Chars |
|:-------|:------|------:|
| **A** (recomendada) | `Finanças com clareza: gastos, metas e insights com IA em um só lugar.` | 70 |
| B (foco ação) | `Organize gastos, acompanhe metas e receba análises com IA. Simples assim.` | 74 |

---

## 3. Full description (4000 chars máx)

```
Auraxis — suas finanças com clareza

Controle seus gastos, acompanhe metas e entenda seu dinheiro com análises geradas por IA — tudo em um app simples e direto.

POR QUE O AURAXIS?

Diferente de planilhas e apps genéricos, o Auraxis aprende com seus dados e gera análises personalizadas com IA. Você não precisa categorizar tudo manualmente nem interpretar gráficos complexos: o app te diz, em linguagem simples, o que está acontecendo com seu dinheiro.

O QUE VOCÊ PODE FAZER

• Registrar e categorizar transações automaticamente
• Importar extratos bancários (CSV/OFX)
• Acompanhar orçamentos por categoria
• Criar metas financeiras com progresso visual
• Consolidar carteira de investimentos e patrimônio
• Receber insights de IA sobre padrões de gastos
• Ver relatórios mensais que fazem sentido
• Simular cenários financeiros

PRIVACIDADE EM PRIMEIRO LUGAR

• Não armazenamos número de cartão de crédito ou CVV
• Não vendemos seus dados para terceiros
• Não usamos seus dados para treinar modelos de IA
• Conformidade total com a LGPD

Você pode exportar e excluir seus dados a qualquer momento, direto no app.

PLANOS

• Free — funcionalidades essenciais, ideal para começar
• Premium Mensal — R$ 29,90/mês com renovação automática
• Premium Anual — R$ 287,04/ano (20% de desconto, equivalente a R$ 23,92/mês)
• Trial de 7 dias grátis no Premium para novos usuários

Cancele quando quiser. Direito de arrependimento de 7 dias garantido pelo CDC.

SUPORTE

Dúvidas, sugestões ou problemas? Escreva para suporte@auraxis.com.br ou use as configurações do app.

O Auraxis não substitui orientação profissional de contabilidade, jurídica ou de investimentos. Use os relatórios e simulações como apoio às suas decisões.
```

**Chars total**: ~1.700 (folga ampla).

---

## 4. URLs ⭐

| Campo | URL |
|:------|:----|
| Privacy Policy URL ⭐ (obrigatório) | `https://app.auraxis.com.br/privacy-policy` (live ✅, verificado 2026-06-11) |
| Website | `https://app.auraxis.com.br` |
| Terms (referência) | `https://app.auraxis.com.br/terms` (live ✅) |

---

## 5. App access ⭐ (conta de teste para o review do Google)

O app exige login, então o Play Console pede credenciais de demonstração
("All or some functionality is restricted").

| Campo | Valor |
|:------|:------|
| Instrução | `Login com email e senha. Use a conta demo abaixo.` |
| Username | `appreview@auraxis.com.br` (criar a conta em produção antes de submeter — mesma conta demo do App Store) |
| Password | _(gerar senha forte e guardar no 1Password; NUNCA commitar)_ |

---

## 6. Declarações do console ⭐ (respostas prontas)

| Declaração | Resposta | Justificativa |
|:-----------|:---------|:--------------|
| Ads | **No, my app does not contain ads** | Sem SDK de ads; Sentry/PostHog são diagnóstico/analytics |
| News app | No | |
| COVID-19 contact tracing | No | |
| Government app | No | |
| Target audience | **18+** | App financeiro; evita todo o regime de apps para crianças |
| Appeals to children | No | |
| Financial features | **Personal finance management / budgeting** — NÃO marcar banking, empréstimos, crédito ou crypto exchange | O app só organiza finanças pessoais; não movimenta dinheiro, não dá crédito, não custodia ativos |
| Health apps | No | |
| Data safety | Ver seção 7 | |

> ⚠️ **Financial features**: dependendo da região o formulário pede documentação
> para apps de "serviços financeiros". Selecionar apenas gestão/orçamento pessoal
> evita exigência de licença. Se o formulário forçar categoria, escolher a opção
> equivalente a "None of the above / personal budgeting tool".

---

## 7. Data Safety form ⭐ (espelho do Privacy Manifest iOS, PR #443)

### Visão geral

| Pergunta | Resposta |
|:---------|:---------|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS + SSL pinning) |
| Do you provide a way for users to request that their data is deleted? | **Yes** (exclusão de conta no app — `DELETE /user/me`; e exportação de dados) |

### Tipos de dados (Collected = Yes, Shared = No para todos)

| Data type | Coletado | Compartilhado | Processado de forma efêmera | Obrigatório ou opcional | Propósitos |
|:----------|:--------:|:-------------:|:---------------------------:|:------------------------|:-----------|
| Personal info → Email address | ✅ | ❌ | ❌ | Obrigatório (conta) | App functionality, Account management |
| Personal info → Name | ✅ | ❌ | ❌ | Obrigatório (conta) | Account management |
| Personal info → User IDs | ✅ | ❌ | ❌ | Obrigatório (conta) | App functionality, Account management |
| Financial info → Other financial info | ✅ | ❌ | ❌ | Obrigatório (é o produto) | App functionality |
| App activity → Other user-generated content | ✅ | ❌ | ❌ | Obrigatório | App functionality |
| App activity → App interactions | ✅ | ❌ | ❌ | Opcional (opt-out no Privacy Center) | Analytics, App functionality |
| App info and performance → Crash logs | ✅ | ❌ | ❌ | Opcional | App functionality |
| App info and performance → Diagnostics | ✅ | ❌ | ❌ | Opcional | App functionality |
| Device or other IDs | ✅ | ❌ | ❌ | Opcional | App functionality, Analytics |

**Não coletados**: localização, contatos, fotos/vídeos, áudio, arquivos,
calendário, SMS/chamadas, histórico de navegação, informações de saúde.

> Nota: Sentry e PostHog atuam como **service providers** (processadores) — no
> vocabulário do Data Safety isso NÃO conta como "sharing". Tracking
> cross-app/advertising: inexistente (`NSPrivacyTracking: false` no iOS).

---

## 8. Content rating questionnaire (IARC) ⭐

| Pergunta (resumo) | Resposta |
|:------------------|:---------|
| Categoria do questionário | **Utility, Productivity, Communication, or Other** |
| Violência | No |
| Sexualidade | No |
| Linguagem imprópria | No |
| Substâncias controladas | No |
| **Apostas/jogos de azar (real ou simulado)** | **No** — simulações financeiras não são gambling |
| Compra de itens digitais | **Yes** (assinatura Premium in-app futura) |
| Troca de informações pessoais entre usuários | No (sem social/UGC público) |
| Compartilha localização do usuário | No |

Rating esperado: **Livre (L)** no Brasil / Everyone.

---

## 9. Assets gráficos

| Asset | Spec | Status |
|:------|:-----|:-------|
| App icon ⭐ | 512×512 PNG, 32-bit | Gerar de `assets/images/icon.png` (1024×1024 → downscale) |
| Feature graphic | 1024×500 PNG/JPG, sem alpha | **Criar** — fundo da marca + logo + tagline "Finanças com clareza" |
| Phone screenshots | mín. 2 (até 8), 16:9 ou 9:16, lado menor ≥320px e maior ≤3840px | Capturar do emulador/dispositivo após 1º build (mesmos 8 fluxos do doc do App Store, seção 9) |
| Tablet 7"/10" screenshots | Opcional (recomendado se declarar suporte a tablet) | Adiar |

> Para **internal testing** os assets de listing ainda não bloqueiam a
> distribuição. Bloqueiam ao promover para closed/open/production.

---

## 10. Gotcha de conta pessoal nova (criada após nov/2023)

Contas **pessoais** do Play Console criadas recentemente precisam, antes de
liberar acesso a **produção**: closed testing com **≥12 testadores opted-in
por 14 dias contínuos**. Isso **não afeta o internal testing** (alfa atual).
Planejar: quando o alfa estabilizar, promover o mesmo grupo para closed testing
para começar a contar os 14 dias.
