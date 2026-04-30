import type { ReactElement } from "react";

import { LegalDocumentScreen } from "@/features/legal/screens/legal-document-screen";

export function TermsOfServiceScreen(): ReactElement {
  return (
    <LegalDocumentScreen documentId="terms-of-service" testID="terms-of-service-screen" />
  );
}
