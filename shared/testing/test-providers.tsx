import type { PropsWithChildren, ReactElement } from "react";
import { useEffect, useState } from "react";

import {
  QueryClientProvider,
  type QueryClient,
} from "@tanstack/react-query";
import { Theme, TamaguiProvider } from "tamagui";

import { tamaguiConfig } from "@/config/tamagui-theme";
import { createTestQueryClient } from "@/shared/testing/test-query-client";

interface TestProvidersProps extends PropsWithChildren {
  readonly queryClient?: QueryClient;
}

export const TestProviders = ({
  children,
  queryClient: providedQueryClient,
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
      <TamaguiProvider config={tamaguiConfig} defaultTheme="auraxis">
        <Theme name="auraxis">{children}</Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  );
};

export const createTestHookWrapper = (
  options: { readonly queryClient?: QueryClient } = {},
): ((props: PropsWithChildren) => ReactElement) => {
  const Wrapper = ({ children }: PropsWithChildren): ReactElement => {
    return (
      <TestProviders queryClient={options.queryClient}>{children}</TestProviders>
    );
  };

  Wrapper.displayName = "TestHookWrapper";
  return Wrapper;
};
