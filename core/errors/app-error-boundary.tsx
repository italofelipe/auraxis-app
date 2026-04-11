import type { ErrorInfo, PropsWithChildren, ReactElement } from "react";
import { Component } from "react";

import { runtimeLogger } from "@/core/telemetry/domain-loggers";
import { AppScreen } from "@/shared/components/app-screen";
import { AppErrorNotice } from "@/shared/components/app-error-notice";

interface AppErrorBoundaryState {
  readonly error: unknown | null;
}

export interface AppErrorBoundaryProps extends PropsWithChildren {
  readonly scope: string;
  readonly presentation?: "inline" | "screen";
  readonly fallbackTitle?: string;
  readonly fallbackDescription?: string;
  readonly resetLabel?: string;
  readonly onReset?: () => void;
  readonly resetKeys?: ReadonlyArray<unknown>;
  readonly testID?: string;
}

const haveResetKeysChanged = (
  previousKeys: ReadonlyArray<unknown> = [],
  nextKeys: ReadonlyArray<unknown> = [],
): boolean => {
  if (previousKeys.length !== nextKeys.length) {
    return true;
  }

  return previousKeys.some((value, index) => !Object.is(value, nextKeys[index]));
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      error,
    };
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    runtimeLogger.log("runtime.error_boundary_captured", {
      context: {
        scope: this.props.scope,
        componentStack: errorInfo.componentStack,
      },
      error,
    });
  }

  override componentDidUpdate(previousProps: AppErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      haveResetKeysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({
        error: null,
      });
    }
  }

  private readonly handleReset = (): void => {
    this.setState({
      error: null,
    });
    this.props.onReset?.();
  };

  private renderFallback(): ReactElement {
    const notice = (
      <AppErrorNotice
        error={this.state.error}
        fallbackTitle={this.props.fallbackTitle}
        fallbackDescription={this.props.fallbackDescription}
        actionLabel={this.props.resetLabel}
        onAction={this.handleReset}
        testID={this.props.testID}
      />
    );

    if (this.props.presentation === "screen") {
      return (
        <AppScreen scrollable={false} testID={this.props.testID}>
          {notice}
        </AppScreen>
      );
    }

    return notice;
  }

  override render(): ReactElement {
    if (this.state.error !== null) {
      return this.renderFallback();
    }

    return <>{this.props.children}</>;
  }
}
