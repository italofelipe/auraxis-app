import { useEffect, useState, type PropsWithChildren, type ReactElement } from "react";

import {
  QueryClientProvider,
  type QueryClient,
} from "@tanstack/react-query";
import { Theme, TamaguiProvider } from "tamagui";

import { tamaguiConfig } from "@/config/tamagui-theme";
import { createTestQueryClient } from "@/shared/testing/test-query-client";

interface TestProvidersProps extends PropsWithChildren {
  readonly queryClient?: QueryClient;
  readonly themeName?: "auraxis" | "auraxis_dark" | "auraxis_light";
}

export const TestProviders = ({
  children,
  queryClient: providedQueryClient,
  themeName = "auraxis_light",
}: TestProvidersProps): ReactElement => {
  const [queryClient] = useState<QueryClient>(() => {
    return providedQueryClient ?? createTestQueryClient();
  });

  useEffect(() => {
    return (): void => {
      queryClient.clear();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
        <Theme name={themeName}>{children}</Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  );
};

export const createTestHookWrapper = (
  options: {
    readonly queryClient?: QueryClient;
    readonly themeName?: "auraxis" | "auraxis_dark" | "auraxis_light";
  } = {},
): ((props: PropsWithChildren) => ReactElement) => {
  const Wrapper = ({ children }: PropsWithChildren): ReactElement => {
    return (
      <TestProviders
        queryClient={options.queryClient}
        themeName={options.themeName}
      >
        {children}
      </TestProviders>
    );
  };

  Wrapper.displayName = "TestHookWrapper";
  return Wrapper;
};
