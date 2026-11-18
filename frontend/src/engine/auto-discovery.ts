/**
 * HomeSmart - Zero-YAML Auto-Discovery Engine
 * Automatically discovers, maps, and sizes entities into Areas/Rooms.
 */

import {
  CardSize,
  DiscoveredArea,
  DiscoveredEntity,
  HomeAssistant,
  HomeSmartConfig,
  ProtectedCardConfig,
} from '../types';

/**
 * Standard domains supported by HomeSmart
 */
const SUPPORTED_DOMAINS = new Set([
  'light',
  'switch',
  'climate',
  'cover',
  'media_player',
  'camera',
  'fan',
  'lock',
  'sensor',
  'binary_sensor',
  'water_heater',
]);

/**
 * Default heuristic for Bento card sizing
 */
export function determineDefaultCardSize(domain: string, entityState?: any): CardSize {
  switch (domain) {
    case 'climate':
    case 'camera':
    case 'media_player':
      return '2x2';

    case 'cover':
      return '2x1';

    case 'light':
      // If light supports brightness adjustments, make it a 2x1 slider card
      if (
        entityState &&
        entityState.attributes &&
        (entityState.attributes.supported_color_modes?.some((m: string) => m !== 'onoff') ||
          entityState.attributes.brightness !== undefined ||
          (entityState.attributes.supported_features && (entityState.attributes.supported_features & 1) !== 0))
      ) {
        return '2x1';
      }
      return '1x1';

    case 'fan':
      // Fans with speed/percentage support default to 2x1
      if (
        entityState &&
        entityState.attributes &&
        (entityState.attributes.percentage !== undefined ||
          (entityState.attributes.supported_features && (entityState.attributes.supported_features & 1) !== 0))
      ) {
        return '2x1';
      }
      return '1x1';

    case 'water_heater':
      return '2x1';

    case 'switch':
    case 'lock':
    case 'sensor':
    case 'binary_sensor':
    default:
      return '1x1';
  }
}

/**
 * Default protection rule (locks and security devices default to confirmation)
 */
export function determineDefaultProtection(domain: string): ProtectedCardConfig {
  if (domain === 'lock') {
    return { type: 'confirm' };
  }
  return { type: 'none' };
}

/**
 * Run Zero-YAML Auto-Discovery
 */
export function runAutoDiscovery(
  hass: HomeAssistant,
  config: HomeSmartConfig,
  showHidden: boolean = false
): DiscoveredArea[] {
  if (!hass || !hass.states) {
    return [];
  }

  const areasMap = new Map<string, DiscoveredArea>();

  // 1. Initialize registered Areas from Home Assistant
  if (hass.areas) {
    for (const [areaId, area] of Object.entries(hass.areas)) {
      areasMap.set(areaId, {
        id: areaId,
        name: area.name || areaId,
        icon: area.icon || getAreaDefaultIcon(area.name || areaId),
        picture: area.picture,
        entities: [],
      });
    }
  }

  // Fallback 'unassigned' area for devices without a room
  const unassignedArea: DiscoveredArea = {
    id: 'unassigned',
    name: config.locale === 'vi' ? 'Thiết bị khác' : 'Other Devices',
    icon: 'mdi:devices',
    entities: [],
  };

  // 2. Map all entities to their corresponding area
  for (const [entityId, entityState] of Object.entries(hass.states)) {
    const domain = entityId.split('.')[0];
    if (!SUPPORTED_DOMAINS.has(domain)) {
      continue;
    }

    // Check hidden configuration
    const isExplicitlyHidden = config.hidden_entities?.includes(entityId);
    const customConfig = config.custom_cards?.[entityId];
    const isHidden = customConfig?.hidden ?? isExplicitlyHidden;

    if (isHidden && !showHidden) {
      continue;
    }

    // Resolve Area ID: entity registry -> device registry -> unassigned
    let targetAreaId: string | null = null;
    const entityRegistry = hass.entities?.[entityId];
    if (entityRegistry?.area_id) {
      targetAreaId = entityRegistry.area_id;
    } else if (entityRegistry?.device_id && hass.devices) {
      const device = hass.devices[entityRegistry.device_id];
      if (device?.area_id) {
        targetAreaId = device.area_id;
      }
    }

    // Determine card size
    const size: CardSize = customConfig?.size || determineDefaultCardSize(domain, entityState);

    // Determine security protection
    const protection: ProtectedCardConfig =
      customConfig?.protection ||
      config.protected_entities?.[entityId] ||
      determineDefaultProtection(domain);

    const friendlyName =
      customConfig?.custom_name ||
      entityState.attributes.friendly_name ||
      entityId;

    const icon =
      customConfig?.custom_icon ||
      entityState.attributes.icon ||
      getDefaultEntityIcon(domain, entityState.state);

    const discoveredEntity: DiscoveredEntity = {
      entity_id: entityId,
      domain,
      name: friendlyName,
      icon,
      state: entityState.state,
      attributes: entityState.attributes,
      size,
      protection,
      hidden: !!isHidden,
    };

    if (targetAreaId && areasMap.has(targetAreaId)) {
      areasMap.get(targetAreaId)!.entities.push(discoveredEntity);
    } else {
      unassignedArea.entities.push(discoveredEntity);
    }
  }

  // 3. Compile list of areas with entities
  const result: DiscoveredArea[] = [];
  for (const area of areasMap.values()) {
    if (area.entities.length > 0) {
      sortAreaEntities(area.entities);
      result.push(area);
    }
  }

  if (unassignedArea.entities.length > 0) {
    sortAreaEntities(unassignedArea.entities);
    result.push(unassignedArea);
  }

  // 4. Respect custom area order if configured
  if (config.area_order && config.area_order.length > 0) {
    result.sort((a, b) => {
      const indexA = config.area_order.indexOf(a.id);
      const indexB = config.area_order.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return result;
}

/**
 * Sort entities inside an area so larger Bento cards (2x2, 2x1) align neatly before 1x1
 */
function sortAreaEntities(entities: DiscoveredEntity[]): void {
  const sizePriority: Record<CardSize, number> = {
    '2x2': 1,
    '2x1': 2,
    '1x1': 3,
  };

  entities.sort((a, b) => {
    const priorityDiff = sizePriority[a.size] - sizePriority[b.size];
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Assign appropriate area icon by name keywords
 */
function getAreaDefaultIcon(areaName: string): string {
  const lower = areaName.toLowerCase();
  if (lower.includes('khách') || lower.includes('living')) return 'mdi:sofa';
  if (lower.includes('ngủ') || lower.includes('bed')) return 'mdi:bed';
  if (lower.includes('bếp') || lower.includes('kitchen')) return 'mdi:silverware-fork-knife';
  if (lower.includes('tắm') || lower.includes('bath') || lower.includes('wc')) return 'mdi:shower';
  if (lower.includes('sân') || lower.includes('vườn') || lower.includes('yard') || lower.includes('garden')) return 'mdi:tree';
  if (lower.includes('gara') || lower.includes('garage') || lower.includes('xe')) return 'mdi:garage';
  if (lower.includes('làm việc') || lower.includes('office') || lower.includes('desk')) return 'mdi:desk';
  if (lower.includes('ninh') || lower.includes('cổng') || lower.includes('gate') || lower.includes('security')) return 'mdi:shield-home';
  return 'mdi:home-outline';
}

/**
 * Assign appropriate entity icon by domain & state
 */
export function getDefaultEntityIcon(domain: string, state?: string): string {
  switch (domain) {
    case 'light':
      return state === 'on' ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline';
    case 'switch':
      return 'mdi:power';
    case 'climate':
      return 'mdi:air-conditioner';
    case 'cover':
      return state === 'open' ? 'mdi:curtains-open' : 'mdi:curtains';
    case 'media_player':
      return 'mdi:television-ambient-light';
    case 'camera':
      return 'mdi:cctv';
    case 'fan':
      return 'mdi:fan';
    case 'lock':
      return state === 'locked' ? 'mdi:lock' : 'mdi:lock-open-variant';
    case 'water_heater':
      return 'mdi:water-boiler';
    case 'binary_sensor':
      return 'mdi:motion-sensor';
    case 'sensor':
    default:
      return 'mdi:gauge';
  }
}

/**
 * Compute aggregate summary stats for sidebar
 */
export function computeAreaSummary(areas: DiscoveredArea[]): { lightsOn: number; totalActive: number } {
  let lightsOn = 0;
  let totalActive = 0;

  for (const area of areas) {
    for (const ent of area.entities) {
      if (ent.domain === 'light' && ent.state === 'on') {
        lightsOn++;
      }
      if (
        (ent.domain === 'switch' && ent.state === 'on') ||
        (ent.domain === 'fan' && ent.state === 'on') ||
        (ent.domain === 'climate' && ent.state !== 'off') ||
        (ent.domain === 'media_player' && (ent.state === 'playing' || ent.state === 'on'))
      ) {
        totalActive++;
      }
    }
  }

  return { lightsOn, totalActive };
}
