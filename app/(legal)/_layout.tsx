import type { ReactElement } from "react";

import { Stack } from "expo-router";

import { AppErrorBoundary } from "@/core/errors/app-error-boundary";

/**
 * Layout for unrestricted pages — legal documents (privacy policy,
 * terms of service) and auth callbacks (confirm-email) that must be
 * reachable both by unauthenticated and authenticated users.
 *
 * Unlike `(public)` and `(private)`, this group has no auth guard so
 * deep links from email, store listings, or in-app settings render the
 * intended screen instead of redirecting.
 */
export default function LegalLayout(): ReactElement {
  return (
    <AppErrorBoundary
      scope="unrestricted-layout"
      presentation="screen"
      fallbackTitle="Não foi possível abrir esta página"
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
