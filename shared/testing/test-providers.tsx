import type { PropsWithChildren, ReactElement } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { Theme, TamaguiProvider } from "tamagui";

import { queryClient } from "@/core/query/query-client";
import { tamaguiConfig } from "@/config/tamagui-theme";

export const TestProviders = ({
  children,
}: PropsWithChildren): ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="auraxis">
        <Theme name="auraxis">{children}</Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  );
};
