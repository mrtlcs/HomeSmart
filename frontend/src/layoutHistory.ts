import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeSmartConfig } from "./types/config";

export type LayoutState = Pick<HomeSmartConfig, "pages" | "layouts" | "navigation">;
export interface LayoutVersion { id: number; state: LayoutState }

export function captureLayout(config: HomeSmartConfig): LayoutState {
  return { pages: config.pages, layouts: config.layouts, navigation: config.navigation };
}

export function layoutChanged(before: HomeSmartConfig, after: HomeSmartConfig): boolean {
  return JSON.stringify(captureLayout(before)) !== JSON.stringify(captureLayout(after));
}

function readHistory(key: string): LayoutVersion[] {
  try {
    const versions: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(versions) ? versions.filter((item): item is LayoutVersion => item && typeof item.id === "number" && Array.isArray(item.state?.pages) && item.state.layouts && item.state.navigation).slice(0, 10) : [];
  } catch { return []; }
}

export function useLayoutHistory(userId?: string) {
  const key = `homesmart-layout-history:${window.location.pathname}:${userId ?? "local"}`;
  const [versions, setVersions] = useState(() => readHistory(key));
  const current = useRef(versions);
  useEffect(() => { current.current = readHistory(key); setVersions(current.current); }, [key]);
  const remember = useCallback((config: HomeSmartConfig) => {
    const id = Math.max(Date.now(), (current.current[0]?.id ?? 0) + 1);
    const version = { id, state: captureLayout(config) };
    current.current = [version, ...current.current].slice(0, 10);
    try { localStorage.setItem(key, JSON.stringify(current.current)); } catch { /* this session retains the entries */ }
    setVersions(current.current);
  }, [key]);
  return { versions, remember };
}
