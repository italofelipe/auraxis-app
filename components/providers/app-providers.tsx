import type { PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";

import { paperTheme } from "@/config/paper-theme";
import { queryClient } from "@/config/query-client";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </QueryClientProvider>
  );
};
