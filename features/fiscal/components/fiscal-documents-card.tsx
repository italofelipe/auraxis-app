import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import type { FiscalDocumentRecord } from "@/features/fiscal/contracts";
import { useFiscalDocumentsQuery } from "@/features/fiscal/hooks/use-fiscal-query";
import { AppBadge } from "@/shared/components/app-badge";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const STATUS_TONE: Record<string, "default" | "primary" | "danger"> = {
  draft: "default",
  issued: "primary",
  cancelled: "danger",
  rejected: "danger",
  paid: "primary",
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

/**
 * Read-only list of fiscal documents tied to the user's account.
 */
export function FiscalDocumentsCard(): ReactElement {
  const documentsQuery = useFiscalDocumentsQuery();

  return (
    <AppSurfaceCard
      title="Documentos fiscais"
      description="Notas e comprovantes vinculados a sua conta."
    >
      <AppQueryState
        query={documentsQuery}
        options={{
          loading: {
            title: "Carregando documentos",
            description: "Buscando documentos fiscais registrados.",
          },
          empty: {
            title: "Nenhum documento encontrado",
            description: "Os documentos vinculados aparecerao aqui.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: (data) => data.fiscalDocuments.length === 0,
        }}
      >
        {(data) => (
          <YStack gap="$3">
            {data.fiscalDocuments.map((record) => (
              <FiscalDocumentRow key={record.id} record={record} />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface FiscalDocumentRowProps {
  readonly record: FiscalDocumentRecord;
}

function FiscalDocumentRow({
  record,
}: FiscalDocumentRowProps): ReactElement {
  const externalLabel = record.externalId ?? record.id.slice(0, 8);
  return (
    <AppKeyValueRow
      label={`${record.type.toUpperCase()} · ${externalLabel}`}
      value={
        <YStack alignItems="flex-end" gap="$1">
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {formatDate(record.issuedAt)}
          </Paragraph>
          <AppBadge tone={STATUS_TONE[record.status] ?? "default"}>
            {record.status}
          </AppBadge>
        </YStack>
      }
    />
  );
}
