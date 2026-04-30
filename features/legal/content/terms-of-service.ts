import type { LegalDocument } from "./types";

const SUPPORT_EMAIL = "suporte@auraxis.com.br";

export const TERMS_OF_SERVICE_DOCUMENT: LegalDocument = {
  id: "terms-of-service",
  title: "Termos de Uso",
  version: "1.0.0",
  effectiveDate: "07/03/2026",
  contactEmail: SUPPORT_EMAIL,
  siblingId: "privacy-policy",
  siblingLabel: "Política de Privacidade",
  sections: [
    {
      heading: "1. Quem pode usar",
      blocks: [
        {
          kind: "list",
          items: [
            "O Auraxis é destinado a pessoas maiores de 18 anos com capacidade civil para contratar.",
            "O uso do serviço depende de cadastro válido e aceite destes Termos.",
          ],
        },
      ],
    },
    {
      heading: "2. O que o Auraxis oferece",
      blocks: [
        {
          kind: "list",
          items: [
            "O Auraxis oferece ferramentas de organização financeira pessoal, acompanhamento de receitas, despesas, metas e carteira patrimonial.",
            "O Auraxis não presta consultoria financeira individualizada, recomendação de investimento nem garantia de rentabilidade.",
            "O Auraxis não intermedeia instituições financeiras, não executa ordens de investimento e não substitui orientação profissional jurídica, contábil, tributária ou financeira.",
          ],
        },
      ],
    },
    {
      heading: "3. Conta e credenciais",
      blocks: [
        {
          kind: "list",
          items: [
            "O usuário é responsável por manter a confidencialidade de suas credenciais.",
            "O usuário deve informar dados verdadeiros e atualizados.",
            "O Auraxis pode suspender ou encerrar contas com indício de fraude, abuso, automação maliciosa ou uso em desacordo com estes Termos.",
            "O usuário é responsável por toda atividade realizada a partir de sua conta até comunicação de uso indevido pelos canais oficiais.",
          ],
        },
      ],
    },
    {
      heading: "4. Uso permitido",
      blocks: [
        { kind: "paragraph", text: "O usuário pode:" },
        {
          kind: "list",
          items: [
            "registrar seus dados financeiros pessoais;",
            "usar as ferramentas e relatórios disponibilizados pelo produto;",
            "solicitar suporte pelos canais oficiais;",
            "exportar ou excluir seus dados dentro das capacidades técnicas disponibilizadas pelo produto ou por solicitação formal.",
          ],
        },
      ],
    },
    {
      heading: "5. Uso proibido",
      blocks: [
        { kind: "paragraph", text: "É proibido:" },
        {
          kind: "list",
          items: [
            "usar o serviço para fraude, spam, scraping abusivo ou distribuição de conteúdo malicioso;",
            "tentar contornar mecanismos de segurança, rate limit, anti-bot ou autenticação;",
            "enviar dados sabidamente falsos, ilícitos ou de terceiros sem base legal adequada;",
            "explorar falhas, engenharia reversa indevida ou degradar deliberadamente a infraestrutura;",
            "utilizar o produto para armazenar categorias especiais de dados pessoais ou dados sigilosos de terceiros fora do escopo natural da aplicação.",
          ],
        },
      ],
    },
    {
      heading: "6. Disponibilidade e alterações",
      blocks: [
        {
          kind: "list",
          items: [
            "O serviço pode passar por manutenção, indisponibilidade temporária, ajustes técnicos e evolução de funcionalidades.",
            "O Auraxis pode alterar, suspender ou descontinuar partes do serviço, com atualização deste documento quando aplicável.",
            "O usuário é responsável por manter cópia própria de informações que considere críticas, especialmente antes de exclusões ou alterações relevantes no serviço.",
          ],
        },
      ],
    },
    {
      heading: "7. Limitação de responsabilidade",
      blocks: [
        {
          kind: "list",
          items: [
            "O Auraxis é fornecido no estado em que se encontra, com esforço razoável de disponibilidade e segurança.",
            "O Auraxis não se responsabiliza por decisões financeiras tomadas com base exclusiva nas informações da plataforma.",
            "Na máxima extensão permitida em lei, o Auraxis não responde por danos indiretos, lucros cessantes ou perdas decorrentes de indisponibilidade temporária, falha de terceiros ou uso inadequado da conta.",
            "Nada nestes Termos exclui responsabilidade que não possa ser legalmente afastada pela legislação brasileira.",
          ],
        },
      ],
    },
    {
      heading: "8. Privacidade e dados pessoais",
      blocks: [
        {
          kind: "list",
          items: [
            [
              "O tratamento de dados pessoais segue a ",
              { kind: "link", label: "Política de Privacidade v1", href: "auraxis://privacy-policy" },
              ".",
            ],
            "Ao usar o serviço, o usuário declara ciência de que seus dados serão tratados para operar a plataforma, autenticar acessos, gerar relatórios e manter segurança operacional.",
            "Caso o usuário registre dados de terceiros no produto, declara ser responsável por possuir base legal adequada para isso e por não utilizar o serviço em desconformidade com a legislação aplicável.",
          ],
        },
      ],
    },
    {
      heading: "9. Suporte e solicitações",
      blocks: [
        {
          kind: "list",
          items: [
            [
              "O canal oficial de suporte e privacidade é ",
              { kind: "link", label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
              ".",
            ],
            "Solicitações relacionadas a dados pessoais, acesso, correção ou exclusão devem ser encaminhadas por esse canal.",
            "O atendimento de solicitações pode depender de verificação razoável de identidade e da preservação de registros necessários para cumprimento legal, segurança e exercício regular de direitos.",
          ],
        },
      ],
    },
    {
      heading: "10. Alterações destes Termos",
      blocks: [
        {
          kind: "list",
          items: [
            "Estes Termos podem ser atualizados para refletir mudanças no serviço, requisitos legais ou ajustes operacionais.",
            "A versão vigente será identificada por número e data de vigência.",
          ],
        },
      ],
    },
    {
      heading: "11. Lei aplicável",
      blocks: [
        {
          kind: "list",
          items: ["Estes Termos são regidos pelas leis da República Federativa do Brasil."],
        },
      ],
    },
    {
      heading: "12. Foro",
      blocks: [
        {
          kind: "list",
          items: [
            "Fica eleito o foro da comarca do domicílio do usuário ou outro foro competente nos termos da legislação aplicável, observadas as normas de defesa do consumidor quando incidirem.",
          ],
        },
      ],
    },
    {
      heading: "13. Aceite",
      blocks: [
        {
          kind: "list",
          items: ["O uso do Auraxis após a disponibilização destes Termos constitui aceite da versão vigente."],
        },
      ],
    },
  ],
};
