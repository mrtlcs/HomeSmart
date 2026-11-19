import type { HomeAssistant } from "./types/home-assistant";

type Invoke = (command: string, args?: Record<string, unknown>) => Promise<unknown>;

function invoker(): Invoke | undefined {
  return (window as unknown as { __TAURI_INTERNALS__?: { invoke?: Invoke } }).__TAURI_INTERNALS__?.invoke;
}

const SESSION_KEY = "homesmart-desktop";

export function inDesktopApp(): boolean {
  if (!invoker()) return false;
  try {
    if (new URLSearchParams(window.location.search).get("app") === "1") window.sessionStorage.setItem(SESSION_KEY, "1");
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("app") === "1";
  }
}

export async function reportLicenseToDesktop(_hass: HomeAssistant): Promise<void> {
  // Unlocked
}

export function wantsProSheet(): boolean {
  return false;
}
