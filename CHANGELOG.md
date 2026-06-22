# Changelog

## [1.11.0](https://github.com/italofelipe/auraxis-app/compare/v1.10.0...v1.11.0) (2026-06-22)


### Features

* **animations:** add bar-grow animation hook for data viz ([1785e5e](https://github.com/italofelipe/auraxis-app/commit/1785e5e0512f212d448c89412c863e74838384c0))
* **insights:** add fluida beat components (compare, chart, pull-stat) ([d6eee2c](https://github.com/italofelipe/auraxis-app/commit/d6eee2cba57137e187bb37c659b8e94169fd753d))
* **insights:** add fluida etapa-2 vm, sign and series logic ([9f54679](https://github.com/italofelipe/auraxis-app/commit/9f54679273ef31c30a77313d21a2372c74a44d72))
* **insights:** add fluida masthead and editorial lead (etapa 1) ([7ba1e30](https://github.com/italofelipe/auraxis-app/commit/7ba1e3005cf7695938f6a442683e93ae291f0c41)), closes [#599](https://github.com/italofelipe/auraxis-app/issues/599)
* **insights:** add pure insightToFluidaVM mapper with mock fallback ([7bea7fb](https://github.com/italofelipe/auraxis-app/commit/7bea7fbd718b07e560d976fb71d9157cf783d54f))
* **insights:** add shared InsightSection + compact recorte logic ([55e400f](https://github.com/italofelipe/auraxis-app/commit/55e400fd8eba8f860f6df0d72e6c15a6bfbdd616)), closes [#605](https://github.com/italofelipe/auraxis-app/issues/605)
* **insights:** animate fluida chart bars growing from baseline ([ab2b5b8](https://github.com/italofelipe/auraxis-app/commit/ab2b5b8e2ab885e71a60428b5f582d8623c372e7))
* **insights:** compose fluida etapa-2 beats into the screen ([86c2c93](https://github.com/italofelipe/auraxis-app/commit/86c2c9330d094bfcc1390e54af26e107cea08386)), closes [#601](https://github.com/italofelipe/auraxis-app/issues/601)
* **insights:** conectar a tela Fluida aos dados reais da IA (mock-&gt;DTO) ([69804f1](https://github.com/italofelipe/auraxis-app/commit/69804f15975a4e99f8322e6c9b4a43089c189004))
* **insights:** etapa 4 — recorte de insights por página de feature ([f1babd6](https://github.com/italofelipe/auraxis-app/commit/f1babd6604fbc9561f87051435af6f74425ad5db))
* **insights:** expose section selector and deep-link the Fluida screen ([9841037](https://github.com/italofelipe/auraxis-app/commit/984103700026e13ead59d5627eee8aad95946c59)), closes [#605](https://github.com/italofelipe/auraxis-app/issues/605)
* **insights:** fluida — etapa 1 (masthead + lead editorial) ([b374486](https://github.com/italofelipe/auraxis-app/commit/b374486bade8815146106ac4de984411f5605560))
* **insights:** fluida etapa 3 — refino de cadência e temas ([6aa8dda](https://github.com/italofelipe/auraxis-app/commit/6aa8dda192008ad541d28e7b3fb10426507ebee9))
* **insights:** gate fluida screen behind app.insights.fluida flag ([c55044b](https://github.com/italofelipe/auraxis-app/commit/c55044b80f716a86223480f0abada2f2e8f78613)), closes [#599](https://github.com/italofelipe/auraxis-app/issues/599)
* **insights:** Insights Fluida — etapa 2 (beats: comparativos, gráfico, pull-stat) ([509c55f](https://github.com/italofelipe/auraxis-app/commit/509c55f25f71bd773615de712badbe24cf505a7f))
* **insights:** map additive fluida fields in insight contract ([678be6e](https://github.com/italofelipe/auraxis-app/commit/678be6e2577573aff49d03fbc0f829837c5c3e74)), closes [#607](https://github.com/italofelipe/auraxis-app/issues/607)
* **insights:** plug InsightSection into the five feature pages ([e90f5b8](https://github.com/italofelipe/auraxis-app/commit/e90f5b831c098cd8efb213583c68933d7f819a4d)), closes [#605](https://github.com/italofelipe/auraxis-app/issues/605)
* **insights:** wire fluida screen and section to the real insight ([7824394](https://github.com/italofelipe/auraxis-app/commit/78243946248dea0696cde17e9bc10241268e41c5))
* **insights:** wire real editorial lead into fluida vm ([aff088c](https://github.com/italofelipe/auraxis-app/commit/aff088c09c08d7921cf8ff6e55b20dc400e9a93e))
* **theme:** add severity-subtle tokens and newsreader serif font ([b5758f6](https://github.com/italofelipe/auraxis-app/commit/b5758f6bfa034a1ad7b111f95e63f17ae1e60244)), closes [#599](https://github.com/italofelipe/auraxis-app/issues/599)
* **transactions:** add invoice-badge helper for credit-card feed rows ([c5a20c6](https://github.com/italofelipe/auraxis-app/commit/c5a20c6cab2b07acb14de4a064caf912f2eb07ed)), closes [#597](https://github.com/italofelipe/auraxis-app/issues/597)
* **transactions:** animações de entrada transform-only no feed ([#596](https://github.com/italofelipe/auraxis-app/issues/596)) ([4350026](https://github.com/italofelipe/auraxis-app/commit/435002604a669e841a57991c1a51f2ae3578b472))
* **transactions:** derive invoiceBadgeMonth in the feed view-model ([397f65c](https://github.com/italofelipe/auraxis-app/commit/397f65ceff8afbad5ae356b1583c9c7139990597)), closes [#597](https://github.com/italofelipe/auraxis-app/issues/597)
* **transactions:** redesign da tela de Transações (feed Fácil/Analítico) ([#591](https://github.com/italofelipe/auraxis-app/issues/591)) ([6780859](https://github.com/italofelipe/auraxis-app/commit/67808596187282fd072b581c33a9f85c4fc9e939))
* **transactions:** render discreet "fatura {month}" chip on feed cards ([c1b25d4](https://github.com/italofelipe/auraxis-app/commit/c1b25d406331ecb4f0a6a779860796014df588c0)), closes [#597](https://github.com/italofelipe/auraxis-app/issues/597)
* **transactions:** selo "fatura {mês}" em lançamentos de cartão no feed ([c93b794](https://github.com/italofelipe/auraxis-app/commit/c93b794da7ec67a74bada286fdab18b379f4d56a))

## [1.10.0](https://github.com/italofelipe/auraxis-app/compare/v1.9.0...v1.10.0) (2026-06-21)


### Features

* **credit-cards:** redesign da área de Cartões + onboarding guiado ([#589](https://github.com/italofelipe/auraxis-app/issues/589)) ([640af6d](https://github.com/italofelipe/auraxis-app/commit/640af6dc7c910ed4f56f108da2c5605f5e9ff643))
* **navigation:** tab bar refinada premium — indicador deslizante + glow (OTA) ([#571](https://github.com/italofelipe/auraxis-app/issues/571)) ([1aa05a5](https://github.com/italofelipe/auraxis-app/commit/1aa05a504628e37dbe3337d7bdc46277a4109a41))
* **transactions:** linha compacta com swipe + header colapsado (OTA) ([#572](https://github.com/italofelipe/auraxis-app/issues/572)) ([4c8bcb8](https://github.com/italofelipe/auraxis-app/commit/4c8bcb85b46d956d17235df562a0c01670f3dde9))


### Bug Fixes

* **ci:** pass --environment to eas update so OTA bundles keep EXPO_PUBLIC vars ([0d21a89](https://github.com/italofelipe/auraxis-app/commit/0d21a89e3529aaa503df049d55ed5387d05a14df))
* **navigation:** revert heavy active-tab pill to light color indicator and stop label wrap ([efdfdd2](https://github.com/italofelipe/auraxis-app/commit/efdfdd2469ceb63dcca74b7977850d0b39e1fc78))

## [1.9.0](https://github.com/italofelipe/auraxis-app/compare/v1.8.0...v1.9.0) (2026-06-13)


### Features

* **auth,transactions:** glow the primary login and create-transaction CTAs ([#562](https://github.com/italofelipe/auraxis-app/issues/562)) ([23fd51d](https://github.com/italofelipe/auraxis-app/commit/23fd51d899a8a314b1c5a05c7870f48e536e9209))
* **dashboard:** month period chips and glow the balance hero card ([d8d2104](https://github.com/italofelipe/auraxis-app/commit/d8d21047d38506a0129b13f89f133b1767cd5521))
* **ui:** allow AppPeriodChips to wrap for many options ([ef6ddfe](https://github.com/italofelipe/auraxis-app/commit/ef6ddfe41183cd336a1fe72ebdda5f11df71d07e))

## [1.8.0](https://github.com/italofelipe/auraxis-app/compare/v1.7.0...v1.8.0) (2026-06-13)


### Features

* **design:** F1 — tokens do web (light teal), Inter + IBM Plex Mono e FIX da resolução de temas Tamagui ([3f9ed38](https://github.com/italofelipe/auraxis-app/commit/3f9ed38b5444afbcb59b6f051bb4867a18811a1e))
* **design:** port web DS tokens (light teal default, Inter + IBM Plex Mono) and fix Tamagui theme resolution ([8c5b50f](https://github.com/italofelipe/auraxis-app/commit/8c5b50f333b17b85b12c0e1e628de94863c0872d))
* **navigation:** F2 — tab bar nova (Dashboard · Transações · [+] · Planejar · Mais) ([94ae94c](https://github.com/italofelipe/auraxis-app/commit/94ae94cf46705c21485f32178a5a90f37edd7530))
* **navigation:** redesigned tab bar with quick-create center action, planning segment and more hub ([c5337de](https://github.com/italofelipe/auraxis-app/commit/c5337def8de39904b08226bcfda6ef625fac4e32))
* **navigation:** refine tab bar with active pill, larger icons and brand glow ([3a3ae18](https://github.com/italofelipe/auraxis-app/commit/3a3ae181b81790205bb4ca6f864d872ddbf14636))
* **profile:** persist theme preference on appearance change ([1be3775](https://github.com/italofelipe/auraxis-app/commit/1be37755fba3f25a949f80abc79f3092eae2496a))
* **shell:** hydrate persisted theme on startup before ready ([77f5fdd](https://github.com/italofelipe/auraxis-app/commit/77f5fdd9a2d92fefc8b1f1335a064235aec938fe))
* **theme:** add gradient, glow and motion tokens with light/dark parity ([032638e](https://github.com/italofelipe/auraxis-app/commit/032638e4b759139560c7292f536307873333bfbe))
* **theme:** add SecureStore-backed theme preference storage ([e12c2d4](https://github.com/italofelipe/auraxis-app/commit/e12c2d42f5f8eab07817459fd5e68ccd99526414))
* **theme:** add subdued token and extend AppText/AppHeading scale ([7194d00](https://github.com/italofelipe/auraxis-app/commit/7194d001cf6cd67e158a73f83859cdf50dcd75d4))
* **ui:** add AppButton size/glow/press-scale and fix cramped padding ([d5d671d](https://github.com/italofelipe/auraxis-app/commit/d5d671d8448d130e4487e3a38ca127cbfbc93bf5))
* **ui:** add AppReveal stagger entrance and AppPeriodChips segmented ([7af8ecb](https://github.com/italofelipe/auraxis-app/commit/7af8ecbb261a9c1164371fe7f2d7348a0afa704d))
* **ui:** add AppScreen density with comfortable default spacing ([2a82ceb](https://github.com/italofelipe/auraxis-app/commit/2a82cebc8aa50cfd486ebd4488492824635cb25b))
* **ui:** add card variants, brand glow and mono metric value ([d91b10d](https://github.com/italofelipe/auraxis-app/commit/d91b10d9ddf070a1d6efa591d747603e513b6135))
* **ui:** animated splash, scroll fix on all screens and web-parity login hero ([0f3e4c9](https://github.com/italofelipe/auraxis-app/commit/0f3e4c972f5afc8ef9e3b98d4a439b4a4c708ae4))
* **ui:** F3 splash animado + fix de scroll global + login com hero (paridade web) ([79274ef](https://github.com/italofelipe/auraxis-app/commit/79274ef38677b9ddb74bbfd3d09a89b3b270e236))


### Bug Fixes

* **ci:** add timeout guard-rails and non-interactive env to expo export jobs ([e0b2878](https://github.com/italofelipe/auraxis-app/commit/e0b2878b59db29553b668497e05b9d568664d48d))
* **ci:** capturar exit do KILL para a validação do artefato rodar (bash -e) ([fad71f2](https://github.com/italofelipe/auraxis-app/commit/fad71f2b2aa1fe61e0f1c5aa7c1f3fc7015bbe12))
* **ci:** capture export kill exit code so artifact validation runs under bash -e ([63adce3](https://github.com/italofelipe/auraxis-app/commit/63adce352d18951063c82303dea012b7f026d21b))
* **ci:** kill expo export on post-export teardown hang and validate artifact ([0b191ad](https://github.com/italofelipe/auraxis-app/commit/0b191add2981571894adcebfffc5c279fb32e9ca))
* **ci:** timeout guard-rails nos jobs de expo export (mitigação [#510](https://github.com/italofelipe/auraxis-app/issues/510)) ([dcb7c76](https://github.com/italofelipe/auraxis-app/commit/dcb7c763e1968a646b1713327ff11773650209a6))
* **errors:** componentStack nos detalhes técnicos + initPostHog defensivo (diagnóstico v2) ([4524d51](https://github.com/italofelipe/auraxis-app/commit/4524d512cb1de47f76ec726dbc7b52baad6e6b28))
* **errors:** detalhes técnicos nos error boundaries de tela cheia (diagnóstico alfa) ([ef8dadd](https://github.com/italofelipe/auraxis-app/commit/ef8dadd3585b8bd4e5e09ea8d2b9d377f1a1b11c))
* **errors:** expose technical details on full-screen error boundaries for alpha diagnostics ([ea7f879](https://github.com/italofelipe/auraxis-app/commit/ea7f879962f78735f4b464828894a1eb24e66147))
* **errors:** show component stack in boundary diagnostics and harden posthog init ([d823a0f](https://github.com/italofelipe/auraxis-app/commit/d823a0f1ac8858963f38d4497be621f6fb7864b3))
* **goals:** envelope real do Flask (items + Decimal-string) + guard central de isEmpty ([e3cca7a](https://github.com/italofelipe/auraxis-app/commit/e3cca7a91619a8e1bbdbf0117e6ea30f1d4cb940))
* **goals:** unwrap real Flask envelope (items + decimal strings) and guard isEmpty centrally ([56b8b4a](https://github.com/italofelipe/auraxis-app/commit/56b8b4afe39ed9e87ca95f9bca0f330170beb4f7))
* **release:** resolve submit credentials via EAS credentials service instead of runner env vars ([f98cd14](https://github.com/italofelipe/auraxis-app/commit/f98cd14e16caf5ff16552a85f3658a5e5cab3257))
* **release:** submit usa EAS credentials service (env vars não existem no runner) ([aef1a51](https://github.com/italofelipe/auraxis-app/commit/aef1a51d9f94abd7fbb067df49e482abfdbc4f76))
* **runtime:** desligar React Compiler — corrompia ordem de hooks em release (crash área pública) ([3583400](https://github.com/italofelipe/auraxis-app/commit/3583400e459fb9df3d2a5acad310237b3d377779))
* **runtime:** disable experimental React Compiler that corrupts hook order in release builds ([3af17eb](https://github.com/italofelipe/auraxis-app/commit/3af17eb8cc33cca7aba21b3fd680fb0993ef152b))
* **theme:** default light explícito (paridade com o web) independente do dark mode do aparelho ([4cd789b](https://github.com/italofelipe/auraxis-app/commit/4cd789be6186f5483dfc69c0fc22bcf52ccf8006))
* **theme:** default to light preference for web parity regardless of device scheme ([70342a1](https://github.com/italofelipe/auraxis-app/commit/70342a174f4ee16206e4506e9fddda88d1946834))
* **transactions:** filtros + insight rolam com a lista (FlashList header) ([e249a83](https://github.com/italofelipe/auraxis-app/commit/e249a83ec6f299bfa2d012ceacb399579b20a245))
* **transactions:** scroll filters and insight with the list via FlashList header ([db355f1](https://github.com/italofelipe/auraxis-app/commit/db355f1e3868cdde8feb9677f939bb4ee8e2129a))
* **ui:** use pressStyle scale instead of wrapper to preserve button flex ([23293cb](https://github.com/italofelipe/auraxis-app/commit/23293cb8d7d178d9399b4228440701bef2b717a8))

## [1.7.0](https://github.com/italofelipe/auraxis-app/compare/v1.6.1...v1.7.0) (2026-06-11)


### Features

* **budgets:** detail controller with period transaction preview ([9b5df85](https://github.com/italofelipe/auraxis-app/commit/9b5df853db9c13c921a96f9103066cfa4cf7c14d))
* **budgets:** detail screen (usage, period, tag, transaction preview) ([2463f03](https://github.com/italofelipe/auraxis-app/commit/2463f032cf0d8052ca8276eb260bab535e9dd71b))
* **budgets:** painel de detalhe + preview de transações + saúde/risco (paridade web) ([cc3c2e0](https://github.com/italofelipe/auraxis-app/commit/cc3c2e0ca0355c3959b89868360ab6f5e1975016))
* **budgets:** risk classification + sort by risk + period range helpers ([f44ac37](https://github.com/italofelipe/auraxis-app/commit/f44ac37438f98480e049ecbbddd50fa8a18be6ca))
* **budgets:** risk sort + 3-tier badges + consolidated health bar + detail nav ([b3da07c](https://github.com/italofelipe/auraxis-app/commit/b3da07c3709898864d004027e345581ddde64ee4))
* **contracts:** register spending-patterns endpoints ([4d19760](https://github.com/italofelipe/auraxis-app/commit/4d19760791bcd39a1306b8d81e696e69f1a38513))
* **contracts:** register weekly-summary endpoint ([8fc8ea7](https://github.com/italofelipe/auraxis-app/commit/8fc8ea7d003bdd999593dcdd0f3381e7f421cc9f))
* **credit-cards:** tela de detalhe do cartão (info, ciclo, utilização) — paridade web ([#517](https://github.com/italofelipe/auraxis-app/issues/517)) ([1f5f528](https://github.com/italofelipe/auraxis-app/commit/1f5f52812b36dacf8172ad4c9c98d07efb02d0f9))
* **goals:** goal detail screen (progress, plan, projection, AI surface) ([cabf8b7](https://github.com/italofelipe/auraxis-app/commit/cabf8b73612c947e65708f39af2a660238707007))
* **goals:** goal detail screen controller with progress + nav ([0abf3a3](https://github.com/italofelipe/auraxis-app/commit/0abf3a313d9e13a2224647e05351325d4550aa4d))
* **goals:** link goal list items to detail screen ([f80a16e](https://github.com/italofelipe/auraxis-app/commit/f80a16ed618d9080da3e2658f14f807dca55a4e7))
* **goals:** tela de detalhe de meta (progresso, plano, projeção, navegação) ([d5a0af3](https://github.com/italofelipe/auraxis-app/commit/d5a0af3e2a19521d28701223ad44408451af41df))
* **navigation:** add budget detail route builder ([ee8c1c7](https://github.com/italofelipe/auraxis-app/commit/ee8c1c73a20b7efea4ff3eb645e55bca8e260e5f))
* **navigation:** add goal detail route builder ([42c9ff3](https://github.com/italofelipe/auraxis-app/commit/42c9ff3114eb53c986ee36bd082602f36d96d71f))
* **observability:** add transaction.paid analytics event ([d3e4a00](https://github.com/italofelipe/auraxis-app/commit/d3e4a008f5e7a566926ad11906ed48e28f51c504))
* **spending-patterns:** mount radar card on dashboard + coverage/sonar ([cfa6b53](https://github.com/italofelipe/auraxis-app/commit/cfa6b53b40cd06b0e36f6f5f0f9f581ed8767edb))
* **spending-patterns:** quota-free latest query + dashboard radar card ([f8b6176](https://github.com/italofelipe/auraxis-app/commit/f8b61765b0c524f4cebef452fb05233dae36e348))
* **spending-patterns:** radar de gastos como feature dedicada + card no dashboard ([830ecdb](https://github.com/italofelipe/auraxis-app/commit/830ecdb9f3f220c63a345584e16ea8dccc2a43de))
* **spending-patterns:** service (getLatest/detect) + LGPD-safe inputs + severity rank ([4a3a621](https://github.com/italofelipe/auraxis-app/commit/4a3a62141a4b1f4e5607b6a5d0bd651058bc4d60))
* **transactions:** filter bar + pay/delete confirmation modals ([364495b](https://github.com/italofelipe/auraxis-app/commit/364495b26c565ee4c200e949723889b5b64598d9))
* **transactions:** filtros avançados, marcar como pago e exclusão por escopo ([dc2e3ba](https://github.com/italofelipe/auraxis-app/commit/dc2e3baca42c10e204aa20904ff17feac55f29e7))
* **transactions:** mark-paid mutation + scoped delete variables ([fc85a20](https://github.com/italofelipe/auraxis-app/commit/fc85a20170cb0076042c9b30017a905275917688))
* **transactions:** server-side filters (status/tag/month) + mark-paid + scoped delete no controller ([52a3bb3](https://github.com/italofelipe/auraxis-app/commit/52a3bb3472ea1efe977919a2bc67b9bce8b67e49))
* **transactions:** service mark-paid PATCH + delete scope param ([5084a02](https://github.com/italofelipe/auraxis-app/commit/5084a02b524d19ed7605bc2260ae79b16bbd2c2a))
* **transactions:** wire filters, pay action and scoped delete into screen ([4303e09](https://github.com/italofelipe/auraxis-app/commit/4303e09b99c776a49636228321fdff84fc182624))
* **weekly-snapshot:** digest semanal premium como feature dedicada + card no dashboard ([41625bf](https://github.com/italofelipe/auraxis-app/commit/41625bf20c495442f8ed0a5b41bdf86f7c2071e7))
* **weekly-snapshot:** entitlement-gated query + card controller + premium dashboard card ([208df1e](https://github.com/italofelipe/auraxis-app/commit/208df1e550601290ea74d77bbc24f9b644745369))
* **weekly-snapshot:** mount premium card on dashboard + coverage/sonar ([95df915](https://github.com/italofelipe/auraxis-app/commit/95df915643a6e3f9c9d99ac3e65c03ab9322283a))
* **weekly-snapshot:** service + change-detection signature + seen storage ([abdc224](https://github.com/italofelipe/auraxis-app/commit/abdc2245978265ed1bcd96cdee6ea2ae96a4db07))

## [1.6.1](https://github.com/italofelipe/auraxis-app/compare/v1.6.0...v1.6.1) (2026-06-05)


### Bug Fixes

* **graphql:** regenerate codegen types to match API schema ([afdfe56](https://github.com/italofelipe/auraxis-app/commit/afdfe5676a2baaad523109c1ffc224901eb1329c))

## [1.6.0](https://github.com/italofelipe/auraxis-app/compare/v1.5.0...v1.6.0) (2026-05-30)


### Features

* add channel-aware checkout gates ([#397](https://github.com/italofelipe/auraxis-app/issues/397)) ([d490fef](https://github.com/italofelipe/auraxis-app/commit/d490fef4a63a989687820e909a5ef187f2b0f46c))
* add contextual AI insights hub ([#435](https://github.com/italofelipe/auraxis-app/issues/435)) ([3f2321c](https://github.com/italofelipe/auraxis-app/commit/3f2321c34a821292c1271bb540ed9b4e8998509f))
* add credit cards bill hub ([#434](https://github.com/italofelipe/auraxis-app/issues/434)) ([4945028](https://github.com/italofelipe/auraxis-app/commit/4945028c79ff4639a7b074eeac6b90e0d36eceb3))
* add csv xlsx import flow ([#413](https://github.com/italofelipe/auraxis-app/issues/413)) ([3632f1f](https://github.com/italofelipe/auraxis-app/commit/3632f1fc53a4dd1bae3074428d3bad987cfb1c11))
* add mobile analytics facade ([#409](https://github.com/italofelipe/auraxis-app/issues/409)) ([6209322](https://github.com/italofelipe/auraxis-app/commit/6209322e31df00d0ebf052317f4153c105ce4b9a))
* add mobile privacy center ([#405](https://github.com/italofelipe/auraxis-app/issues/405)) ([54fbbfc](https://github.com/italofelipe/auraxis-app/commit/54fbbfcfd6347b7e42db674daf007038138a0d53))
* add push notifications registration ([#402](https://github.com/italofelipe/auraxis-app/issues/402)) ([0baea09](https://github.com/italofelipe/auraxis-app/commit/0baea092be0d601853255fa7cd54840c9ef0bf4d))
* align app theme with ds v3 ([#431](https://github.com/italofelipe/auraxis-app/issues/431)) ([0ce0b0c](https://github.com/italofelipe/auraxis-app/commit/0ce0b0cd5d5fdd8365f39232da24f2f67b75fe60))
* **app:** add iOS Privacy Manifest (iOS 17+) for App Store submission ([#443](https://github.com/italofelipe/auraxis-app/issues/443)) ([950364e](https://github.com/italofelipe/auraxis-app/commit/950364ed2b3a28ad051226c3b23fdf9df8b7bc60))
* enforce deep link allowlist ([#417](https://github.com/italofelipe/auraxis-app/issues/417)) ([7050a6a](https://github.com/italofelipe/auraxis-app/commit/7050a6a02c24f533f5a49c3d2b048f1b37f940f0))
* gate checkout with biometrics ([#425](https://github.com/italofelipe/auraxis-app/issues/425)) ([5c1cdf9](https://github.com/italofelipe/auraxis-app/commit/5c1cdf996b780b9dd3337c6b09a9fcd79c9ae06a))
* refresh sessions after unauthorized responses ([#418](https://github.com/italofelipe/auraxis-app/issues/418)) ([9229d20](https://github.com/italofelipe/auraxis-app/commit/9229d20de15e06b68d8b404e83ee0980c983929f))
* **release:** wire eas.json EAS Update channels + store-release.yml tag trigger ([#458](https://github.com/italofelipe/auraxis-app/issues/458)) ([f57ae1d](https://github.com/italofelipe/auraxis-app/commit/f57ae1dd2acb26e60e5e6d7a0eab01fa067ba1ec)), closes [#454](https://github.com/italofelipe/auraxis-app/issues/454)
* **sentry:** dev opt-in + env-aware tracesSampleRate + .env.example (R2/3.1b) ([#451](https://github.com/italofelipe/auraxis-app/issues/451)) ([ffceb74](https://github.com/italofelipe/auraxis-app/commit/ffceb7416a14d201964d9ff03d826092231a88d5)), closes [#450](https://github.com/italofelipe/auraxis-app/issues/450)
* support structured weekly insights ([#414](https://github.com/italofelipe/auraxis-app/issues/414)) ([ca4c59c](https://github.com/italofelipe/auraxis-app/commit/ca4c59c35e4ec6fe050719a3a74c6980d8dd5edc))
* **telemetry:** request-id propagation + withCurrentRequestId helper (R2/3.2b) ([#453](https://github.com/italofelipe/auraxis-app/issues/453)) ([32f4080](https://github.com/italofelipe/auraxis-app/commit/32f4080b9e99f690325f9b3c284308f927124595))
* **testing:** app a11y + visual baseline via Maestro (R2/2.2) ([#449](https://github.com/italofelipe/auraxis-app/issues/449)) ([83537b8](https://github.com/italofelipe/auraxis-app/commit/83537b8bce2afb6e30900bd2139339583661f7ce)), closes [#448](https://github.com/italofelipe/auraxis-app/issues/448)
* track auth analytics events ([#411](https://github.com/italofelipe/auraxis-app/issues/411)) ([c924935](https://github.com/italofelipe/auraxis-app/commit/c92493536dbbe12a8fae211b338e76bc488bcc27))
* track goal analytics events ([#416](https://github.com/italofelipe/auraxis-app/issues/416)) ([4b25cc4](https://github.com/italofelipe/auraxis-app/commit/4b25cc437e617696a2d85e8dc9e7459a017c4aa4))
* track transaction analytics events ([#415](https://github.com/italofelipe/auraxis-app/issues/415)) ([9e43aec](https://github.com/italofelipe/auraxis-app/commit/9e43aeccf7726d931a727d28542878bc4e663bbb))
* **transactions:** add installment form flow ([#423](https://github.com/italofelipe/auraxis-app/issues/423)) ([cdf6175](https://github.com/italofelipe/auraxis-app/commit/cdf6175d054fc1ee308e594f7b2684316ad82895))
* **transactions:** cents-first money input + tz/NaN normalization (shared CurrencyInputField) ([#466](https://github.com/italofelipe/auraxis-app/issues/466)) ([252a2e9](https://github.com/italofelipe/auraxis-app/commit/252a2e9be5a4bddf4cee13bedde65462856d7a66))
* **transactions:** recurrence form — cadence picker, interval, dates + tz fix ([#467](https://github.com/italofelipe/auraxis-app/issues/467)) ([6efdbff](https://github.com/italofelipe/auraxis-app/commit/6efdbffe33b42b82f62a9cce50b2eea0b2811ff1))
* wire beta telemetry readiness ([#422](https://github.com/italofelipe/auraxis-app/issues/422)) ([aa24076](https://github.com/italofelipe/auraxis-app/commit/aa2407623783f36d549ff9af0915660395ff9e3d))


### Bug Fixes

* enable native ssl pinning ([#433](https://github.com/italofelipe/auraxis-app/issues/433)) ([62ec161](https://github.com/italofelipe/auraxis-app/commit/62ec1617c3d9463a470411a9a94ea0e63d2693e9))
* reject biometric PIN fallback for sensitive gates ([#427](https://github.com/italofelipe/auraxis-app/issues/427)) ([e25654f](https://github.com/italofelipe/auraxis-app/commit/e25654f596ba1882363831bcb16c0b7d3cf2bce7))
* require biometric-only checkout gate ([#432](https://github.com/italofelipe/auraxis-app/issues/432)) ([99a3f26](https://github.com/italofelipe/auraxis-app/commit/99a3f26a89b8f846368e8cebc84092d322c11138))

## [1.5.0](https://github.com/italofelipe/auraxis-app/compare/v1.4.0...v1.5.0) (2026-05-10)


### Features

* **dx:** E2E RNTL + MSW + feature flag governance ([#381](https://github.com/italofelipe/auraxis-app/issues/381)) ([0e9449d](https://github.com/italofelipe/auraxis-app/commit/0e9449d657763aab3b560f31d6901db833c12597)), closes [#377](https://github.com/italofelipe/auraxis-app/issues/377)
* **dx:** Stryker mutation testing para auraxis-app ([#380](https://github.com/italofelipe/auraxis-app/issues/380)) ([9a77065](https://github.com/italofelipe/auraxis-app/commit/9a77065055f24a303cad45cdc4857a9d215e3e8d))

## [1.4.0](https://github.com/italofelipe/auraxis-app/compare/v1.3.0...v1.4.0) (2026-05-09)


### Features

* **app/shared-entries:** UI completion (J13-3) — invitations, owned shares, received shares ([#284](https://github.com/italofelipe/auraxis-app/issues/284)) ([49cc3ab](https://github.com/italofelipe/auraxis-app/commit/49cc3abf354a2a9495ab992d144685dc5144d4c6))
* **app/subscription:** paywall + plan picker + hosted checkout flow (J9-4 / APP5) ([#283](https://github.com/italofelipe/auraxis-app/issues/283)) ([62efd42](https://github.com/italofelipe/auraxis-app/commit/62efd425a1eeae24a6b1f9599212debd078f9389))
* **app/tools:** tools hub foundation — categorias, busca e historico de simulações ([#325](https://github.com/italofelipe/auraxis-app/issues/325)) ([f4a21ac](https://github.com/italofelipe/auraxis-app/commit/f4a21ac5505f453f3b6f9c6c878e0bf57d3cfe30))
* **app/transactions:** add Zod validators, form component and CRUD state machine ([#286](https://github.com/italofelipe/auraxis-app/issues/286)) ([a0635c4](https://github.com/italofelipe/auraxis-app/commit/a0635c4f840dc54f40f6c907be3082f0c5e73bfa))
* **app/user-profile:** danger zone — LGPD-compliant account deletion ([#324](https://github.com/italofelipe/auraxis-app/issues/324)) ([dfa6789](https://github.com/italofelipe/auraxis-app/commit/dfa67896436eb3bcf7533e856d1a85efd3129b30))
* **app/wallet:** BRAPI foundation — service, hooks, autocomplete, live quotes ([#323](https://github.com/italofelipe/auraxis-app/issues/323)) ([7f41d5a](https://github.com/italofelipe/auraxis-app/commit/7f41d5a89b0b6716cd65b98f15d7690249333386))
* **app:** add canonical async state foundation ([#245](https://github.com/italofelipe/auraxis-app/issues/245)) ([83be3ce](https://github.com/italofelipe/auraxis-app/commit/83be3ce60b3cc58d0b1be359b619533971d83afe))
* **app:** add canonical auth failure recovery ([#248](https://github.com/italofelipe/auraxis-app/issues/248)) ([6806353](https://github.com/italofelipe/auraxis-app/commit/68063530c6a8aca7c8460d4ba71a53f8ee6d8331))
* **app:** add canonical error taxonomy ([#244](https://github.com/italofelipe/auraxis-app/issues/244)) ([31d6f16](https://github.com/italofelipe/auraxis-app/commit/31d6f16a60cb41507604d12e13fad142562a236a))
* **app:** add client telemetry foundation ([#225](https://github.com/italofelipe/auraxis-app/issues/225)) ([ff8e23e](https://github.com/italofelipe/auraxis-app/commit/ff8e23e90893a1016297aaa3c36232c967f4c402))
* **app:** add register + confirm-email + goals tab and polish login/dashboard ([#279](https://github.com/italofelipe/auraxis-app/issues/279)) ([c2df1d2](https://github.com/italofelipe/auraxis-app/commit/c2df1d27dc5c41c9a4bacf0013440c34b571e446))
* **app:** add shell lifecycle runtime foundation ([#211](https://github.com/italofelipe/auraxis-app/issues/211)) ([dbeef9f](https://github.com/italofelipe/auraxis-app/commit/dbeef9ffb00500a65b9e13f20f81f7e2707cdda4))
* **app:** audit client security and config surface ([#246](https://github.com/italofelipe/auraxis-app/issues/246)) ([eaa010b](https://github.com/italofelipe/auraxis-app/commit/eaa010bd0f10fa82b61fc4e980c2fc454c299205))
* **app:** close APP FND-03B ui foundation ([#220](https://github.com/italofelipe/auraxis-app/issues/220)) ([339b4fa](https://github.com/italofelipe/auraxis-app/commit/339b4fac84f5898a3408daf195a29b5c607bc57f))
* **app:** codify logging governance ([#250](https://github.com/italofelipe/auraxis-app/issues/250)) ([da912f9](https://github.com/italofelipe/auraxis-app/commit/da912f965806161f278000e3c2a69e7892e865cf))
* **app:** complete form foundation ([#258](https://github.com/italofelipe/auraxis-app/issues/258)) ([33f1a0c](https://github.com/italofelipe/auraxis-app/commit/33f1a0c11939c77779160a5e73c3c45ed44ab122))
* **app:** consolidate client observability ([#249](https://github.com/italofelipe/auraxis-app/issues/249)) ([d9d5828](https://github.com/italofelipe/auraxis-app/commit/d9d582841ca030c55e7704fab137c3e1bdc6c109))
* **app:** dashboard breadth — MoM comparison, quick-add FAB, due card, embedded summaries ([#320](https://github.com/italofelipe/auraxis-app/issues/320)) ([f268cb9](https://github.com/italofelipe/auraxis-app/commit/f268cb9458ae73e340dff151174eb87cace4ffba)), closes [#301](https://github.com/italofelipe/auraxis-app/issues/301)
* **app:** focus mode + onboarding wizard + wallet valuation + goal simulator (4 features) ([#291](https://github.com/italofelipe/auraxis-app/issues/291)) ([6e66894](https://github.com/italofelipe/auraxis-app/commit/6e66894d6cd316a4a57650cbd9d9d5c56abbe565))
* **app:** goal plans + fiscal docs + survival index + wallet operations CRUD (4 features) ([#289](https://github.com/italofelipe/auraxis-app/issues/289)) ([3ca65a9](https://github.com/italofelipe/auraxis-app/commit/3ca65a9ee462533da333f347500ecf6e7eac97e4))
* **app:** goals CRUD + reset password (closes APP6 + first MVP gap with web) ([#285](https://github.com/italofelipe/auraxis-app/issues/285)) ([194a207](https://github.com/italofelipe/auraxis-app/commit/194a2079df73dde36196ea2ba147e435d4888970))
* **app:** guard runtime effects in tests ([#253](https://github.com/italofelipe/auraxis-app/issues/253)) ([cf437ee](https://github.com/italofelipe/auraxis-app/commit/cf437eed2929e45315247f6ff34f25287e0516e4))
* **app:** harden auth runtime session policy ([#224](https://github.com/italofelipe/auraxis-app/issues/224)) ([91d9541](https://github.com/italofelipe/auraxis-app/commit/91d9541d72b07300278126f14850d7f4c35e143c))
* **app:** harden contract catalog governance ([#223](https://github.com/italofelipe/auraxis-app/issues/223)) ([f3b35c4](https://github.com/italofelipe/auraxis-app/commit/f3b35c496bef82c84363a1867b0ccc14b029c696))
* **app:** harden runtime reliability ([#226](https://github.com/italofelipe/auraxis-app/issues/226)) ([f8a0730](https://github.com/italofelipe/auraxis-app/commit/f8a0730a2823fa87e5d0b191ce57fcc6dd1f96d1))
* **app:** harden runtime security and observability ([#251](https://github.com/italofelipe/auraxis-app/issues/251)) ([6d35faf](https://github.com/italofelipe/auraxis-app/commit/6d35faf11b4cf8a7f236baae93037ef3af20b9e2))
* **app:** harden test runtime isolation ([#227](https://github.com/italofelipe/auraxis-app/issues/227)) ([48e726b](https://github.com/italofelipe/auraxis-app/commit/48e726bdd2207af20a619c56f23bbf6654c32519))
* **app:** improve runtime testability and revalidation ([#252](https://github.com/italofelipe/auraxis-app/issues/252)) ([6e94b55](https://github.com/italofelipe/auraxis-app/commit/6e94b55e45d0eceb5cc693654fbbc6efb2e960b2))
* **app:** investor profile questionnaire + 3 dashboard widgets (top categories, trends, counts) ([#288](https://github.com/italofelipe/auraxis-app/issues/288)) ([b176617](https://github.com/italofelipe/auraxis-app/commit/b1766175358b50a85ca0c1690c9700b1e09490be))
* **app:** preserve auth redirect intent + harden auth submit handlers ([#281](https://github.com/italofelipe/auraxis-app/issues/281)) ([4d00767](https://github.com/italofelipe/auraxis-app/commit/4d00767637ec55630cf22d27196f3855f8cfad20))
* **app:** scaffold remaining MVP1 domains ([#222](https://github.com/italofelipe/auraxis-app/issues/222)) ([0532152](https://github.com/italofelipe/auraxis-app/commit/0532152f11ac95f33a31ab6b8ba4889ad6f57399))
* **app:** standalone /resend-confirmation + rich checkout outcome cards ([#321](https://github.com/italofelipe/auraxis-app/issues/321)) ([dd1d9ee](https://github.com/italofelipe/auraxis-app/commit/dd1d9ee0018d92a248d51f11f0ed0a46a73e634b)), closes [#304](https://github.com/italofelipe/auraxis-app/issues/304)
* **app:** tags + accounts + credit cards + budgets crud (4 features, paridade web) ([#290](https://github.com/italofelipe/auraxis-app/issues/290)) ([b125134](https://github.com/italofelipe/auraxis-app/commit/b125134e1db8d22875a07d0386cefdf7ce1c710a))
* **app:** theming (full dark mode), i18n PT+EN base, accessibility on shared primitives ([#314](https://github.com/italofelipe/auraxis-app/issues/314)) ([ef8bb2d](https://github.com/italofelipe/auraxis-app/commit/ef8bb2dd6392e08075f0c16eec5d2fbe52132b89)), closes [#297](https://github.com/italofelipe/auraxis-app/issues/297)
* **app:** transactions power features — calendar, duplicate, CSV/PDF export ([#322](https://github.com/italofelipe/auraxis-app/issues/322)) ([88e81e5](https://github.com/italofelipe/auraxis-app/commit/88e81e5bcf8f11e7a7870e1d08d10c4901e60900)), closes [#303](https://github.com/italofelipe/auraxis-app/issues/303)
* **app:** UX foundation — haptics, domain skeletons, illustrated empty states, screen transitions ([#306](https://github.com/italofelipe/auraxis-app/issues/306)) ([b31e897](https://github.com/italofelipe/auraxis-app/commit/b31e897f67bc773d4acc711fce35b7e8a5f37ead)), closes [#295](https://github.com/italofelipe/auraxis-app/issues/295)
* **app:** wallet CRUD + user profile + fiscal receivables (3 features, paridade web) ([#287](https://github.com/italofelipe/auraxis-app/issues/287)) ([40e7724](https://github.com/italofelipe/auraxis-app/commit/40e77247b090a2871c86f7efdfb9544e2640e26f))
* **app:** wallet valuation history + transactions trash + salary simulator + notification preferences (4 features) ([#292](https://github.com/italofelipe/auraxis-app/issues/292)) ([fd4173a](https://github.com/italofelipe/auraxis-app/commit/fd4173aabc033713e6caacacf94316cf684981c2))
* **ci:** production watchdog ([#366](https://github.com/italofelipe/auraxis-app/issues/366)) ([eb44c84](https://github.com/italofelipe/auraxis-app/commit/eb44c844fe667a6e853a002b615a70bcbf12ed5b))
* expand mobile scaffold foundation ([#202](https://github.com/italofelipe/auraxis-app/issues/202)) ([7788541](https://github.com/italofelipe/auraxis-app/commit/7788541b8e3a1afa8d78df8b4721d1d9fa8151c3))
* **foundation:** FND-00 completion — performance budgets, query strategy, design system, form primitives, domain shells, playbooks ([#276](https://github.com/italofelipe/auraxis-app/issues/276)) ([d7f2d35](https://github.com/italofelipe/auraxis-app/commit/d7f2d3541939504acff9b23dee9c51e307123b8d))
* **lint:** forbid Image/ImageBackground from react-native (use AppImage wrapper) ([#350](https://github.com/italofelipe/auraxis-app/issues/350)) ([7508de1](https://github.com/italofelipe/auraxis-app/commit/7508de13e60ad9756c53c4d73659b338866a1568))


### Performance Improvements

* **app:** FlashList virtualization, memoised inputs, expo-image wrapper, prefetch hook ([#313](https://github.com/italofelipe/auraxis-app/issues/313)) ([a618934](https://github.com/italofelipe/auraxis-app/commit/a618934c6707e3645270e761196f24200c0895e2)), closes [#296](https://github.com/italofelipe/auraxis-app/issues/296)

## [1.3.0](https://github.com/italofelipe/auraxis-app/compare/v1.2.0...v1.3.0) (2026-03-22)


### Features

* **alerts:** add alert list and preferences screens ([#168](https://github.com/italofelipe/auraxis-app/issues/168)) ([2284951](https://github.com/italofelipe/auraxis-app/commit/22849510c6ce631b31b3e015b77eb3ca1731d394))

## [1.2.0](https://github.com/italofelipe/auraxis-app/compare/v1.1.0...v1.2.0) (2026-03-20)


### Features

* **app:** add tamagui runtime foundation ([#178](https://github.com/italofelipe/auraxis-app/issues/178)) ([7724c16](https://github.com/italofelipe/auraxis-app/commit/7724c16988e3a791ca301102008d9d8da28e208a))
* **tools:** add installment vs cash mobile flow ([#179](https://github.com/italofelipe/auraxis-app/issues/179)) ([de98e83](https://github.com/italofelipe/auraxis-app/commit/de98e832e733464be922725eb0f8af3e50087fd3))


### Bug Fixes

* **ci:** let release please trigger release pr checks ([#174](https://github.com/italofelipe/auraxis-app/issues/174)) ([6a52325](https://github.com/italofelipe/auraxis-app/commit/6a5232551743c2c78c53291f629e77639f9e5106))

## [1.1.0](https://github.com/italofelipe/auraxis-app/compare/v1.0.0...v1.1.0) (2026-03-19)


### Features

* **e2e:** add Maestro E2E flows — login, dashboard, carteira, ferramentas, logout ([#138](https://github.com/italofelipe/auraxis-app/issues/138)) ([#142](https://github.com/italofelipe/auraxis-app/issues/142)) ([be9ccec](https://github.com/italofelipe/auraxis-app/commit/be9ccec0555772609d3fc6bcaf6cd4cfbc3caf2d))
* **legal:** add legal links in login screen + web-urls module (G2-legal / PLT2) ([#125](https://github.com/italofelipe/auraxis-app/issues/125)) ([b6430b2](https://github.com/italofelipe/auraxis-app/commit/b6430b249da22d9ffd79d4364bd5de18f3915358))
* **obs:** add Sentry React Native integration — sendDefaultPii=false, prod-only ([#137](https://github.com/italofelipe/auraxis-app/issues/137)) ([#140](https://github.com/italofelipe/auraxis-app/issues/140)) ([9d3fe68](https://github.com/italofelipe/auraxis-app/commit/9d3fe6881d58aa6a39fe6f255d378cdefacd3f9b))
* **ui:** migrate from react-native-paper to React Native core ([#136](https://github.com/italofelipe/auraxis-app/issues/136)) ([#141](https://github.com/italofelipe/auraxis-app/issues/141)) ([108a57e](https://github.com/italofelipe/auraxis-app/commit/108a57e302d5ca150cd0b4c477f41744dd8910cb))

## Changelog

All notable changes to this project will be documented in this file.

This file is the baseline for automated release management via Release Please.
Subsequent entries should be generated from release automation.
