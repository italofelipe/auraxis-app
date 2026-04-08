import fs from "node:fs";
import path from "node:path";

import {
  apiContractMap,
  type ApiContractKey,
} from "@/shared/contracts/api-contract-map";
import { apiEndpointCatalog } from "@/shared/contracts/api-endpoint-catalog";

const knownOpenApiGaps = new Set(
  (
    JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../../contracts/known-openapi-gaps.json"),
        "utf8",
      ),
    ) as { readonly openApiMissing?: readonly string[] }
  ).openApiMissing ?? [],
);

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

  it("mantem todos os contratos registrados no catalogo de endpoints", () => {
    const catalogEntries = new Set<string>(
      Object.values(apiEndpointCatalog).flatMap((entries) => entries),
    );

    const missingEntries = Object.values(apiContractMap)
      .map((contract) => `${contract.method} ${contract.path}`)
      .filter((signature) => !catalogEntries.has(signature));

    expect(missingEntries).toEqual([]);
  });

  it("mantem contratos alinhados ao snapshot OpenAPI, exceto gaps conhecidos do backend", () => {
    const snapshot = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../../contracts/openapi.snapshot.json"),
        "utf8",
      ),
    ) as {
      readonly paths?: Record<string, Record<string, unknown>>;
    };
    const openApiEntries = new Set<string>();

    for (const [path, methods] of Object.entries(snapshot.paths ?? {})) {
      for (const method of Object.keys(methods)) {
        openApiEntries.add(`${method.toUpperCase()} ${path}`);
      }
    }

    const missingFromOpenApi = Object.values(apiContractMap)
      .map((contract) => `${contract.method} ${contract.path}`)
      .filter(
        (signature) =>
          !openApiEntries.has(signature) && !knownOpenApiGaps.has(signature),
      );

    expect(missingFromOpenApi).toEqual([]);
  });

  it("nao mantem gaps conhecidos obsoletos", () => {
    const contractEntries = new Set(
      Object.values(apiContractMap).map((contract) => {
        return `${contract.method} ${contract.path}`;
      }),
    );
    const snapshot = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../../contracts/openapi.snapshot.json"),
        "utf8",
      ),
    ) as {
      readonly paths?: Record<string, Record<string, unknown>>;
    };
    const openApiEntries = new Set<string>();

    for (const [path, methods] of Object.entries(snapshot.paths ?? {})) {
      for (const method of Object.keys(methods)) {
        openApiEntries.add(`${method.toUpperCase()} ${path}`);
      }
    }

    const staleKnownGaps = [...knownOpenApiGaps].filter((signature) => {
      return openApiEntries.has(signature) || !contractEntries.has(signature);
    });

    expect(staleKnownGaps).toEqual([]);
  });
});
