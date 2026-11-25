// Pure circadian lighting calculations and subtle CSS overlay helpers (no React/JSX).

export interface CircadianTint {
  warmth: number;
  brightness: number;
}

export type CircadianPhase = "dawn" | "day" | "dusk" | "night";

export type CircadianPalette = [string, string, string, string];

const AMBER_RGB: [number, number, number] = [212, 145, 92]; // #d4915c
const MAX_WARMTH_SHIFT = 0.18;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
  if (normalized.length < 7) return null;
  const rgb = [1, 3, 5].map((i) => parseInt(normalized.slice(i, i + 2), 16));
  if (rgb.some((channel) => Number.isNaN(channel))) return null;
  return [rgb[0], rgb[1], rgb[2]];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Maps sun elevation (-90 to +90 degrees) to circadian warmth and brightness factors.
 * - Night (< -6): warmth 0.15, brightness 0.1–0.3
 * - Dawn/dusk (-6 to +10): rapid warmth transition 0.15 -> 0.8, brightness 0.3–0.8
 * - Day (> 10): warmth 0.3, brightness 0.8–1.0
 */
export function computeCircadianTint(sunElevation: number): CircadianTint {
  const el = clamp(sunElevation, -90, 90);

  if (el < -6) {
    const t = (el + 90) / 84;
    return {
      warmth: 0.15,
      brightness: 0.1 + 0.2 * t,
    };
  }

  if (el <= 10) {
    const t = (el + 6) / 16;
    return {
      warmth: 0.15 + 0.65 * t,
      brightness: 0.3 + 0.5 * t,
    };
  }

  const t = (el - 10) / 80;
  return {
    warmth: 0.3,
    brightness: 0.8 + 0.2 * t,
  };
}

/**
 * Subtly shifts a 4-color ambient palette toward warm amber (#d4915c) by the warmth
 * factor (up to 18% shift) while gently modulating brightness (82%–100%) so night
 * themes stay rich and calm rather than turning flat black.
 */
export function applyCircadianShift(
  palette: CircadianPalette,
  warmth: number,
  brightness: number,
): CircadianPalette {
  const mix = clamp(warmth, 0, 1) * MAX_WARMTH_SHIFT;
  const bright = 0.82 + 0.18 * clamp(brightness, 0, 1);

  const shiftColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = (rgb[0] + (AMBER_RGB[0] - rgb[0]) * mix) * bright;
    const g = (rgb[1] + (AMBER_RGB[1] - rgb[1]) * mix) * bright;
    const b = (rgb[2] + (AMBER_RGB[2] - rgb[2]) * mix) * bright;
    return rgbToHex(r, g, b);
  };

  return [
    shiftColor(palette[0]),
    shiftColor(palette[1]),
    shiftColor(palette[2]),
    shiftColor(palette[3]),
  ];
}

/** Fallback solar elevation estimate from local clock when `sun.sun` is unavailable. */
export function estimateElevationFromClock(now = new Date()): { elevation: number; rising: boolean } {
  const hours = now.getHours() + now.getMinutes() / 60;
  // Approximate sinusoid peaking at 12:00 (+60 deg) and dipping at 00:00 (-60 deg)
  const elevation = Math.sin(((hours - 6) / 12) * Math.PI) * 60;
  return { elevation, rising: hours < 12 };
}

/**
 * Determines the circadian phase from sun elevation and solar direction:
 * - night: elevation < -6
 * - dawn: -6 <= elevation <= 6 (rising)
 * - dusk: -6 <= elevation <= 6 (setting)
 * - day: elevation > 6
 */
export function circadianPhase(elevation: number, rising = true): CircadianPhase {
  if (elevation < -6) return "night";
  if (elevation > 6) return "day";
  return rising ? "dawn" : "dusk";
}

/** CSS overlay rules for circadian phases applied to the ambient background layer. */
export const CIRCADIAN_OVERLAY_CSS = `
.app-shell.circadian-dawn .ambient-background::after,
.app-shell.circadian-dusk .ambient-background::after,
.app-shell.circadian-night .ambient-background::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 1200ms ease, background 1200ms ease;
}
.app-shell.circadian-dawn .ambient-background::after {
  background: linear-gradient(180deg, rgba(255, 198, 138, 0.06) 0%, rgba(212, 145, 92, 0.05) 100%);
}
.app-shell.circadian-day .ambient-background::after {
  content: none;
}
.app-shell.circadian-dusk .ambient-background::after {
  background: rgba(212, 145, 92, 0.09);
}
.app-shell.circadian-night .ambient-background::after {
  background: rgba(10, 22, 56, 0.08);
}
`.trim();
