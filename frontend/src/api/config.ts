import type { HomeSmartConfig } from "../types/config";
import { DEFAULT_CARDS } from "../plan";
import type { HomeAssistant } from "../types/home-assistant";

export const EMPTY_ENERGY: HomeSmartConfig["energy"] = { consumption: "", grid_import: "", grid_export: "", solar: "", battery: "", solar_today: "" };

// Fields added in later versions get their defaults here, so a config saved by an
// older build (or an integration not yet restarted after an update) never breaks a screen.
function withDefaults(config: HomeSmartConfig): HomeSmartConfig {
  return {
    ...config,
    onboarding_complete: config.onboarding_complete ?? true,
    selected_rooms: config.selected_rooms ?? [],
    favorites: config.favorites ?? [],
    pages: config.pages ?? [],
    accent_color: config.accent_color ?? "#f4edd9",
    layouts: config.layouts ?? {},
    rooms: config.rooms ?? {},
    names: config.names ?? {},
    entity_options: config.entity_options ?? {},
    card_links: config.card_links ?? {},
    card_link_names: config.card_link_names ?? {},
    hidden_for: config.hidden_for ?? {},
    bins: config.bins ?? [],
    ha_icons: config.ha_icons ?? false,
    ha_room_icons: config.ha_room_icons ?? false,
    room_scenes: config.room_scenes ?? false,
    room_sensors: config.room_sensors ?? false,
    free_devices: config.free_devices ?? [],
    free_rooms: config.free_rooms ?? [],
    view_mode: config.view_mode ?? "grid",
    kids_background: config.kids_background ?? "sky",
    highlight_color: config.highlight_color ?? "#ffc94d",
    screensaver: { enabled: false, delay: 180, ...(config.screensaver as Partial<HomeSmartConfig["screensaver"]> | undefined) },
    cards: { ...DEFAULT_CARDS, ...(config.cards as Partial<HomeSmartConfig["cards"]> | undefined) },
    widgets: { weather: false, sun: false, energy: false, bins: false, ...(config.widgets as Partial<HomeSmartConfig["widgets"]> | undefined) },
    live_cameras: config.live_cameras ?? true,
    camera_whole: config.camera_whole ?? false,
    camera_columns: config.camera_columns ?? 2,
    seasons: { enabled: false, off: [], custom: [], ...(config.seasons as Partial<NonNullable<HomeSmartConfig["seasons"]>> | undefined) },
    doorbell: { enabled: false, trigger: "", camera: "", seconds: 60, ...(config.doorbell as Partial<HomeSmartConfig["doorbell"]> | undefined) },
    energy: { ...EMPTY_ENERGY, ...(config.energy as Partial<HomeSmartConfig["energy"]> | undefined) },
    agenda: { show_calendar: true, calendars: [], show_todo: true, todo_entity: "", todo_no_date: false, today_card: false, ...(config.agenda as Partial<HomeSmartConfig["agenda"]> | undefined) },
    home: {
      show_clock: true,
      show_weather: true,
      show_presence: true,
      ha_notifications: true,
      status_sensor: "",
      presence_people: [],
      badges: [],
      ...(config.home as Partial<HomeSmartConfig["home"]> | undefined),
    },
    global_actions: {
      lights_on: true,
      lights_off: true,
      ...(config.global_actions as Partial<HomeSmartConfig["global_actions"]> | undefined),
    },
    navigation: {
      rooms: true,
      scenes: true,
      media: true,
      security: true,
      cameras: true,
      plan: false,
      ...(config.navigation as Partial<HomeSmartConfig["navigation"]> | undefined),
    },
    layout: {
      density: "comfortable",
      featured_room: null,
      ...(config.layout as Partial<HomeSmartConfig["layout"]> | undefined),
    },
    background: {
      preset: "adaptive_ember",
      animated: true,
      include_devices: true,
      ...(config.background as Partial<HomeSmartConfig["background"]> | undefined),
    },
    weather: {
      entity_id: "auto",
      forecast_type: "daily",
      ...(config.weather as Partial<HomeSmartConfig["weather"]> | undefined),
    },
    preferences: {
      clock: "auto",
      temperature_unit: "auto",
      ...(config.preferences as Partial<HomeSmartConfig["preferences"]> | undefined),
    },
  };
}

export async function getConfig(hass: HomeAssistant): Promise<HomeSmartConfig> {
  return withDefaults(await hass.connection.sendMessagePromise<HomeSmartConfig>({
    type: "homesmart/config",
  }));
}

export async function saveConfig(
  hass: HomeAssistant,
  config: HomeSmartConfig,
): Promise<HomeSmartConfig> {
  return withDefaults(await hass.connection.sendMessagePromise<HomeSmartConfig>({
    type: "homesmart/config/save",
    config,
  }));
}

