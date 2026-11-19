import { useEffect } from "react";
import { RUNNABLE } from "../devices";
import { keyBar, useDevicePref, type KeyBarSlot } from "../devicePrefs";
import type { HomeAssistant } from "../types/home-assistant";

/** Runs a shortcut: scripts and buttons run, scenes turn on, everything else toggles. */
function runShortcut(hass: HomeAssistant, entityId: string) {
  const domain = entityId.split(".")[0];
  if (domain === "script") return hass.callService("script", "turn_on", { entity_id: entityId });
  if (RUNNABLE.has(domain)) return hass.callService(domain, "press", { entity_id: entityId });
  if (domain === "scene") return hass.callService("scene", "turn_on", { entity_id: entityId });
  if (domain === "automation") return hass.callService("automation", "trigger", { entity_id: entityId });
  return hass.callService("homeassistant", "toggle", { entity_id: entityId });
}

/** The shortcut bar of this device (Settings → This device): a black strip at the bottom, split in 9
 * equal parts, each with its name; a tap, or keys 1–9, runs that part's shortcut. */
export function KeyBar({ active, hass, label }: { active: boolean; hass: HomeAssistant; label: string }) {
  const prefs = useDevicePref(keyBar);
  const slots = prefs.slots;

  useEffect(() => {
    if (!prefs.on || !active) return;
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || !/^[1-9]$/.test(event.key)) return;
      // Typing a number in a field is typing, not a shortcut.
      const target = event.composedPath()[0] as HTMLElement | undefined;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const slot = slots[Number(event.key) - 1];
      if (!slot?.entity) return;
      event.preventDefault();
      void runShortcut(hass, slot.entity).catch(() => undefined);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [prefs.on, active, slots, hass]);

  if (!prefs.on) return null;
  const run = (slot: KeyBarSlot) => { if (slot.entity) void runShortcut(hass, slot.entity).catch(() => undefined); };
  return <nav aria-label={label} className="hd-keybar">
    {slots.map((slot, index) => slot.label || slot.entity
      ? <button disabled={!slot.entity} key={index} onClick={() => run(slot)} style={{ gridColumn: index + 1 }} type="button">{slot.label || String(index + 1)}</button>
      : null)}
  </nav>;
}
