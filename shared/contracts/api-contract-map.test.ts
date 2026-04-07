import {
  apiContractMap,
  type ApiContractKey,
} from "@/shared/contracts/api-contract-map";

describe("apiContractMap", () => {
  it("mantem path/method unicos por contrato", () => {
    const signatures = Object.values(apiContractMap).map((contract) => {
      return `${contract.method} ${contract.path}`;
    });

    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("exige autenticacao apenas onde esperado", () => {
    const publicContracts: ApiContractKey[] = [
      "authLogin",
      "authRegister",
      "authForgotPassword",
      "authResetPassword",
      "authConfirmEmail",
      "subscriptionPlans",
      "opsObservability",
      "opsMetrics",
    ];

    expect(
      publicContracts.every((contractKey) => !apiContractMap[contractKey].authRequired),
    ).toBe(true);
  });
});
