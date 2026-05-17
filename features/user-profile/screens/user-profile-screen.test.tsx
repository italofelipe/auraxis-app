import { fireEvent, render } from "@testing-library/react-native";

import { appRoutes } from "@/core/navigation/routes";
import {
  useUserProfileScreenController,
  type UserProfileScreenController,
} from "@/features/user-profile/hooks/use-user-profile-screen-controller";
import { UserProfileScreen } from "@/features/user-profile/screens/user-profile-screen";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { TestProviders } from "@/shared/testing/test-providers";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

jest.mock("@/features/user-profile/hooks/use-user-profile-screen-controller", () => ({
  useUserProfileScreenController: jest.fn(),
}));

jest.mock("@/features/user-profile/components/appearance-section", () => ({
  AppearanceSection: () => null,
}));

jest.mock("@/features/user-profile/components/language-section", () => ({
  LanguageSection: () => null,
}));

jest.mock("@/features/user-profile/components/security-section", () => ({
  SecuritySection: () => null,
}));

const mockedUseController = jest.mocked(useUserProfileScreenController);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

const profile = {
  id: "usr-1",
  name: "Italo",
  email: "italo@auraxis.dev",
  gender: null,
  birthDate: null,
  monthlyIncome: null,
  monthlyIncomeNet: null,
  netWorth: null,
  monthlyExpenses: null,
  initialInvestment: null,
  monthlyInvestment: null,
  investmentGoalDate: null,
  stateUf: null,
  occupation: null,
  investorProfile: null,
  financialObjectives: null,
  investorProfileSuggested: null,
  profileQuizScore: null,
  taxonomyVersion: null,
};

const controller: UserProfileScreenController = {
  profileQuery: {
    data: profile,
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  } as never,
  profile,
  mode: "read",
  isSaving: false,
  isLoggingOut: false,
  submitError: null,
  handleEdit: jest.fn(),
  handleCancel: jest.fn(),
  handleSubmit: jest.fn().mockResolvedValue(undefined),
  handleLogout: jest.fn().mockResolvedValue(undefined),
  dismissSubmitError: jest.fn(),
};

describe("UserProfileScreen privacy center entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseController.mockReturnValue(controller);
    mockedIsFeatureEnabled.mockReturnValue(true);
  });

  it("routes to the privacy center when the flag is enabled", () => {
    const { getByText } = render(
      <TestProviders>
        <UserProfileScreen />
      </TestProviders>,
    );

    fireEvent.press(getByText("Central de privacidade"));

    expect(mockPush).toHaveBeenCalledWith(appRoutes.private.privacyCenter);
  });

  it("keeps the privacy center CTA hidden when the feature flag is off", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);
    const { queryByText } = render(
      <TestProviders>
        <UserProfileScreen />
      </TestProviders>,
    );

    expect(queryByText("Central de privacidade")).toBeNull();
  });
});
