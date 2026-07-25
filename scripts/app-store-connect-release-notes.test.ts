import { generateKeyPairSync } from "node:crypto";
import {
  APP_STORE_CONNECT_API_ROOT,
  createAppStoreConnectToken,
  publishTestFlightReleaseNotes,
} from "./app-store-connect-release-notes.cjs";

const releaseNotes = [
  "- Insights e Cartões agora abrem com estabilidade nas duas plataformas.",
  "- Pendências e calendário receberam correções funcionais e visuais.",
].join("\n");

const response = (body: unknown, status = 200) => ({
  json: async () => body,
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

describe("app-store-connect-release-notes", () => {
  test("creates a scoped ES256 token with the maximum supported lifetime", () => {
    const { privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    const token = createAppStoreConnectToken({
      issuerId: "issuer-id",
      keyId: "key-id",
      now: 1_000_000,
      privateKey: privateKey.export({ format: "pem", type: "pkcs8" }),
    });
    const [header, payload] = token.split(".");

    expect(JSON.parse(Buffer.from(header, "base64url").toString("utf8"))).toEqual(
      expect.objectContaining({ alg: "ES256", kid: "key-id" }),
    );
    expect(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))).toEqual({
      aud: "appstoreconnect-v1",
      exp: 2200,
      iat: 1000,
      iss: "issuer-id",
    });
  });

  test("waits for App Store processing and creates the pt-BR What to Test notes", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response({ data: [] }))
      .mockResolvedValueOnce(response({ data: [{ id: "build-123" }] }))
      .mockResolvedValueOnce(response({ data: [] }))
      .mockResolvedValueOnce(response({ data: { id: "localization-123" } }, 201));
    const sleep = jest.fn().mockResolvedValue(undefined);

    await expect(
      publishTestFlightReleaseNotes({
        accessToken: "token",
        appId: "6772551270",
        buildNumber: "27",
        fetchImpl,
        maxAttempts: 2,
        pollIntervalMs: 1,
        releaseNotes,
        sleep,
      }),
    ).resolves.toBe("build-123");

    expect(sleep).toHaveBeenCalledWith(1);
    expect(fetchImpl).toHaveBeenLastCalledWith(
      `${APP_STORE_CONNECT_API_ROOT}/betaBuildLocalizations`,
      expect.objectContaining({
        body: expect.stringContaining(`"whatsNew":"${releaseNotes.replaceAll("\n", "\\n")}"`),
        method: "POST",
      }),
    );
  });

  test("updates an existing localization instead of creating a duplicate", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response({ data: [{ id: "build-123" }] }))
      .mockResolvedValueOnce(
        response({
          data: [{ attributes: { locale: "pt-BR" }, id: "localization-123" }],
        }),
      )
      .mockResolvedValueOnce(response({}, 204));

    await publishTestFlightReleaseNotes({
      accessToken: "token",
      appId: "6772551270",
      buildNumber: "27",
      fetchImpl,
      maxAttempts: 1,
      releaseNotes,
    });

    expect(fetchImpl).toHaveBeenLastCalledWith(
      `${APP_STORE_CONNECT_API_ROOT}/betaBuildLocalizations/localization-123`,
      expect.objectContaining({
        body: expect.stringContaining(`"whatsNew":"${releaseNotes.replaceAll("\n", "\\n")}"`),
        method: "PATCH",
      }),
    );
  });

  test("fails closed when the processed build never becomes visible", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ data: [] }));

    await expect(
      publishTestFlightReleaseNotes({
        accessToken: "token",
        appId: "6772551270",
        buildNumber: "27",
        fetchImpl,
        maxAttempts: 2,
        pollIntervalMs: 1,
        releaseNotes,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow("TestFlight build 27 was not visible after 2 attempts");
  });
});
