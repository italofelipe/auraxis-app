import { useCallback, useState, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { ImportRejectedRow } from "@/features/import/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";

export interface ImportRejectedRowsNoticeProps {
  readonly rows: readonly ImportRejectedRow[];
}

/**
 * Aviso das linhas que o parser não conseguiu ler (#759). Sem ele, um arquivo
 * de 100 lançamentos que rende 87 parece ter importado tudo.
 *
 * @param props Linhas rejeitadas devolvidas pelo preview.
 * @returns O painel, ou `null` no caminho feliz (nenhuma linha perdida).
 */
export function ImportRejectedRowsNotice({
  rows,
}: ImportRejectedRowsNoticeProps): ReactElement | null {
  const { t } = useT();
  const [expanded, setExpanded] = useState<boolean>(false);
  const toggle = useCallback(() => setExpanded((current) => !current), []);

  if (rows.length === 0) {
    return null;
  }

  return (
    <AppSurfaceCard
      title={t("import.rejectedRows.title", { count: rows.length })}
      description={t("import.rejectedRows.description")}
    >
      <YStack gap="$3" testID="import-rejected-rows">
        <XStack gap="$2" flexWrap="wrap">
          <AppBadge tone="danger">
            {t("import.rejectedRows.title", { count: rows.length })}
          </AppBadge>
        </XStack>
        {expanded ? (
          <YStack gap="$2">
            {rows.map((row) => (
              <YStack key={`${row.lineNumber}-${row.reason}`} gap="$1">
                <Paragraph fontWeight="700">
                  {t("import.rejectedRows.lineLabel", { line: row.lineNumber })}
                </Paragraph>
                <Paragraph color="$mutedColor">{row.reason}</Paragraph>
              </YStack>
            ))}
          </YStack>
        ) : null}
        <AppButton
          tone="secondary"
          size="sm"
          onPress={toggle}
          testID="import-rejected-rows-toggle"
        >
          {expanded
            ? t("import.rejectedRows.collapse")
            : t("import.rejectedRows.expand")}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
