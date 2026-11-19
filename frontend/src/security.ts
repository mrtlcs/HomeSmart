import type { DiscoveredEntity } from "./types/discovery";
import type { HassEntity } from "./types/home-assistant";

// Only these binary_sensor classes describe the safety of the home. Battery,
// connectivity, update, problem and similar sensors stay out of Security.
const SECURITY_CLASSES = new Set([
  "carbon_monoxide",
  "door",
  "garage_door",
  "gas",
  "lock",
  "moisture",
  "motion",
  "occupancy",
  "opening",
  "safety",
  "smoke",
  "tamper",
  "vibration",
  "window",
]);

const ALERT_CLASSES = new Set([
  "carbon_monoxide",
  "door",
  "garage_door",
  "gas",
  "moisture",
  "motion",
  "opening",
  "safety",
  "smoke",
  "tamper",
  "window",
]);

/** A device HOMESMART would watch in Security, before the person's choice for it. */
export function isSecurityKind(entity: DiscoveredEntity, state?: HassEntity): boolean {
  if (entity.domain === "lock" || entity.domain === "camera") return true;
  if (entity.domain !== "binary_sensor") return false;
  return SECURITY_CLASSES.has(String(state?.attributes.device_class ?? entity.device_class ?? ""));
}

/** Any binary sensor can be added to Security by hand (a window without the window class, say). */
export const canJoinSecurity = (entity: DiscoveredEntity) => entity.domain === "binary_sensor";

export function isSecurityEntity(entity: DiscoveredEntity, state?: HassEntity): boolean {
  if (entity.security_item && canJoinSecurity(entity)) return true;
  return !entity.not_security && isSecurityKind(entity, state);
}

/** Needs attention: an unlocked lock, or an alert-class sensor that is on. A sensor added by hand
 * alerts whenever it is on (open, detected). */
export function isSecurityAlert(state?: HassEntity, entity?: DiscoveredEntity): boolean {
  if (!state) return false;
  if (state.entity_id.startsWith("lock.")) return ["unlocked", "open", "jammed"].includes(state.state);
  if (state.state !== "on") return false;
  return ALERT_CLASSES.has(String(state.attributes.device_class)) || Boolean(entity?.security_item && !isSecurityKind(entity, state));
}

export function availableSections(entities: DiscoveredEntity[]) {
  return {
    hasMedia: entities.some((entity) => entity.domain === "media_player"),
    hasScenes: entities.some((entity) => entity.domain === "scene"),
    hasSecurity: entities.some((entity) => isSecurityEntity(entity)),
    hasCameras: entities.some((entity) => entity.domain === "camera"),
  };
}
