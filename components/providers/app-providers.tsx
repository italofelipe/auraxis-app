import type { PropsWithChildren, ReactElement } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider, Theme } from "tamagui";

import { RuntimeProvider } from "@/core/providers/runtime-provider";
import { queryClient } from "@/core/query/query-client";
import { tamaguiConfig } from "@/config/tamagui-theme";

/**
 * Shared root providers for the mobile application runtime.
 *
 * @param props Children to render inside query and Tamagui providers.
 * @returns Provider tree for the app root.
 */
export const AppProviders = ({
  children,
}: PropsWithChildren): ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="auraxis">
          <Theme name="auraxis">{children}</Theme>
        </TamaguiProvider>
      </RuntimeProvider>
    </QueryClientProvider>
  );
};
