import { describe, expect, it } from "vitest";
import { ApiEnvSchema } from "@workspace/types";

describe("ApiEnvSchema", () => {
  it("defaults HOST to 127.0.0.1 when not provided", () => {
    const result = ApiEnvSchema.parse({
      DATABASE_URL: "./data/mlabs.db",
    });
    expect(result.HOST).toBe("127.0.0.1");
  });

  it("accepts explicit HOST, PORT, DATABASE_URL, and desktop env vars", () => {
    const result = ApiEnvSchema.safeParse({
      DATABASE_URL: "/Users/u/Library/Application Support/mLabs/mlabs.db",
      PORT: "3001",
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      LOG_LEVEL: "info",
      CORS_ORIGIN: "http://127.0.0.1:3001",
      MIGRATIONS_FOLDER: "/Applications/mLabs.app/Contents/Resources/migrations",
      WEB_DIST_PATH: "/Applications/mLabs.app/Contents/Resources/web",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.HOST).toBe("127.0.0.1");
      expect(result.data.PORT).toBe(3001);
      expect(result.data.MIGRATIONS_FOLDER).toBe(
        "/Applications/mLabs.app/Contents/Resources/migrations"
      );
      expect(result.data.WEB_DIST_PATH).toBe(
        "/Applications/mLabs.app/Contents/Resources/web"
      );
    }
  });

  it("rejects an empty DATABASE_URL", () => {
    const result = ApiEnvSchema.safeParse({ DATABASE_URL: "" });
    expect(result.success).toBe(false);
  });
});
