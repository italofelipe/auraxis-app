# App Store Connect — Metadata drafts (PT-BR)

> **Status:** drafts. Italo refina/aprova antes de submeter ao App Store Connect.
> **Issue tracker:** [#440](https://github.com/italofelipe/auraxis-app/issues/440)
> **Parent epic:** [#436](https://github.com/italofelipe/auraxis-app/issues/436)

Este documento contém os textos PT-BR prontos para colar nos campos do App Store Connect quando o app for submetido para review. Cada draft tem limite de caracteres validado e versão alternativa (curta/longa) quando o limite é apertado.

---

## 1. Identificação básica

| Campo | Valor |
|:------|:------|
| App Name | **Auraxis** |
| Subtitle | _ver opções abaixo_ |
| Primary Language | Portuguese (Brazil) |
| Bundle ID | `com.sensoriumit.auraxis` |
| Category — Primary | **Finance** |
| Category — Secondary | **Productivity** |
| Age Rating | **4+** (no objectionable content) |

---

## 2. Subtitle (30 chars máx)

Aparece logo abaixo do nome do app na busca e na página. **Apenas 1** vai para review.

| Versão | Texto | Chars |
|:-------|:------|------:|
| **A** (foco produto) | `Finanças com clareza.` | 21 |
| **B** (foco IA) | `Suas finanças com IA.` | 21 |
| **C** (foco ação) | `Organize, planeje, conquiste.` | 29 |
| **D** (foco emoção) | `Tranquilidade financeira.` | 25 |

**Recomendação**: começar com **A** (mais neutro, vira evergreen). Trocar via `Promotional Text` se quiser destacar IA depois.

---

## 3. Promotional Text (170 chars máx)

Editável sem submeter para review. Use para destacar eventos, novidades ou promoções.

| Cenário | Texto | Chars |
|:--------|:------|------:|
| **Beta launch** | `Auraxis em beta fechado. Importe extratos, defina metas e receba insights de IA sobre seus gastos. Cadastre-se para vagas limitadas.` | 134 |
| **Lançamento público** | `Auraxis é seu controle financeiro pessoal com insights de IA. Importe extratos, organize gastos, defina metas e veja para onde seu dinheiro vai.` | 145 |
| **Promoção Premium** | `Trial de 7 dias grátis no Premium. Insights de IA ilimitados, importação bancária e relatórios avançados. Cancele quando quiser.` | 130 |

---

## 4. Description (4000 chars máx)

Texto principal da página do app. Versão completa abaixo (~1.800 chars — folga para iterações).

```
O Auraxis é o controle financeiro pessoal com insights de IA — feito para quem quer entender, organizar e crescer com suas finanças sem precisar virar contador.

PRINCIPAIS RECURSOS

• Importação de extratos
Cole, importe ou conecte (em breve) seus extratos bancários. Receba transações categorizadas automaticamente.

• Insights de IA
Análises automáticas sobre seus padrões de gasto, alertas de comportamento e sugestões personalizadas — sem dashboards confusos.

• Metas financeiras
Defina objetivos (viagem, reserva de emergência, compra grande) e acompanhe seu progresso visual.

• Carteira de investimentos
Registre operações, acompanhe rentabilidade e veja patrimônio consolidado em moeda local.

• Simulações
Calcule cenários de financiamento, parcelado vs à vista, e veja o real custo de oportunidade.

• Relatórios mensais
Visão clara de receitas, despesas, categorias e tendências — exportável quando você precisar.

POR QUE AURAXIS

Diferente de planilhas e apps genéricos, o Auraxis aprende com seus dados e gera análises personalizadas com IA. Você não precisa categorizar tudo manualmente nem interpretar gráficos complexos: o app te diz, em linguagem simples, o que está acontecendo com seu dinheiro.

PRIVACIDADE EM PRIMEIRO LUGAR

• Não armazenamos número de cartão de crédito ou CVV
• Não vendemos seus dados para terceiros
• Não usamos seus dados para treinar modelos de IA
• Conformidade total com a LGPD

Você pode exportar e excluir seus dados a qualquer momento.

PLANOS

• Free — funcionalidades essenciais, ideal para começar
• Premium Mensal — R$ 29,90/mês com renovação automática
• Premium Anual — R$ 287,04/ano (20% de desconto, equivalente a R$ 23,92/mês)
• Trial de 7 dias grátis no Premium para novos usuários

Cancele quando quiser. Direito de arrependimento de 7 dias garantido pelo CDC.

SUPORTE

Dúvidas, sugestões ou problemas? Entre em contato pelo email suporte@auraxis.com.br ou pelas configurações do app.

---

O Auraxis não substitui orientação profissional de contabilidade, jurídica ou investimentos. Use os relatórios e simulações como apoio às suas decisões.
```

**Chars total**: ~1.823 (folga: ~2.177 chars para futuras iterações).

---

## 5. Keywords (100 chars máx, separados por vírgula, sem espaço)

Aparecem na busca interna do App Store. **Não use** o nome do app, palavras genéricas demais (\"app\", \"finanças\" sozinho) ou repetição de subtitle/title.

```
orcamento,economia,gastos,metas,extrato,categorizacao,IA,investimentos,patrimonio,relatorios,LGPD
```

**Chars**: 99/100. Estratégia: combina termos de **intent** (orçamento, economia, metas), **feature** (extrato, categorização, relatórios) e **diferencial** (IA, LGPD).

---

## 6. URLs

| Campo | URL |
|:------|:----|
| **Support URL** (obrigatório) | `https://app.auraxis.com.br/suporte` (ou `mailto:suporte@auraxis.com.br` enquanto não tiver página) |
| **Marketing URL** (opcional) | `https://app.auraxis.com.br` |
| **Privacy Policy URL** (obrigatório) | `https://app.auraxis.com.br/privacy-policy` |

> ⚠️ Privacy Policy URL **DEVE** estar acessível antes de submeter. Auraxis já tem (`auraxis-web` rota `/privacy-policy`).

---

## 7. What's New (versão inicial, 4000 chars máx)

Texto da primeira versão. Em updates futuros, foca nas mudanças do release.

```
Versão 1.0 — Bem-vindo ao Auraxis

Esta é a primeira versão pública do Auraxis. Inclui:

• Cadastro e login seguros
• Importação de extratos bancários
• Categorização automática de transações
• Insights de IA sobre seus gastos
• Metas financeiras com progresso visual
• Carteira de investimentos e patrimônio consolidado
• Relatórios mensais
• Simulações de cenários financeiros

Plano Premium com trial de 7 dias grátis disponível.

Encontrou algum problema ou tem sugestão? Escreva para suporte@auraxis.com.br — lemos todas as mensagens.
```

---

## 8. App Review Information (para a Apple)

Campos visíveis apenas para o time de review. Importantes para evitar rejection.

| Campo | Valor |
|:------|:------|
| First Name | Italo |
| Last Name | Felipe |
| Phone Number | _(seu telefone)_ |
| Email | suporte@auraxis.com.br |
| Sign-in Required | Yes |
| **Demo Account Username** | `appreview@auraxis.com.br` (criar conta de teste antes de submeter) |
| **Demo Account Password** | _(gerar senha forte, 1Password)_ |
| **Notes** | _ver bloco abaixo_ |

### Notes (texto sugerido)

```
O Auraxis é um app de controle financeiro pessoal com insights gerados por IA. Para revisar:

1. Use a conta demo fornecida (appreview@auraxis.com.br).
2. Após login, navegue pelo Dashboard, Transações, Metas e Carteira.
3. Para testar o paywall do Premium, acesse Configurações > Assinatura. O fluxo de checkout usa Asaas como provedor (sandbox em modo de teste).
4. Para testar Insights de IA, abra a tela "Insights" no dashboard. As análises são geradas por OpenAI com dados minimizados.
5. Não é necessário inserir dados bancários reais — a importação de extrato aceita arquivos CSV/OFX de exemplo.

Dados pessoais coletados estão documentados na Política de Privacidade (https://app.auraxis.com.br/privacy-policy). Não fazemos tracking nem combinamos dados com terceiros para advertising.

Suporte: suporte@auraxis.com.br
```

---

## 9. Screenshots — requirements

| Device | Resolução | Quantidade mín. | Quantidade ideal |
|:-------|:----------|---------------:|----------------:|
| iPhone 6.7" (15 Pro Max / 14 Plus / 13 Pro Max) | 1290 × 2796 | 3 | 6-8 |
| iPhone 6.5" (XS Max / 11 Pro Max) | 1242 × 2688 | 3 | 6-8 |
| iPhone 5.5" (8 Plus / 7 Plus) | 1242 × 2208 | 3 | 6-8 |
| iPad 12.9" (Pro) | 2048 × 2732 | 3 (se `supportsTablet: true`) | 4-6 |

> 💡 Apple aceita gerar 6.5" e 5.5" automaticamente a partir do 6.7" — capture só o 6.7" e marque opção \"Use 6.7\" screenshots for other devices\".

### Fluxos sugeridos (1 screenshot cada)

1. **Login / boas-vindas** — primeira impressão, com mensagem clara
2. **Dashboard principal** — visão consolidada (saldo, gastos do mês, próximas contas)
3. **Insights de IA** — destaca o diferencial (badge "AI" + análise textual)
4. **Importação de extrato** — passo a passo simples
5. **Metas** — barra de progresso, valor objetivo, prazo
6. **Carteira** — gráfico de pizza por ativo, total consolidado
7. **Relatório mensal** — gráfico de tendência, breakdown por categoria
8. **Premium / paywall** — comparação Free vs Premium, CTA claro

### Localized text overlays (opcional mas recomendado)

Cada screenshot pode ter um título sobreposto. Sugestões PT-BR:

1. `Tudo o que importa, na palma da mão`
2. `Saiba para onde seu dinheiro vai`
3. `Análises com IA, sem complicação`
4. `Importe extratos em segundos`
5. `Suas metas, com progresso real`
6. `Carteira completa, em um lugar`
7. `Relatórios que fazem sentido`
8. `Faça mais com Premium`

---

## 10. App Privacy Details (App Store Connect form)

Esses dados são preenchidos no questionário "App Privacy" do App Store Connect e devem refletir o `PrivacyInfo.xcprivacy` (ver PR italofelipe/auraxis-app#443).

| Pergunta | Resposta |
|:---------|:---------|
| Do you or third-party partners collect data from this app? | **Yes** |
| Data Used to Track You | **None** (NSPrivacyTracking: false) |
| Data Linked to You | Email, Name, User ID, Other Financial Info, Other User Content |
| Data Not Linked to You | Crash Data, Performance Data, Other Diagnostic Data, Device ID, Product Interaction |

### Propósitos por categoria

| Data Type | Linked | Purposes |
|:----------|:------:|:---------|
| Email Address | ✅ | App Functionality, Account Management |
| Name | ✅ | Account Management |
| User ID | ✅ | App Functionality, Account Management |
| Other Financial Info | ✅ | App Functionality |
| Other User Content | ✅ | App Functionality |
| Crash Data | ❌ | App Functionality |
| Performance Data | ❌ | App Functionality |
| Other Diagnostic Data | ❌ | App Functionality |
| Device ID | ❌ | App Functionality, Analytics |
| Product Interaction | ❌ | Analytics, App Functionality |

---

## 11. Checklist final antes de submeter

- [ ] App Name aprovado (sem typos)
- [ ] Subtitle escolhido (A, B, C ou D)
- [ ] Promotional Text inicial definido
- [ ] Description revisada e dentro do limite
- [ ] Keywords revisadas (sem repetições com title/subtitle)
- [ ] 3 URLs ativas e acessíveis (Support, Marketing, Privacy Policy)
- [ ] What's New escrito
- [ ] Demo account criada e funcional
- [ ] Demo account credentials guardadas em 1Password
- [ ] Screenshots capturados em 6.7" (mínimo 3, ideal 6-8)
- [ ] App Privacy Details form preenchido coerente com PrivacyInfo
- [ ] Build EAS já passou em smoke local
- [ ] PrivacyInfo.xcprivacy validado no .ipa (ver #439)

---

## 12. Próximos passos após submit

1. Apple processa build em ~30-60 min após upload via EAS Submit
2. Apple Review tipicamente em 24-48h (primeira submissão pode demorar mais)
3. Se rejeitado: ler reject reason no email, ajustar, ressubmeter
4. Se aprovado: TestFlight Internal Testing fica disponível imediatamente para os 5-10 testers
5. External Testing (até 10k) exige review separada da build pelo time Apple

## Referências

- App Store Connect Help: https://developer.apple.com/help/app-store-connect/
- App Information requirements: https://developer.apple.com/app-store/app-information/
- Privacy Manifest Files: https://developer.apple.com/documentation/bundleresources/privacy_manifest_files
- Pricing canônico: ADR italofelipe/auraxis-platform#669
- Privacy Policy / Terms updates: italofelipe/auraxis-platform#750
