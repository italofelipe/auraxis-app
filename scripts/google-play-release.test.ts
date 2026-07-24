import {
  GOOGLE_API_ROOT,
  GOOGLE_TOKEN_URL,
  createServiceAccountAssertion,
  publishGooglePlayRelease,
  requestAccessToken,
  updateTrackForVersion,
} from "./google-play-release.cjs";
import { generateKeyPairSync } from "node:crypto";

const releaseNotes = [
  "- Agora a versão Android informa claramente as melhorias entregues aos usuários.",
  "- O track interno só é liberado após o changelog em português ser anexado.",
].join("\n");

const response = (body: unknown, status = 200) => ({
  json: async () => body,
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

describe("google-play-release", () => {
  test("creates a scoped, one-hour service account assertion", () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 1024,
    });
    const assertion = createServiceAccountAssertion({
      credentials: {
        client_email: "publisher@example.iam.gserviceaccount.com",
        private_key: privateKey.export({ format: "pem", type: "pkcs8" }),
      },
      now: 1_000_000,
    });
    const [, payload] = assertion.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    expect(claims).toEqual(
      expect.objectContaining({
        aud: GOOGLE_TOKEN_URL,
        exp: 4600,
        iat: 1000,
        iss: "publisher@example.iam.gserviceaccount.com",
      }),
    );
  });

  test("exchanges the signed assertion without exposing the private key", async () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 1024,
    });
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(response({ access_token: "google-access-token" }));

    await expect(
      requestAccessToken({
        credentials: {
          client_email: "publisher@example.iam.gserviceaccount.com",
          private_key: privateKey.export({ format: "pem", type: "pkcs8" }),
        },
        fetchImpl,
      }),
    ).resolves.toBe("google-access-token");
    expect(fetchImpl).toHaveBeenCalledWith(
      GOOGLE_TOKEN_URL,
      expect.objectContaining({
        body: expect.any(URLSearchParams),
        method: "POST",
      }),
    );
  });

  test("updates only the requested draft with notes and completed status", () => {
    const updated = updateTrackForVersion({
      releaseNotes,
      track: {
        track: "internal",
        releases: [
          { status: "completed", versionCodes: ["40"] },
          { status: "draft", versionCodes: ["41"] },
        ],
      },
      version: "1.13.7",
      versionCode: "41",
    });

    expect(updated.releases).toEqual([
      { status: "completed", versionCodes: ["40"] },
      {
        name: "1.13.7 (41)",
        releaseNotes: [{ language: "pt-BR", text: releaseNotes }],
        status: "completed",
        versionCodes: ["41"],
      },
    ]);
  });

  test("refuses to publish when the exact versionCode is absent", () => {
    expect(() =>
      updateTrackForVersion({
        releaseNotes,
        track: {
          track: "internal",
          releases: [{ status: "draft", versionCodes: ["40"] }],
        },
        version: "1.13.7",
        versionCode: "41",
      }),
    ).toThrow("Expected one internal release for versionCode 41, found 0");
  });

  test("creates an edit, updates the track and commits atomically", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response({ id: "edit-123" }))
      .mockResolvedValueOnce(
        response({
          track: "internal",
          releases: [{ status: "draft", versionCodes: ["41"] }],
        }),
      )
      .mockResolvedValueOnce(response({ track: "internal" }))
      .mockResolvedValueOnce(response({}));

    await publishGooglePlayRelease({
      accessToken: "access-token",
      fetchImpl,
      packageName: "com.sensoriumit.auraxis",
      releaseNotes,
      version: "1.13.7",
      versionCode: "41",
    });

    const applicationUrl = `${GOOGLE_API_ROOT}/applications/com.sensoriumit.auraxis`;
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `${applicationUrl}/edits`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `${applicationUrl}/edits/edit-123/tracks/internal`,
      expect.objectContaining({
        body: expect.stringContaining("\"status\":\"completed\""),
        method: "PUT",
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      `${applicationUrl}/edits/edit-123:commit`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});
