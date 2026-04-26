import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForHealth } from "./healthcheck.js";

describe("waitForHealth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves when fetch returns ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 3, delayMs: 1 })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on thrown errors until success", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 5, delayMs: 1 })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 3, delayMs: 1 })
    ).rejects.toThrow(/did not become healthy/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when fetch returns non-OK after retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 2, delayMs: 1 })
    ).rejects.toThrow(/did not become healthy/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
