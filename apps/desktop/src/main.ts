import { waitForHealth } from "./boot/healthcheck.js";
import { mapStartupError, STARTUP_ERROR_MESSAGES } from "./boot/errors.js";

const API_BASE = "http://127.0.0.1:3001";

function setError(code: string, detail: string): void {
  const root = document.getElementById("app");
  if (!root) return;
  root.dataset.state = "error";
  const status = root.querySelector<HTMLElement>(".status");
  if (status)
    status.textContent =
      STARTUP_ERROR_MESSAGES[code as keyof typeof STARTUP_ERROR_MESSAGES] ??
      code;
  const pre = root.querySelector<HTMLElement>(".error");
  if (pre) {
    pre.hidden = false;
    pre.textContent = `${code}\n\n${detail}`;
  }
}

async function boot(): Promise<void> {
  try {
    await waitForHealth(API_BASE);
    window.location.replace(API_BASE);
  } catch (err) {
    const code = mapStartupError(err);
    setError(code, err instanceof Error ? err.message : String(err));
  }
}

void boot();
