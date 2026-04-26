import { describe, expect, it } from "vitest";
import { mapStartupError, STARTUP_ERROR_MESSAGES } from "./errors.js";

describe("mapStartupError", () => {
  it("maps EADDRINUSE / address-in-use strings to PORT_3001_IN_USE", () => {
    expect(mapStartupError("listen EADDRINUSE: address already in use 127.0.0.1:3001")).toBe(
      "PORT_3001_IN_USE"
    );
    expect(mapStartupError(new Error("address already in use"))).toBe(
      "PORT_3001_IN_USE"
    );
  });

  it("maps EACCES / permission errors to DB_PATH_NOT_WRITABLE", () => {
    expect(mapStartupError("EACCES: permission denied, open '/Library/.../mlabs.db'")).toBe(
      "DB_PATH_NOT_WRITABLE"
    );
  });

  it("maps everything else to API_START_FAILED", () => {
    expect(mapStartupError(undefined)).toBe("API_START_FAILED");
    expect(mapStartupError("random failure")).toBe("API_START_FAILED");
  });

  it("exposes a user-facing message for every error code", () => {
    for (const code of ["PORT_3001_IN_USE", "DB_PATH_NOT_WRITABLE", "API_START_FAILED"] as const) {
      expect(STARTUP_ERROR_MESSAGES[code]).toMatch(/\S/);
    }
  });
});
