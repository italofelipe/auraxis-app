# SSL pinning rotation runbook

## Objetivo

Manter a API acessível em builds iOS e Android sem reduzir a proteção contra
interceptação. A política nativa usa dois pins CA-SPKI da cadeia pública de
`api.auraxis.com.br`, alinhados entre as plataformas.

Execute este runbook:

- antes de todo build nativo;
- quando a cadeia TLS, CA, CDN ou provedor mudar;
- quando `npm run ssl-pinning:check` falhar;
- imediatamente após um alerta de handshake em produção.

Uma correção de pinning não pode ser entregue por OTA: os pins pertencem ao
binário nativo.

## Estado de referência em 2026-07-24

| Certificado da cadeia | SPKI SHA-256 |
|---|---|
| Let's Encrypt `YE2` intermediário | `sha256/s/tdAOmUzd8syaTuqfgGvFcn6DzA5Cmb+Vby1ST+U3Y=` |
| `ISRG Root YE` | `sha256/sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=` |

O leaf observado em produção é
`sha256/ll8r/Juoowyh1V2qUhOGv79vQkRFWb014Jyh4T3NuQ8=`, mas não faz parte da
política. Leaf certificates têm ciclo curto e sua rotação não deve inutilizar
um aplicativo já instalado.

## Invariantes

1. iOS declara somente `NSPinnedCAIdentities`; não combine esta chave com
   `NSPinnedLeafIdentities` no mesmo domínio.
2. Android e iOS possuem exatamente o mesmo conjunto de pelo menos dois pins.
3. Android referencia `@xml/network_security_config` no manifest gerado.
4. O XML canônico fica em `assets/network-security-config.xml`; o config plugin
   é responsável por copiá-lo durante o prebuild.
5. A expiração Android permanece pelo menos 30 dias no futuro.
6. Cada pin configurado corresponde a um certificado da cadeia pública atual.

## 1. Fazer o diagnóstico automático

```bash
npm run ssl-pinning:check
```

O comando falha se os arquivos divergem, se um leaf volta ao iOS, se há menos
de dois pins, se a expiração está próxima ou se a cadeia ao vivo não contém
todos os pins configurados.

Falha de rede ao executar o check deve bloquear o release; não trate ausência de
prova como aprovação.

## 2. Inspecionar a cadeia quando houver rotação

```bash
openssl s_client \
  -connect api.auraxis.com.br:443 \
  -servername api.auraxis.com.br \
  -showcerts </dev/null
```

Para cada certificado CA que será pinado, salve o PEM separadamente e extraia o
SPKI:

```bash
openssl x509 -in /tmp/ca.pem -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | openssl enc -base64
```

Confirme issuer, subject, validade e cadeia em uma segunda fonte confiável antes
de alterar o app. Não copie um hash de log, issue ou conversa sem refazer a
extração.

## 3. Atualizar iOS e Android na mesma mudança

Em `app.json`, substitua somente as entradas de `NSPinnedCAIdentities`:

```jsonc
"NSPinnedDomains": {
  "api.auraxis.com.br": {
    "NSIncludesSubdomains": false,
    "NSPinnedCAIdentities": [
      { "SPKI-SHA256-BASE64": "<CA_PIN_1>" },
      { "SPKI-SHA256-BASE64": "<CA_PIN_2>" }
    ]
  }
}
```

Em `assets/network-security-config.xml`, use os mesmos valores e atualize a
expiração:

```xml
<domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="false">api.auraxis.com.br</domain>
    <pin-set expiration="YYYY-MM-DD">
        <pin digest="SHA-256"><!-- CA_PIN_1 --></pin>
        <pin digest="SHA-256"><!-- CA_PIN_2 --></pin>
    </pin-set>
</domain-config>
```

Não adicione `expo.android.networkSecurityConfig` ao `app.json`: essa propriedade
não conecta o XML ao projeto gerado pelo Expo. O plugin
`./plugins/with-android-network-security-config.cjs` deve permanecer listado.

## 4. Validar o projeto nativo gerado

```bash
npx expo prebuild --platform android --clean --no-install
npm run ssl-pinning:check
```

No resultado gerado, confirme:

```bash
rg 'networkSecurityConfig|usesCleartextTraffic' \
  android/app/src/main/AndroidManifest.xml
rg 'pin-set|SHA-256' \
  android/app/src/main/res/xml/network_security_config.xml
```

O manifest deve referenciar `@xml/network_security_config` e bloquear cleartext.
O XML gerado deve ser idêntico ao arquivo canônico.

## 5. Build e E2E

Crie builds nativos para ambas as plataformas. Em dispositivo real ou emulador,
execute:

1. abrir o app com estado limpo;
2. confirmar que a senha continua mascarada;
3. enviar uma senha inválida e confirmar `E-mail ou senha inválidos.`;
4. fechar o aviso e entrar com uma conta descartável válida;
5. confirmar a abertura do Dashboard;
6. capturar imagens dos três estados;
7. repetir o smoke com proxy MITM confiado pelo aparelho e confirmar que o
   handshake é bloqueado.

O fluxo Android automatizado está em `.maestro/01_login.yaml`. Credenciais são
fornecidas por variáveis `E2E_EMAIL`, `E2E_INVALID_PASSWORD` e `E2E_PASSWORD`;
nunca grave senhas no repositório ou nas capturas.

## 6. Entrega

- Anexe ao PR as capturas do E2E e informe plataforma, build e data.
- Inclua o resultado de `npm run ssl-pinning:check`.
- Descreva os pins removidos e adicionados sem registrar credenciais.
- Como há alteração nativa, publique novo build de loja; OTA isolado não corrige
  aparelhos com a política antiga.
- Faça smoke no TestFlight e Google Play internal antes da promoção pública.

## Mitigação de incidente

Sintoma típico: a Web autentica normalmente, mas todas as chamadas do app falham
antes de alcançar a API. O UI pode mostrar um erro de rede; logs do backend não
registram `/auth/login`.

1. Compare os pins do binário com a cadeia pública usando o verificador.
2. Atualize as duas plataformas juntas.
3. Gere build emergencial `production`; não tente corrigir por OTA.
4. Solicite revisão acelerada quando aplicável e comunique o impacto.
5. Preserve uma mensagem de rede distinta de credenciais inválidas.

O incidente que originou este runbook está documentado em
`docs/wiki/mobile-login-tls-pinning-incident-2026-07-24.md`.
