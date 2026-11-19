import type { TranslationKey } from "./i18n";
import type { HomeSmartConfig } from "./types/config";
import type { HomeAssistant } from "./types/home-assistant";

/** The home status line: the person's own sensor when one is chosen (Settings → Home), as "7 devices on
 * at home" for a number or its state as it is; otherwise how many lights are on. */
export function homeStatusText(config: HomeSmartConfig, hass: HomeAssistant, lightsOn: number, t: (key: TranslationKey) => string): string {
  const id = config.home.status_sensor;
  const state = id ? hass.states[id] : undefined;
  if (state && !["unavailable", "unknown", ""].includes(state.state)) {
    const value = Number(state.state);
    if (Number.isFinite(value) && state.state.trim() !== "") {
      const count = Math.round(value);
      return count === 1 ? t("oneDeviceOn") : t("devicesOn").replace("{count}", String(count));
    }
    const unit = state.attributes.unit_of_measurement;
    return unit ? `${state.state} ${String(unit)}` : state.state;
  }
  return lightsOn === 1 ? t("oneLightOn") : t("lightsOn").replace("{count}", String(lightsOn));
}
