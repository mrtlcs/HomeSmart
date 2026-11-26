import { useEffect, useState } from "react";

export const SCREEN_PROFILES = ["classic", "auto", "phone", "wall", "desktop", "tv"] as const;
export type ScreenProfile = typeof SCREEN_PROFILES[number];
export type AdaptiveProfile = Exclude<ScreenProfile, "classic" | "auto">;
export const DASHBOARD_TABS = ["home", "rooms", "favorites", "alerts", "more"] as const;
export type DashboardTab = typeof DASHBOARD_TABS[number];

export interface ScreenOptions {
  start: DashboardTab;
  tabs: DashboardTab[];
  density: "comfortable" | "compact";
  idle: number;
  quiet_start: number;
  quiet_end: number;
}

export interface ScreenProfiles {
  default: ScreenProfile;
  users: Record<string, ScreenProfile>;
  options: Partial<Record<AdaptiveProfile, ScreenOptions>>;
}

export function screenOptions(kind: AdaptiveProfile, overrides?: ScreenProfiles): ScreenOptions {
  return overrides?.options?.[kind] ?? {
    start: "home", tabs: [...DASHBOARD_TABS], density: "comfortable",
    idle: kind === "wall" ? 90 : 0, quiet_start: kind === "wall" ? 22 : 0, quiet_end: kind === "wall" ? 7 : 0,
  };
}

export function resolveScreenProfile(device: ScreenProfile | "", userId: string | undefined, shared: ScreenProfiles | undefined, width: number, coarse: boolean): Exclude<ScreenProfile, "auto"> {
  const selected = device || (userId && shared?.users?.[userId]) || shared?.default || "classic";
  if (selected !== "auto") return selected;
  if (width < 680) return "phone";
  return coarse && width < 1300 ? "wall" : "desktop";
}

export function isQuietHour(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

const profileStorage = (id?: string) => `homesmart-screen-profile:${id ?? "local"}`;
const changed = "homesmart-screen-profile";
function readProfile(id?: string): ScreenProfile | "" {
  try {
    const value = localStorage.getItem(profileStorage(id));
    return SCREEN_PROFILES.find((item) => item === value) ?? "";
  } catch { return ""; }
}

export function setScreenProfile(userId: string | undefined, value: ScreenProfile | ""): void {
  try {
    if (value) localStorage.setItem(profileStorage(userId), value);
    else localStorage.removeItem(profileStorage(userId));
    window.dispatchEvent(new Event(changed));
  } catch { /* browser storage unavailable */ }
}

export function useScreenProfile(userId?: string): ScreenProfile | "" {
  const [value, setValue] = useState(() => readProfile(userId));
  useEffect(() => {
    const refresh = () => setValue(readProfile(userId));
    refresh();
    window.addEventListener(changed, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(changed, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [userId]);
  return value;
}
