import type { PropsWithChildren, ReactElement } from "react";

import { AppScreen } from "@/shared/components/app-screen";

interface ScreenContainerProps extends PropsWithChildren {
  readonly scrollable?: boolean
}

/**
 * Legacy compatibility wrapper around the canonical Tamagui screen primitive.
 *
 * @param props Screen composition props.
 * @returns Shared screen container backed by AppScreen.
 */
export const ScreenContainer = ({
  children,
  scrollable = true,
}: ScreenContainerProps): ReactElement => {
  return (
    <AppScreen scrollable={scrollable}>
      {children}
    </AppScreen>
  );
};
