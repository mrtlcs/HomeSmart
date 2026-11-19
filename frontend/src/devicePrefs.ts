import { useEffect, useState } from "react";

// Choices kept per device (a wall tablet can differ from a phone): editing locked, and the speaker
// Spotify plays on when started from this device. Off / empty by default, so nothing changes.

const LANG_KEY = "homesmart-language";
const PIN_KEY = "homesmart-device-pin";
const LOCK_KEY = "homesmart-lock-editing";
const SPEAKER_KEY = "homesmart-spotify-speaker";
const AWAKE_KEY = "homesmart-keep-awake";
const VIEW_KEY = "homesmart-device-view";
const BACKGROUND_KEY = "homesmart-device-background";
const KIDS_KEY = "homesmart-device-kids";
const PREF_EVENT = "homesmart-device-pref";

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null): void {
  try { if (value == null || value === "") window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* private mode: lasts this visit */ }
  window.dispatchEvent(new Event(PREF_EVENT));
}

export const editingLocked = () => read(LOCK_KEY) === "1";
export const setEditingLocked = (locked: boolean) => write(LOCK_KEY, locked ? "1" : null);

export const deviceLanguage = (): "auto" | "vi" | "en" => {
  const val = read(LANG_KEY);
  return val === "vi" || val === "en" ? val : "auto";
};
export const setDeviceLanguage = (lang: "auto" | "vi" | "en") => write(LANG_KEY, lang === "auto" ? null : lang);

export const devicePin = () => read(PIN_KEY) ?? "";
export const setDevicePin = (pin: string | null) => write(PIN_KEY, pin && pin.trim().length === 4 ? pin.trim() : null);

export const spotifySpeaker = () => read(SPEAKER_KEY) ?? "";

/** Keep the screen on: "auto" (the default, only on an Echo Show), "on" or "off". */
export const keepAwakeMode = (): "auto" | "on" | "off" => { const value = read(AWAKE_KEY); return value === "on" || value === "off" ? value : "auto"; };
export const setKeepAwakeMode = (mode: "auto" | "on" | "off") => write(AWAKE_KEY, mode === "auto" ? null : mode);
export const setSpotifySpeaker = (speaker: string) => write(SPEAKER_KEY, speaker || null);

/** This device's own layout, background and Kids scene; empty means it follows the panel's (Settings → Layout
 * and Appearance). A wall tablet in the kids' room can use the Kids layout while the living room keeps the grid. */
export const deviceViewMode = () => read(VIEW_KEY) ?? "";
export const setDeviceViewMode = (mode: string) => write(VIEW_KEY, mode || null);
export const deviceBackground = () => read(BACKGROUND_KEY) ?? "";
export const setDeviceBackground = (preset: string) => write(BACKGROUND_KEY, preset || null);
export const deviceKidsScene = () => read(KIDS_KEY) ?? "";
export const setDeviceKidsScene = (scene: string) => write(KIDS_KEY, scene || null);

/** Child lock on this device: the lock in the header, held 3 s to lock or unlock. While locked, the cards
 * marked "Lock with the child lock" do nothing. Off by default, and nothing is locked until a card is marked. */
const CHILD_KEY = "homesmart-child-lock";
const CHILD_ON_KEY = "homesmart-child-locked";
const NOTE_EVENT = "homesmart-child-note";
export const childLockEnabled = () => read(CHILD_KEY) === "1";
export const childLocked = () => childLockEnabled() && read(CHILD_ON_KEY) === "1";
export const setChildLocked = (locked: boolean) => write(CHILD_ON_KEY, locked ? "1" : null);
export const setChildLockEnabled = (on: boolean) => { if (!on) write(CHILD_ON_KEY, null); write(CHILD_KEY, on ? "1" : null); };
/** A short note under the header: a locked card was tapped, or the lock was tapped instead of held. */
export type ChildLockNote = "blocked" | "hold";
export const childLockNote = (note: ChildLockNote) => window.dispatchEvent(new CustomEvent<ChildLockNote>(NOTE_EVENT, { detail: note }));
export function useChildLockNote(): ChildLockNote | null {
  const [note, setNote] = useState<{ kind: ChildLockNote; at: number } | null>(null);
  useEffect(() => {
    const show = (event: Event) => setNote({ kind: (event as CustomEvent<ChildLockNote>).detail, at: Date.now() });
    window.addEventListener(NOTE_EVENT, show);
    return () => window.removeEventListener(NOTE_EVENT, show);
  }, []);
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), 2600);
    return () => window.clearTimeout(timer);
  }, [note]);
  return note?.kind ?? null;
}

/** Shortcut bar on this device: a black strip at the bottom with up to 9 named shortcuts in 9 equal
 * parts (empty parts stay blank), like the key bar of a wall panel with buttons under the screen.
 * Keys 1–9 on a keyboard or remote run the shortcut in that part. Off by default. */
const KEYBAR_KEY = "homesmart-keybar";
export interface KeyBarSlot { label: string; entity: string }
export interface KeyBarPrefs { on: boolean; hideDock: boolean; slots: KeyBarSlot[] }
export const KEYBAR_SLOTS = 9;
const emptySlots = () => Array.from({ length: KEYBAR_SLOTS }, () => ({ label: "", entity: "" }));
let keyBarCache: { raw: string; value: KeyBarPrefs } | null = null;
/** The bar is a test feature: it only shows on a device where it was unlocked (seven taps on the version
 * in Settings → System); elsewhere it stays off and out of Settings, whatever was saved. */
const KEYBAR_UNLOCKED = "homesmart-keybar-unlocked";
export const keyBarUnlocked = (): boolean => read(KEYBAR_UNLOCKED) === "1";
export const setKeyBarUnlocked = (on: boolean) => write(KEYBAR_UNLOCKED, on ? "1" : null);
export const keyBar = (): KeyBarPrefs => {
  const raw = `${read(KEYBAR_KEY) ?? ""}|${keyBarUnlocked() ? 1 : 0}`;
  // The same object while nothing changed, so components reading it don't re-render for nothing.
  if (keyBarCache && keyBarCache.raw === raw) return keyBarCache.value;
  let value: KeyBarPrefs = { on: false, hideDock: false, slots: emptySlots() };
  try {
    const stored = read(KEYBAR_KEY);
    const saved = stored ? JSON.parse(stored) as Partial<KeyBarPrefs> : null;
    if (saved) value = {
      on: saved.on === true && keyBarUnlocked(),
      hideDock: saved.hideDock === true,
      slots: emptySlots().map((slot, index) => {
        const item = saved.slots?.[index];
        return item && typeof item === "object" ? { label: String(item.label ?? "").slice(0, 24), entity: String(item.entity ?? "") } : slot;
      }),
    };
  } catch { /* a broken value counts as off */ }
  keyBarCache = { raw, value };
  return value;
};
export const setKeyBar = (prefs: KeyBarPrefs) => write(KEYBAR_KEY, prefs.on || prefs.slots.some((slot) => slot.label || slot.entity) ? JSON.stringify(prefs) : null);

/** Animations on this device, each on by default (a slow tablet can turn them off without touching the
 * others): screen transitions and effects, the cards' own animations (Pro) and the animated background. */
const MOTION_KEY = "homesmart-motion";
export interface MotionPrefs { ui: boolean; cards: boolean; background: boolean }
let motionCache: { raw: string | null; value: MotionPrefs } | null = null;
export const motionPrefs = (): MotionPrefs => {
  const raw = read(MOTION_KEY);
  if (motionCache && motionCache.raw === raw) return motionCache.value;
  let value: MotionPrefs = { ui: true, cards: true, background: true };
  try {
    const saved = raw ? JSON.parse(raw) as Partial<MotionPrefs> : null;
    if (saved) value = { ui: saved.ui !== false, cards: saved.cards !== false, background: saved.background !== false };
  } catch { /* defaults */ }
  motionCache = { raw, value };
  return value;
};
export const setMotionPrefs = (prefs: MotionPrefs) => write(MOTION_KEY, prefs.ui && prefs.cards && prefs.background ? null : JSON.stringify(prefs));

/** Re-renders when a device choice changes (in Settings, or in another tab of the same browser). */
export function useDevicePref<T>(get: () => T): T {
  const [value, setValue] = useState(get);
  useEffect(() => {
    const update = () => setValue(get());
    window.addEventListener(PREF_EVENT, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(PREF_EVENT, update); window.removeEventListener("storage", update); };
  }, []);
  return value;
}

/**
 * Play or pause; starting playback moves it first to this device's speaker when one is chosen.
 * Returns false when there was nothing to send: Spotify with no active device only accepts a choice
 * of where to play, and asking it to play would show an error.
 */
export function spotifyPlayPause(hass: { callService: (domain: string, service: string, data?: Record<string, unknown>) => Promise<unknown> }, entityId: string, state?: { state: string; attributes: Record<string, unknown> }): boolean {
  const speaker = spotifySpeaker();
  const sources = Array.isArray(state?.attributes.source_list) ? state.attributes.source_list.map(String) : [];
  const starting = state?.state !== "playing";
  const features = Number(state?.attributes.supported_features) || 0;
  const canPlay = features === 0 || (features & (1 | 16384)) !== 0; // PAUSE or PLAY
  if (starting && speaker && state?.attributes.source !== speaker && sources.includes(speaker)) {
    const moved = hass.callService("media_player", "select_source", { entity_id: entityId, source: speaker });
    void (canPlay ? moved.then(() => hass.callService("media_player", "media_play", { entity_id: entityId })) : moved).catch(() => undefined);
    return true;
  }
  if (!canPlay) return false;
  void hass.callService("media_player", "media_play_pause", { entity_id: entityId });
  return true;
}

/** Separators folded on this device (their keys); every section starts open. */
const FOLDED_KEY = "homesmart-folded";
export const foldedSections = (): string[] => { try { const list = JSON.parse(read(FOLDED_KEY) ?? "[]"); return Array.isArray(list) ? list.filter((item) => typeof item === "string") : []; } catch { return []; } };
export const setSectionFolded = (key: string, folded: boolean) => {
  const rest = foldedSections().filter((item) => item !== key);
  write(FOLDED_KEY, folded ? JSON.stringify([...rest, key].slice(-200)) : rest.length > 0 ? JSON.stringify(rest) : null);
};

/** This device's text size and interface size (Settings → This device): "small", "normal" (the default) or "large". */
export type SizeChoice = "small" | "normal" | "large";
const FONT_KEY = "homesmart-font-size";
const UI_KEY = "homesmart-ui-size";
const sizeOf = (value: string | null): SizeChoice => (value === "small" || value === "large" ? value : "normal");
export const fontSize = () => sizeOf(read(FONT_KEY));
export const setFontSize = (size: SizeChoice) => write(FONT_KEY, size === "normal" ? null : size);
/** The text size as a scale, from 0.8 to 1.8 (1 = normal); the old "small" and "large" still read. */
export const TEXT_SCALE_MIN = 0.8;
export const TEXT_SCALE_MAX = 1.8;
export const textScale = (): number => {
  const raw = read(FONT_KEY);
  if (raw === "small") return 0.88;
  if (raw === "large") return 1.14;
  const value = Number(raw);
  return raw && Number.isFinite(value) ? Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, value)) : 1;
};
export const setTextScale = (scale: number) => {
  const value = Math.round(Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, scale)) * 100) / 100;
  write(FONT_KEY, value === 1 ? null : String(value));
};
export const uiSize = () => sizeOf(read(UI_KEY));
export const setUiSize = (size: SizeChoice) => write(UI_KEY, size === "normal" ? null : size);
export const FONT_SCALE: Record<SizeChoice, number> = { small: 0.88, normal: 1, large: 1.14 };
export const UI_SCALE: Record<SizeChoice, number> = { small: 0.84, normal: 1, large: 1.14 };
