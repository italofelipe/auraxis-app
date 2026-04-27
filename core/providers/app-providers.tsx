import type { PropsWithChildren, ReactElement } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider, Theme } from "tamagui";

import { tamaguiConfig } from "@/config/tamagui-theme";
import { RuntimeProvider } from "@/core/providers/runtime-provider";
import { queryClient } from "@/core/query/query-client";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";

interface ThemedProviderProps extends PropsWithChildren {
  readonly enableRuntime: boolean;
}

const ThemedProviderTree = ({
  children,
  enableRuntime,
}: ThemedProviderProps): ReactElement => {
  const themeName = useResolvedTheme();
  return (
    <RuntimeProvider enabled={enableRuntime}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
        <Theme name={themeName}>{children}</Theme>
      </TamaguiProvider>
    </RuntimeProvider>
  );
};

/**
 * Canonical runtime providers for the mobile application.
 *
 * @param props Provider children.
 * @returns Root provider tree for app runtime.
 */
export function AppProviders({ children }: PropsWithChildren): ReactElement {
  const runtimeEnabled = process.env.NODE_ENV !== "test";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemedProviderTree enableRuntime={runtimeEnabled}>
        {children}
      </ThemedProviderTree>
    </QueryClientProvider>
  );
}
