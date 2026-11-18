/**
 * HomeSmart Dashboard - Type Definitions
 */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    icon?: string;
    brightness?: number;
    color_temp?: number;
    rgb_color?: [number, number, number];
    current_position?: number;
    current_temperature?: number;
    temperature?: number;
    target_temp_high?: number;
    target_temp_low?: number;
    hvac_modes?: string[];
    hvac_action?: string;
    fan_modes?: string[];
    fan_mode?: string;
    preset_modes?: string[];
    preset_mode?: string;
    min_temp?: number;
    max_temp?: number;
    target_temp_step?: number;
    percentage?: number;
    unit_of_measurement?: string;
    device_class?: string;
    media_title?: string;
    media_artist?: string;
    media_album_name?: string;
    entity_picture?: string;
    volume_level?: number;
    is_volume_muted?: boolean;
    source_list?: string[];
    source?: string;
    battery_level?: number;
    state_class?: string;
    [key: string]: any;
  };
  last_changed?: string;
  last_updated?: string;
}

export type HassEntities = Record<string, HassEntity>;

export interface AreaRegistryEntry {
  area_id: string;
  name: string;
  picture?: string | null;
  icon?: string | null;
}

export interface DeviceRegistryEntry {
  id: string;
  name?: string | null;
  area_id?: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

export interface EntityRegistryEntry {
  entity_id: string;
  name?: string | null;
  area_id?: string | null;
  device_id?: string | null;
  icon?: string | null;
  hidden_by?: string | null;
  disabled_by?: string | null;
}

export interface HomeAssistant {
  states: HassEntities;
  areas?: Record<string, AreaRegistryEntry>;
  devices?: Record<string, DeviceRegistryEntry>;
  entities?: Record<string, EntityRegistryEntry>;
  callService: (domain: string, service: string, serviceData?: Record<string, any>) => Promise<any>;
  callWS: <T = any>(msg: { type: string; [key: string]: any }) => Promise<T>;
  language?: string;
  locale?: { language: string };
  user?: { name: string; is_admin: boolean };
  themes?: any;
}

export type ThemeId = 'aurora' | 'ocean' | 'wine' | 'graphite' | 'emerald' | 'sunset';

export type LayoutMode = 'auto' | 'sidebar' | 'focus' | 'grid' | 'tv';

export type CardSize = '1x1' | '2x1' | '2x2';

export type LocaleId = 'vi' | 'en';

export type DeviceViewport = 'phone' | 'tablet' | 'desktop' | 'tv';

export type ProtectedActionType = 'none' | 'confirm' | 'pin';

export interface ProtectedCardConfig {
  type: ProtectedActionType;
  pin?: string;
}

export interface CustomCardConfig {
  entity_id: string;
  custom_name?: string;
  custom_icon?: string;
  size?: CardSize;
  protection?: ProtectedCardConfig;
  hidden?: boolean;
  order?: number;
}

export interface ScreensaverConfig {
  enabled: boolean;
  timeout_seconds: number;
  show_clock: boolean;
  show_weather: boolean;
  pixel_shift: boolean;
}

export interface HomeSmartConfig {
  version: number;
  theme: ThemeId;
  layout: LayoutMode;
  locale: LocaleId;
  screensaver: ScreensaverConfig;
  custom_cards: Record<string, CustomCardConfig>;
  hidden_entities: string[];
  protected_entities: Record<string, ProtectedCardConfig>;
  area_order: string[];
}

export interface DiscoveredEntity {
  entity_id: string;
  domain: string;
  name: string;
  icon: string;
  state: string;
  attributes: Record<string, any>;
  size: CardSize;
  protection: ProtectedCardConfig;
  hidden: boolean;
}

export interface DiscoveredArea {
  id: string;
  name: string;
  icon: string;
  picture?: string | null;
  entities: DiscoveredEntity[];
}
