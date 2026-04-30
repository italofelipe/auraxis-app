import type { ReactElement } from "react";

import { LegalDocumentScreen } from "@/features/legal/screens/legal-document-screen";

export function PrivacyPolicyScreen(): ReactElement {
  return <LegalDocumentScreen documentId="privacy-policy" testID="privacy-policy-screen" />;
}
