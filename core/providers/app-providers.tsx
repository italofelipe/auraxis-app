import type { PropsWithChildren, ReactElement } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider, Theme } from "tamagui";

import { tamaguiConfig } from "@/config/tamagui-theme";
import { queryClient } from "@/core/query/query-client";
import { RuntimeProvider } from "@/core/providers/runtime-provider";

/**
 * Canonical runtime providers for the mobile application.
 *
 * @param props Provider children.
 * @returns Root provider tree for app runtime.
 */
export function AppProviders({
  children,
}: PropsWithChildren): ReactElement {
  const runtimeEnabled = process.env.NODE_ENV !== "test";

  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider enabled={runtimeEnabled}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="auraxis">
          <Theme name="auraxis">{children}</Theme>
        </TamaguiProvider>
      </RuntimeProvider>
    </QueryClientProvider>
  );
}
