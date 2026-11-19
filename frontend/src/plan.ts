import { createContext, useContext } from "react";
import type { LicenseStatus } from "./api/license";
import type { HomeSmartBackgroundPreset, HomeSmartCardStyle, HomeSmartConfig, HomeSmartViewMode } from "./types/config";
import type { DiscoveredEntity, Room } from "./types/discovery";

export const FREE_BACKGROUNDS: HomeSmartBackgroundPreset[] = [
  "adaptive_ember", "adaptive_aurora", "adaptive_sunset", "adaptive_forest",
  "adaptive_lagoon", "adaptive_orchid", "adaptive_reef", "adaptive_berry",
  "adaptive_glacier", "adaptive_citrus", "fixed_night", "fixed_ocean",
  "fixed_graphite", "fixed_wine", "fixed_plum", "fixed_cobalt",
  "fixed_violet", "fixed_magenta", "fixed_coral", "fixed_emerald", "fixed_teal"
];
export const FREE_VIEW_MODES: HomeSmartViewMode[] = ["grid", "sidebar", "list", "focus", "kids", "photo"];
export const DEFAULT_ACCENT = "#f4edd9";
export const DEFAULT_HIGHLIGHT = "#ffc94d";
export const DEFAULT_CARDS: HomeSmartCardStyle = { corners: 100, frame: true, glass: 50, animations: false, sparklines: false, players: true };
export const SUPPORT_EMAIL = "";
export const DESKTOP_URL = "";
export const proPrice = (_plan?: string, _locale?: string) => "";
const CONTROLLABLE = new Set(["light", "switch", "fan", "cover", "climate", "media_player", "lock"]);

export type UpsellReason = "rooms" | "devices" | "feature" | "general";

export interface PlanState {
  pro: boolean;
  license: LicenseStatus | null;
  limits: { rooms: number; devices: number };
  allowed: Set<string> | null;
  allow: (entityId: string) => boolean;
  upsell: (reason?: UpsellReason) => void;
}

export const PlanContext = createContext<PlanState>({
  pro: true,
  license: null,
  limits: { rooms: 9999, devices: 9999 },
  allowed: null,
  allow: () => true,
  upsell: () => undefined,
});

export const usePlan = () => useContext(PlanContext);

export function isControllable(entity: Pick<DiscoveredEntity, "domain">): boolean {
  return CONTROLLABLE.has(entity.domain);
}

export function selectedRoomIds(config: HomeSmartConfig, rooms: Room[]): string[] {
  const ids = rooms.map((room) => room.id);
  const selected = Array.isArray(config?.selected_rooms) ? config.selected_rooms : [];
  const chosen = selected.filter((id) => ids.includes(id));
  return chosen.length > 0 ? chosen : ids;
}

export function freeRoomIds(config: HomeSmartConfig, rooms: Room[]): string[] {
  return selectedRoomIds(config, rooms);
}

export function panelRoomIds(config: HomeSmartConfig, rooms: Room[], _pro = true): string[] {
  return selectedRoomIds(config, rooms);
}

export function freeDevices(_config: HomeSmartConfig, rooms: Room[]): string[] {
  return rooms.flatMap((room) => room.entities).filter(isControllable).map((entity) => entity.entity_id);
}

export function freeUsage(_config: HomeSmartConfig, rooms: Room[]): { rooms: number; devices: number } {
  return { rooms: rooms.length, devices: freeDevices(_config, rooms).length };
}

export function overFreeLimits(_config: HomeSmartConfig, _rooms: Room[], _limits: { rooms: number; devices: number }): boolean {
  return false;
}

export function restrictRooms(rooms: Room[], _allowedIds: string[] | Set<string> | null): Room[] {
  return rooms;
}

export function effectiveConfig(config: HomeSmartConfig, _pro = true): HomeSmartConfig {
  return config;
}
