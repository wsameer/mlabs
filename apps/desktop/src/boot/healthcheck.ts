export interface WaitForHealthOptions {
  retries?: number;
  delayMs?: number;
  path?: string;
}

export async function waitForHealth(
  baseUrl: string,
  options: WaitForHealthOptions = {}
): Promise<void> {
  const retries = options.retries ?? 120;
  const delayMs = options.delayMs ?? 250;
  const path = options.path ?? "/api/health";

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${path}`);
      if (res.ok) {
        return;
      }
      lastError = new Error(`status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(
    `API did not become healthy in time (${retries} attempts): ${String(lastError)}`
  );
}
