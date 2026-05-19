# SSL pinning rotation runbook

## Quando executar

- A cada 90 dias (alinhado ao ciclo de renovação do cert
  `api.auraxis.com.br`).
- Imediatamente quando o provedor TLS rotacionar inesperadamente um cert.
- Antes de qualquer release que altere a infra de TLS (mudança de provider,
  região, distribuição CDN).

## Pre-requisitos

- `openssl` na máquina local (≥1.1.1).
- Acesso SSH/CLI à máquina que tem o cert atual da API,
  ou uso direto do endpoint público (handshake remoto).
- Pins atuais extraídos em 2026-05-19:
  - Leaf `api.auraxis.com.br`:
    `sha256/6ZqZa5LRfTimLYEkGrZ9Pja4ku36AtNGVJ9NbD13GgI=`
  - Backup CA/intermediário `Let's Encrypt E7`:
    `sha256/y7xVm0TVJNahMr2sZydE2jQH8SquXV9yLF9seROHHHU=`

## Passos

### 1. Extrair pin atual (cert em produção)

```bash
openssl s_client \
  -connect api.auraxis.com.br:443 \
  -servername api.auraxis.com.br \
  </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > /tmp/api-cert.pem

PIN_CURRENT=$(openssl x509 -in /tmp/api-cert.pem -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | openssl enc -base64)

echo "Pin atual: sha256/${PIN_CURRENT}"
```

Repetir para `cdn.auraxis.com.br` e qualquer outro subdomínio somente
quando ele passar a servir tráfego TLS direto pelo app. Em 2026-05-19,
`cdn.auraxis.com.br` não respondeu handshake público, então a build
pina apenas `api.auraxis.com.br`.

### 2. Gerar pin backup (próximo cert)

O backup pin deve apontar para a **próxima** chave que a CA vai assinar.
Duas opções:

**Opção A — Pin do CA intermediário** (atual nesta build; mais
resiliente, menos seguro):

```bash
openssl s_client -connect api.auraxis.com.br:443 -showcerts </dev/null 2>/dev/null \
  | awk '/BEGIN CERT/,/END CERT/' \
  | csplit -z -s -f /tmp/cert- - '/BEGIN CERT/' '{*}'
# /tmp/cert-01 é o intermediário; rodar a mesma cadeia openssl pkey | dgst | enc
```

**Opção B — Pin de uma chave gerada offline** (mais seguro, mais
operacional):

```bash
# Gerar chave + CSR offline, guardar a chave em vault, usar SPKI da chave
# como backup pin. Quando o cert atual vencer, ACM vai assinar essa
# mesma chave e o backup pin fica ativo automaticamente.
openssl genrsa -out /tmp/backup-key.pem 4096
PIN_BACKUP=$(openssl rsa -in /tmp/backup-key.pem -pubout -outform der 2>/dev/null \
  | openssl dgst -sha256 -binary \
  | openssl enc -base64)

echo "Pin backup: sha256/${PIN_BACKUP}"
```

Recomendado para a próxima rotação: migrar para a opção B, com a chave
guardada em AWS Secrets Manager (`auraxis/ssl-pinning/backup-key`).

### 3. Atualizar `app.json` (iOS)

```jsonc
"ios": {
  "infoPlist": {
    "NSAppTransportSecurity": {
      "NSAllowsArbitraryLoads": false,
      "NSPinnedDomains": {
        "api.auraxis.com.br": {
          "NSIncludesSubdomains": false,
          "NSPinnedLeafIdentities": [
            { "SPKI-SHA256-BASE64": "<PIN_CURRENT>" }
          ],
          "NSPinnedCAIdentities": [
            { "SPKI-SHA256-BASE64": "<PIN_BACKUP>" }
          ]
        }
      }
    }
  }
}
```

### 4. Atualizar `assets/network-security-config.xml` (Android)

```xml
<network-security-config>
    <domain-config>
        <domain>api.auraxis.com.br</domain>
        <pin-set expiration="2026-08-01">
            <pin digest="SHA-256"><!-- PIN_CURRENT without sha256/ --></pin>
            <pin digest="SHA-256"><!-- PIN_BACKUP without sha256/ --></pin>
        </pin-set>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

`expiration` deve ser ≥ 30 dias antes da próxima rotação esperada.
Quando expira, o pin-set deixa de ser enforced (fail-open) — não
deixar passar.

### 5. Sinalizar telemetria

```bash
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_SSL_PINNING_ENABLED \
  --value true \
  --type string

eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS \
  --value "sha256/${PIN_CURRENT},sha256/${PIN_BACKUP}" \
  --type string
```

Esses secrets são read pelo `core/security/ssl-pinning.ts` para
publicar telemetria; não controlam o pinning nativo (esse é imutável
no binário).

### 6. Build + smoke

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Em cada device:
# - Conectar normalmente: app deve funcionar.
# - Ativar mitmproxy/Charles com cert custom: app deve falhar TLS handshake.
```

### 7. Promote

Após smoke verde nos 2 devices, promover para `production` profile.
PR com diff dos pins documentado.

## Mitigação se um pin errado for shipado para produção

**Sintoma:** app instalado retorna erros de rede em todas as chamadas
HTTPS canônicas.

**Causa-raiz:** pin atual não match com o cert servido. App não pode
fazer OTA pra corrigir (pinning é nativo, requer redeploy via
store).

**Mitigação:**

1. Reverter o `app.json` / XML para a versão pre-rotação (rollback do PR).
2. Build emergencial profile `production`. Submeter para review
   prioritário (Apple expedited review se necessário).
3. Comunicar status page para ETA.

**Prevenção:** sempre dois pins (atual + backup). Smoke test em preview
profile antes de promote. Pin backup nunca compartilha de chave com
o atual.
