import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";

jest.mock("@/features/tags/hooks/use-tags-query", () => ({
  useTagsQuery: jest.fn(),
}));

const mockedUseTagsQuery = jest.mocked(useTagsQuery);

const buildProps = () => ({
  typeFilter: "all" as const,
  onTypeFilterChange: jest.fn(),
  statusFilter: "all" as const,
  onStatusFilterChange: jest.fn(),
  tagFilter: "all" as const,
  onTagFilterChange: jest.fn(),
  periodLabel: "Junho de 2026",
  onPreviousMonth: jest.fn(),
  onNextMonth: jest.fn(),
  onClearFilters: jest.fn(),
});

const renderFilters = (props = buildProps()) => {
  const rendered = render(
    <AppProviders>
      <TransactionFilters {...props} />
    </AppProviders>,
  );
  return { ...rendered, props };
};

describe("TransactionFilters", () => {
  beforeEach(() => {
    mockedUseTagsQuery.mockReturnValue({ data: { tags: [] } } as never);
  });

  it("renderiza label do periodo e navega entre meses", () => {
    const { getByText, getByLabelText, props } = renderFilters();

    expect(getByText("Junho de 2026")).toBeTruthy();

    fireEvent.press(getByLabelText("Mes anterior"));
    expect(props.onPreviousMonth).toHaveBeenCalled();

    fireEvent.press(getByLabelText("Proximo mes"));
    expect(props.onNextMonth).toHaveBeenCalled();
  });

  it("dispara mudanca de filtro de status", () => {
    const { getByText, props } = renderFilters();

    fireEvent.press(getByText("Vencido"));
    expect(props.onStatusFilterChange).toHaveBeenCalledWith("overdue");
  });

  it("dispara mudanca de filtro de tipo", () => {
    const { getByText, props } = renderFilters();

    fireEvent.press(getByText("Receitas"));
    expect(props.onTypeFilterChange).toHaveBeenCalledWith("income");
  });

  it("oculta linha de tags quando nao ha tags", () => {
    const { queryByText } = renderFilters();
    expect(queryByText("Todas as tags")).toBeNull();
  });

  it("lista tags e dispara filtro por tag", () => {
    mockedUseTagsQuery.mockReturnValue({
      data: {
        tags: [
          { id: "tag-1", name: "Mercado" },
          { id: "tag-2", name: "Transporte" },
        ],
      },
    } as never);

    const { getByText, props } = renderFilters();

    fireEvent.press(getByText("Mercado"));
    expect(props.onTagFilterChange).toHaveBeenCalledWith("tag-1");

    fireEvent.press(getByText("Todas as tags"));
    expect(props.onTagFilterChange).toHaveBeenCalledWith("all");
  });

  it("dispara limpar filtros", () => {
    const { getByText, props } = renderFilters();

    fireEvent.press(getByText("Limpar filtros"));
    expect(props.onClearFilters).toHaveBeenCalled();
  });
});
