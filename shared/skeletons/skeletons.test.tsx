import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import {
  AlertsListSkeleton,
  BudgetsListSkeleton,
  DashboardSkeleton,
  FiscalDocumentsSkeleton,
  GoalListSkeleton,
  MetricGridSkeleton,
  TransactionListSkeleton,
  WalletEntryListSkeleton,
} from "@/shared/skeletons";

describe("domain skeletons", () => {
  it("TransactionListSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <TransactionListSkeleton testID="tx-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando transacoes")).toBeTruthy();
  });

  it("GoalListSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <GoalListSkeleton testID="goal-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando metas")).toBeTruthy();
  });

  it("WalletEntryListSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <WalletEntryListSkeleton testID="wallet-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando carteira")).toBeTruthy();
  });

  it("DashboardSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <DashboardSkeleton testID="dashboard-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando painel")).toBeTruthy();
  });

  it("FiscalDocumentsSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <FiscalDocumentsSkeleton testID="fiscal-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando documentos fiscais")).toBeTruthy();
  });

  it("BudgetsListSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <BudgetsListSkeleton testID="budgets-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando orcamentos")).toBeTruthy();
  });

  it("AlertsListSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <AlertsListSkeleton testID="alerts-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando alertas")).toBeTruthy();
  });

  it("MetricGridSkeleton renderiza placeholder acessivel", () => {
    const { getByLabelText } = render(
      <AppProviders>
        <MetricGridSkeleton tiles={4} testID="metric-skel" />
      </AppProviders>,
    );
    expect(getByLabelText("Carregando indicadores")).toBeTruthy();
  });
});
