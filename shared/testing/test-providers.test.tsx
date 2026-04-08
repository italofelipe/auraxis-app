import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { useQueryClient } from "@tanstack/react-query";

const observedClients: unknown[] = [];

const QueryClientProbe = (): React.JSX.Element => {
  const queryClient = useQueryClient();
  observedClients.push(queryClient);
  return <Text>Query client mounted</Text>;
};

describe("TestProviders", () => {
  beforeEach(() => {
    observedClients.length = 0;
  });

  it("renderiza os filhos com a arvore canônica de testes", () => {
    const { getByText } = render(
      <TestProviders>
        <Text>Providers ativos</Text>
      </TestProviders>,
    );

    expect(getByText("Providers ativos")).toBeTruthy();
  });

  it("isola o QueryClient entre renders distintos", () => {
    const firstRender = render(
      <TestProviders>
        <QueryClientProbe />
      </TestProviders>,
    );
    firstRender.unmount();

    const secondRender = render(
      <TestProviders>
        <QueryClientProbe />
      </TestProviders>,
    );
    secondRender.unmount();

    expect(observedClients).toHaveLength(2);
    expect(observedClients[0]).not.toBe(observedClients[1]);
  });
});
