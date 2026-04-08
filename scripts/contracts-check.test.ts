import {
  resolveRemoteContractPacks,
  shouldTreatRemoteContractFailureAsEmpty,
} from "./contracts-check.cjs";
import { createHttpRequestError } from "./contracts.utils.cjs";

describe("contracts-check remote fallback", () => {
  test("degrades to local-only validation on 403 when baseline has no packs", async () => {
    const stdout = { write: jest.fn() };

    const packs = await resolveRemoteContractPacks({
      baselinePayload: { packs: [] },
      contractsApiUrl: "https://api.github.com/contracts",
      listRemotePacks: async () => {
        throw createHttpRequestError("https://api.github.com/contracts", 403);
      },
      stdout,
    });

    expect(packs).toEqual([]);
    expect(stdout.write).toHaveBeenCalledWith(
      expect.stringContaining("degraded to local-only validation"),
    );
  });

  test("keeps failing on 403 when baseline expects remote packs", async () => {
    await expect(
      resolveRemoteContractPacks({
        baselinePayload: {
          packs: [{ taskId: "APP5", sha256: "abc123" }],
        },
        contractsApiUrl: "https://api.github.com/contracts",
        listRemotePacks: async () => {
          throw createHttpRequestError("https://api.github.com/contracts", 403);
        },
        stdout: { write: jest.fn() },
      }),
    ).rejects.toMatchObject({
      name: "HttpRequestError",
      status: 403,
    });
  });

  test("only degrades on auth errors when baseline is empty", () => {
    expect(
      shouldTreatRemoteContractFailureAsEmpty(
        createHttpRequestError("https://api.github.com/contracts", 403),
        { packs: [] },
      ),
    ).toBe(true);

    expect(
      shouldTreatRemoteContractFailureAsEmpty(
        createHttpRequestError("https://api.github.com/contracts", 401),
        { packs: [] },
      ),
    ).toBe(true);

    expect(
      shouldTreatRemoteContractFailureAsEmpty(
        createHttpRequestError("https://api.github.com/contracts", 500),
        { packs: [] },
      ),
    ).toBe(false);
  });
});
