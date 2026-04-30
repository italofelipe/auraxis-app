import type { LegalDocument } from "./types";

const SUPPORT_EMAIL = "suporte@auraxis.com.br";

export const PRIVACY_POLICY_DOCUMENT: LegalDocument = {
  id: "privacy-policy",
  title: "Política de Privacidade",
  version: "1.0.0",
  effectiveDate: "07/03/2026",
  contactEmail: SUPPORT_EMAIL,
  siblingId: "terms-of-service",
  siblingLabel: "Termos de Uso",
  sections: [
    {
      heading: "1. Objetivo",
      blocks: [
        {
          kind: "paragraph",
          text: "Esta Política explica, em nível operacional mínimo, quais dados o Auraxis trata, para quais finalidades, com quais terceiros e por quanto tempo.",
        },
      ],
    },
    {
      heading: "2. Dados tratados",
      blocks: [
        { kind: "paragraph", text: "O Auraxis pode tratar:" },
        {
          kind: "list",
          items: [
            "dados cadastrais básicos, como nome, email e credenciais de acesso;",
            "dados de uso e segurança, como IP, logs técnicos, identificadores de sessão e eventos de erro;",
            "dados financeiros informados pelo próprio usuário, como receitas, despesas, metas e carteira patrimonial;",
            "dados técnicos de dispositivo e navegador necessários para funcionamento, segurança e observabilidade;",
            "dados fornecidos em suporte, inclusive contexto técnico mínimo para investigação de erro ou incidente.",
          ],
        },
        {
          kind: "paragraph",
          text: "O Auraxis não tem como objetivo tratar categorias especiais de dados pessoais nem credenciais bancárias de internet banking. Se o usuário inserir esse tipo de conteúdo de forma indevida, o tratamento ocorrerá apenas na medida técnica necessária para armazenamento, segurança, atendimento e eventual exclusão.",
        },
      ],
    },
    {
      heading: "3. Finalidades",
      blocks: [
        { kind: "paragraph", text: "Os dados são tratados para:" },
        {
          kind: "list",
          items: [
            "criar e manter a conta do usuário;",
            "autenticar sessões e prevenir uso indevido;",
            "operar dashboards, relatórios e recursos financeiros do produto;",
            "monitorar disponibilidade, erros e segurança;",
            "atender solicitações de suporte e privacidade;",
            "cumprir obrigações legais ou regulatórias, quando aplicável.",
          ],
        },
      ],
    },
    {
      heading: "4. Bases legais",
      blocks: [
        { kind: "paragraph", text: "As bases legais operacionais incluem, conforme o caso:" },
        {
          kind: "list",
          items: [
            "execução de contrato ou de procedimentos preliminares;",
            "cumprimento de obrigação legal ou regulatória;",
            "exercício regular de direitos;",
            "legítimo interesse para segurança, prevenção a fraude e melhoria operacional;",
            "consentimento, quando vier a ser exigido para fluxos específicos.",
          ],
        },
      ],
    },
    {
      heading: "5. Compartilhamento com terceiros",
      blocks: [
        {
          kind: "paragraph",
          text: "O Auraxis pode compartilhar dados com fornecedores estritamente necessários para a operação da plataforma, como:",
        },
        {
          kind: "list",
          items: [
            "AWS, para hospedagem, storage, CDN e DNS;",
            "GitHub, para CI/CD e operação do ciclo de desenvolvimento;",
            "SonarCloud, para análise estática de código;",
            "Sentry, para observabilidade e monitoramento de erros no frontend;",
            "BRAPI, para consulta de cotações e dados de mercado.",
          ],
        },
        { kind: "paragraph", text: "O compartilhamento é limitado ao necessário para cada finalidade." },
        {
          kind: "paragraph",
          text: "Alguns fornecedores podem operar infraestrutura ou processamento fora do Brasil. Nesses casos, o Auraxis busca adotar salvaguardas contratuais e operacionais compatíveis com a legislação aplicável.",
        },
      ],
    },
    {
      heading: "6. Retenção",
      blocks: [
        {
          kind: "paragraph",
          text: "Os dados são mantidos pelo tempo necessário para cumprir as finalidades operacionais, legais e de segurança. Quando a exclusão imediata não for possível ou recomendável por obrigação legal, segurança, prevenção a fraude ou exercício regular de direitos, determinados registros poderão ser mantidos pelo prazo mínimo necessário.",
        },
      ],
    },
    {
      heading: "7. Direitos do titular",
      blocks: [
        { kind: "paragraph", text: "O titular pode solicitar, nos limites da legislação aplicável:" },
        {
          kind: "list",
          items: [
            "confirmação de tratamento;",
            "acesso;",
            "correção;",
            "exclusão, anonimização ou bloqueio quando cabível;",
            "informações sobre compartilhamento;",
            "revogação de consentimento, quando essa for a base legal aplicável.",
          ],
        },
        {
          kind: "paragraph",
          text: "O atendimento desses pedidos pode depender de verificação razoável de identidade e da análise de viabilidade técnica e jurídica em cada caso.",
        },
      ],
    },
    {
      heading: "8. Segurança",
      blocks: [
        {
          kind: "paragraph",
          text: "O Auraxis adota medidas técnicas e organizacionais razoáveis para proteger dados pessoais, incluindo controle de acesso, criptografia em trânsito quando aplicável, segregação de ambientes e observabilidade técnica. Nenhum ambiente é absolutamente imune a incidentes, e por isso as medidas são continuamente revisadas conforme risco, porte e estágio da operação.",
        },
      ],
    },
    {
      heading: "9. Cookies, analytics e proteção anti-abuso",
      blocks: [
        {
          kind: "list",
          items: [
            "O produto pode usar mecanismos técnicos para sessão, segurança, observabilidade e mitigação de abuso automatizado.",
            "Caso recursos de analytics/cookies não estritamente necessários sejam ativados, a política deve ser revisada para refletir base legal e fluxo de consentimento correspondente.",
          ],
        },
      ],
    },
    {
      heading: "10. Papel do usuário sobre dados inseridos",
      blocks: [
        {
          kind: "list",
          items: [
            "O usuário é responsável pela licitude, adequação e pertinência dos dados que registrar no produto.",
            "Se houver inserção de dados de terceiros, o usuário é responsável por garantir que possui base legal adequada para isso.",
          ],
        },
      ],
    },
    {
      heading: "11. Contato",
      blocks: [
        {
          kind: "paragraph",
          text: [
            "Solicitações relacionadas a privacidade e LGPD devem ser encaminhadas para ",
            { kind: "link", label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
            ".",
          ],
        },
      ],
    },
    {
      heading: "12. Alterações desta Política",
      blocks: [
        {
          kind: "list",
          items: [
            "Esta Política pode ser atualizada periodicamente.",
            "A versão vigente será identificada por número e data.",
          ],
        },
      ],
    },
  ],
};
