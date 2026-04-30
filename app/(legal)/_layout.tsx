import type { ReactElement } from "react";

import { Stack } from "expo-router";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";

/**
 * Layout for legal pages (privacy policy, terms of service).
 *
 * Unlike `(public)` and `(private)`, this group has no auth guard —
 * the documents must be reachable by both unauthenticated and
 * authenticated users (deep link from email, store listing, in-app
 * settings, etc.).
 */
export default function LegalLayout(): ReactElement {
  return (
    <AppErrorBoundary
      scope="legal-layout"
      presentation="screen"
      fallbackTitle="Não foi possível abrir o documento"
      fallbackDescription="Tente novamente em alguns instantes."
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 220,
        }}
      />
    </AppErrorBoundary>
  );
}
