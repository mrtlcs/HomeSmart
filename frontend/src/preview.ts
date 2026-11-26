import "./main";
import type { HomeSmartConfig } from "./types/config";
import type { DiscoveredEntity, DiscoveryResponse } from "./types/discovery";
import type { HassEntity, HomeAssistant, HomeSmartPanelInfo } from "./types/home-assistant";

const now = new Date().toISOString();
const fixtures: Array<[string, string, string, HassEntity["attributes"]]> = [
  ["light.living_room", "Living room lights", "on", { brightness: 180 }],
  ["sensor.temperature", "Room temperature", "23", { device_class: "temperature", unit_of_measurement: "°C" }],
  ["sensor.grid_energy_monthly", "Monthly grid energy", "123", { device_class: "energy", unit_of_measurement: "kWh" }],
  ["lock.front_door", "Front door", "locked", {}],
];
const states: HomeAssistant["states"] = {};
const entities: DiscoveredEntity[] = fixtures.map(([entity_id, name, state, attributes]) => {
  states[entity_id] = { entity_id, state, attributes: { ...attributes, friendly_name: name }, last_changed: now, last_updated: now };
  return { entity_id, name, domain: entity_id.split(".")[0], area_id: "living", device_id: null, device_class: attributes.device_class ?? null, icon: null };
});
const discovery: DiscoveryResponse = {
  version: "2.2.4",
  rooms: [{ id: "living", name: "Living room", aliases: [], floor_id: null, icon: null, device_count: 0, entities }],
  counts: { rooms: 1, devices: 0, entities: entities.length },
};
let config: Partial<HomeSmartConfig> = { revision: 0, onboarding_complete: true, selected_rooms: ["living"] };
const panel = document.querySelector<HTMLElement & { hass: HomeAssistant; panel: HomeSmartPanelInfo }>("#dashboard");
if (!panel) throw new Error("Missing HomeSmart preview panel");

const hass: HomeAssistant = {
  states,
  locale: { language: "en" },
  user: { id: "preview", is_admin: true },
  connection: {
    async sendMessagePromise<T>(message: Record<string, unknown>): Promise<T> {
      switch (message.type) {
        case "homesmart/rooms": return discovery as T;
        case "homesmart/config": return config as T;
        case "homesmart/config/save":
          if (message.revision !== config.revision) throw Object.assign(new Error("Configuration changed"), { code: "config_conflict" });
          config = { ...message.config as HomeSmartConfig, revision: Number(config.revision) + 1 };
          return config as T;
        case "homesmart/releases/list": return { releases: [] } as T;
        case "homesmart/license": return { plan: "pro", licensed: true, limits: {} } as T;
        default: return {} as T;
      }
    },
  },
  async callService(domain, service, data) {
    const id = data?.entity_id;
    if (typeof id !== "string" || !hass.states[id]) return;
    const current = hass.states[id];
    const state = service === "toggle" ? (current.state === "on" ? "off" : "on")
      : domain === "lock" ? (service === "unlock" ? "unlocked" : "locked")
      : service === "turn_on" ? "on" : service === "turn_off" ? "off" : current.state;
    const changed = new Date().toISOString();
    hass.states = { ...hass.states, [id]: { ...current, state, last_changed: changed, last_updated: changed } };
    panel.hass = { ...hass };
  },
};
panel.panel = { config: { version: discovery.version } };
panel.hass = { ...hass };
