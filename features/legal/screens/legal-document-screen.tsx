import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { AppButton } from "@/shared/components/app-button";
import { AppScreen } from "@/shared/components/app-screen";
import { LegalDocumentRenderer } from "@/features/legal/components/legal-document-renderer";
import {
  legalDocumentPath,
  resolveLegalDocument,
  type LegalDocumentId,
} from "@/features/legal/content";

export interface LegalDocumentScreenProps {
  readonly documentId: LegalDocumentId;
  readonly testID: string;
}

/**
 * Generic screen wrapping a legal document with header navigation.
 * Used by `privacy-policy-screen` and `terms-of-service-screen` so the
 * two pages share layout, scroll behaviour and sibling navigation.
 *
 * @param props Document id + screen testID.
 * @returns The screen tree.
 */
export function LegalDocumentScreen(
  props: LegalDocumentScreenProps,
): ReactElement {
  const router = useRouter();
  const document = resolveLegalDocument(props.documentId);
  const handleOpenSibling = (): void => {
    router.replace(legalDocumentPath(document.siblingId));
  };
  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/login");
  };
  return (
    <AppScreen scrollable testID={props.testID}>
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
          Auraxis
        </Paragraph>
        <XStack gap="$2">
          <AppButton tone="secondary" onPress={handleBack}>
            Voltar
          </AppButton>
        </XStack>
      </XStack>
      <YStack gap="$4">
        <LegalDocumentRenderer document={document} onOpenSibling={handleOpenSibling} />
      </YStack>
    </AppScreen>
  );
}
