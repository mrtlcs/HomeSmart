// Subtle haptic feedback helper for touch devices, safely guarded when Vibrate API is unavailable.

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function triggerHaptic(kind: "light" | "medium" | "heavy" = "light"): void {
  if (!hapticsEnabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(kind === "heavy" ? 28 : kind === "medium" ? 16 : 9);
  } catch {
    // Ignore browser security/permission errors when triggering before user gesture
  }
}
