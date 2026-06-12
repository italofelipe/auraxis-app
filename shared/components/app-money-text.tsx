import type { ComponentProps, ReactElement } from "react";

import { Paragraph, styled } from "tamagui";

// Valores financeiros em IBM Plex Mono — assinatura visual do dashboard
// web (auraxis-web typography.mono). Dígitos tabulares evitam "dança" de
// layout quando os valores mudam.
const MoneyParagraph = styled(Paragraph, {
  fontFamily: "$mono",
  fontWeight: "$5",
  color: "$color",
});

export type AppMoneyTextProps = ComponentProps<typeof MoneyParagraph>;

/**
 * Texto canônico para valores monetários (R$).
 *
 * @param props Estilos Tamagui usuais; o conteúdo deve vir já formatado
 *              (ex.: via `formatCurrency`).
 * @returns Paragraph com a fonte mono do DS.
 */
export function AppMoneyText(props: AppMoneyTextProps): ReactElement {
  return <MoneyParagraph {...props} />;
}
