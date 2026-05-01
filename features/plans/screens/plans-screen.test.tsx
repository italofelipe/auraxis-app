import { fireEvent, render } from "@testing-library/react-native";

import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

import { PlansScreen } from "@/features/plans/screens/plans-screen";
import type { PlansScreenController } from "@/features/plans/hooks/use-plans-screen-controller";
import type {
  PlansBillingCycle,
  PlansFeatureRow,
  PlansTierView,
} from "@/features/plans/contracts";

const mockToggleCycle = jest.fn();
const mockSelectFree = jest.fn();
const mockSelectPremium = jest.fn();

let mockController: Partial<PlansScreenController> = {};

const buildTier = (overrides: Partial<PlansTierView> = {}): PlansTierView => ({
  slug: "premium",
  tier: "premium",
  displayName: "Premium",
  description: "Premium tier",
  priceMonthlyCents: 3990,
  priceAnnualCents: 38400,
  currency: "BRL",
  trialDays: 0,
  checkoutEnabled: true,
  highlighted: true,
  hasMonthly: true,
  hasAnnual: true,
  ...overrides,
});

const buildFeatureRows = (): readonly PlansFeatureRow[] => [
  { key: "transactions", free: true, premium: true },
  { key: "goals", free: true, premium: true },
  { key: "advancedReports", free: false, premium: true },
];

const buildController = (
  overrides: Partial<PlansScreenController>,
): PlansScreenController => ({
  billingCycle: "monthly" as PlansBillingCycle,
  tiers: [
    buildTier({ slug: "free", tier: "free", displayName: "Free", priceMonthlyCents: 0, priceAnnualCents: 0, hasAnnual: false }),
    buildTier(),
  ],
  featureRows: buildFeatureRows(),
  isLoading: false,
  isError: false,
  error: null,
  annualDiscountPercent: 20,
  toggleCycle: mockToggleCycle,
  setBillingCycle: jest.fn(),
  handleSelectFreeTier: mockSelectFree,
  handleSelectPremiumTier: mockSelectPremium,
  ...overrides,
});

jest.mock("@/features/plans/hooks/use-plans-screen-controller", () => ({
  usePlansScreenController: () => buildController(mockController),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
}));

describe("PlansScreen", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    mockToggleCycle.mockReset();
    mockSelectFree.mockReset();
    mockSelectPremium.mockReset();
    mockController = {};
  });

  it("renders both tier cards and the toggle in the default state", () => {
    const { getByTestId, getByText, getAllByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    expect(getByTestId("plans-tier-free")).toBeTruthy();
    expect(getByTestId("plans-tier-premium")).toBeTruthy();
    expect(getAllByText(/Mensal/iu).length).toBeGreaterThan(0);
    expect(getByText(/Anual.*-20%/iu)).toBeTruthy();
  });

  it("toggles billing cycle when annual button is pressed", () => {
    const { getByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Anual/iu));
    expect(mockToggleCycle).toHaveBeenCalledTimes(1);
  });

  it("free CTA invokes handleSelectFreeTier", () => {
    const { getByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Comecar gratis/iu));
    expect(mockSelectFree).toHaveBeenCalledTimes(1);
  });

  it("premium CTA invokes handleSelectPremiumTier", () => {
    const { getByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Assinar Premium/iu));
    expect(mockSelectPremium).toHaveBeenCalledTimes(1);
  });

  it("renders the loading state while plans are fetching", () => {
    mockController = { isLoading: true, tiers: [] };
    const { getByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    expect(getByText(/Carregando planos/iu)).toBeTruthy();
  });

  it("renders the error notice when the query fails", () => {
    mockController = {
      isError: true,
      error: new Error("offline"),
      tiers: [],
    };
    const { getByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    expect(getByText(/Nao foi possivel carregar os planos/iu)).toBeTruthy();
  });

  it("renders the empty state when API returns no plans", () => {
    mockController = { tiers: [] };
    const { getByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    expect(getByText(/Nenhum plano disponivel/iu)).toBeTruthy();
  });

  it("shows annual price caption when cycle is annual", () => {
    mockController = { billingCycle: "annual" };
    const { getAllByText } = render(
      <TestProviders>
        <PlansScreen />
      </TestProviders>,
    );
    expect(getAllByText(/cobranca anual/iu).length).toBeGreaterThan(0);
  });
});
