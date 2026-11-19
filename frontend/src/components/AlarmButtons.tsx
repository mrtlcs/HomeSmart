import { useState } from "react";
import type { TranslationKey } from "../i18n";
import { ALARM_ARMED, alarmCall, alarmCodeFormat, alarmModes } from "../devices";
import type { DiscoveredEntity } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";

/** Arm and disarm right on a card (an option of the alarm panel). When the panel asks for a code, or
 * the card asks to confirm, a tap opens the details with the keypad instead. */
export function AlarmButtons({ entity, hass, onOpen, t }: { entity: DiscoveredEntity; hass: HomeAssistant; onOpen: (entity: DiscoveredEntity) => void; t: (key: TranslationKey) => string }) {
  const state = hass.states[entity.entity_id];
  const [busy, setBusy] = useState(false);
  if (!state || ["unavailable", "unknown"].includes(state.state)) return null;
  const armed = ALARM_ARMED.has(state.state) || ["arming", "pending", "triggered"].includes(state.state);
  const needsCode = (service: string) => alarmCodeFormat(state) != null && (service === "alarm_disarm" || state.attributes.code_arm_required !== false);
  const send = (service: string) => {
    if (entity.confirm || needsCode(service)) { onOpen(entity); return; }
    setBusy(true);
    void alarmCall(hass, state, service, "").catch(() => undefined).finally(() => setBusy(false));
  };
  const short: Record<string, TranslationKey> = { alarm_arm_home: "alarmShortHome", alarm_arm_away: "alarmShortAway", alarm_arm_night: "alarmShortNight", alarm_arm_vacation: "alarmShortVacation", alarm_arm_custom_bypass: "alarmShortCustom" };
  const modes = armed ? [{ service: "alarm_disarm", label: t("alarmDisarm"), full: t("alarmDisarm") }] : alarmModes(state, t).slice(0, 3).map((mode) => ({ ...mode, full: mode.label, label: t(short[mode.service] ?? mode.label) }));
  return <div className="hd-alarm-buttons" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()} role="group" aria-label={entity.name}>
    {modes.map((mode) => <button className={mode.service === "alarm_disarm" ? "hd-alarm-buttons__disarm" : undefined} disabled={busy} aria-label={mode.full} key={mode.service} onClick={() => send(mode.service)} title={mode.full} type="button">{mode.label}</button>)}
  </div>;
}
