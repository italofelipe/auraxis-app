import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

interface BuildInformationSource {
  readonly appVersion?: string | null;
  readonly buildVersion?: string | null;
  readonly commit?: string | null;
  readonly runtimeVersion?: string | null;
  readonly updateId?: string | null;
}

export interface BuildInformation {
  readonly appVersion: string;
  readonly buildVersion: string;
  readonly commit: string;
  readonly runtimeVersion: string;
  readonly updateId: string;
}

const normalizedIdentifier = (
  value: string | null | undefined,
  fallback: string,
): string => {
  const normalized = value?.trim();
  return normalized || fallback;
};

const compactCommit = (value: string | null | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return "Desenvolvimento";
  }
  return normalized.length > 12 ? normalized.slice(0, 12) : normalized;
};

export const resolveBuildInformation = (
  source: BuildInformationSource,
): BuildInformation => {
  return {
    appVersion: source.appVersion?.trim() || "Desconhecida",
    buildVersion: source.buildVersion?.trim() || "Desconhecido",
    commit: compactCommit(source.commit),
    runtimeVersion: normalizedIdentifier(source.runtimeVersion, "Embutido"),
    updateId: normalizedIdentifier(source.updateId, "Embutido"),
  };
};

export function BuildInformationSection(): ReactElement {
  const extra = Constants.expoConfig?.extra as
    | { readonly gitCommit?: string | null }
    | undefined;
  const information = resolveBuildInformation({
    appVersion: Application.nativeApplicationVersion ?? Constants.expoConfig?.version,
    buildVersion: Application.nativeBuildVersion,
    commit: extra?.gitCommit,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
  });

  return (
    <AppSurfaceCard
      title="Sobre esta instalação"
      description="Identificação exata para suporte e validação de atualizações."
    >
      <YStack gap="$2">
        <AppKeyValueRow label="Versão" value={information.appVersion} />
        <AppKeyValueRow label="Build" value={information.buildVersion} />
        <AppKeyValueRow label="Runtime" value={information.runtimeVersion} />
        <AppKeyValueRow label="Atualização" value={information.updateId} />
        <AppKeyValueRow label="Commit" value={information.commit} />
      </YStack>
    </AppSurfaceCard>
  );
}
