# Evidência E2E — issue 723

Execução verde em 2026-07-24 com:

- APK Android release (`com.sensoriumit.auraxis`, versão 1.13.7);
- Pixel 9 emulado, Android API 37;
- Maestro 2.7.0;
- endpoint `https://api.auraxis.com.br`;
- conta descartável confirmada, removida depois da execução.

O fluxo `.maestro/01_login.yaml` validou, na ordem:

1. senha mascarada antes do envio;
2. credenciais inválidas com mensagem segura;
3. credenciais válidas abrindo a área privada e exibindo `Saldo geral`.

As credenciais foram injetadas por ambiente, ficaram fora do repositório e não
aparecem em texto nas imagens. O e-mail visível era de uma caixa temporária já
removida; a conta Auraxis correspondente também foi excluída após a captura.

Resultado: `Maestro exit status: 0`.
