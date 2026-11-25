import type { TranslationKey } from "../i18n";
import type { HomeSmartConfig, ScreenLayout } from "../types/config";
import type { DiscoveredEntity, DiscoveryResponse, Room } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";

/** What every operational screen receives from App. */
export interface ScreenProps {
  /** Every discovered room, including the ones not shown in the panel (free plan: only allowed devices). */
  allRooms: Room[];
  /** Every room and device, for the "Add" pickers (the free plan checks each pick). */
  catalogRooms: Room[];
  config: HomeSmartConfig;
  /** Rooms selected for the panel, in the user's order. */
  data: DiscoveryResponse;
  editing: boolean;
  hass: HomeAssistant;
  language?: string;
  /** Builds on the latest config, so successive edits never undo each other. */
  onConfig: (update: (config: HomeSmartConfig) => HomeSmartConfig) => void;
  onLayout: (screen: string, layout: ScreenLayout) => void;
  onSettings: () => void;
  /** Opens the layout picker (Grade, Lateral, Lista, Foco). */
  onToggleEdit: () => void;
  /** Optional navigation callback for switching dock tabs programmatically (e.g. duplicate/delete custom tab). */
  onNavigate?: (page: string) => void;
  t: (key: TranslationKey) => string;
}

export function entityIndex(rooms: Room[]): { byId: Map<string, DiscoveredEntity>; roomName: (entity: DiscoveredEntity) => string | undefined } {
  const byId = new Map<string, DiscoveredEntity>();
  const names = new Map<string, string>();
  for (const room of rooms) {
    // "Unassigned" comes untranslated from discovery; screens fall back to their own translated label.
    if (room.id !== "__unassigned__") names.set(room.id, room.name);
    for (const entity of room.entities) if (!byId.has(entity.entity_id)) byId.set(entity.entity_id, entity);
  }
  return { byId, roomName: (entity) => names.get(entity.area_id) };
}
