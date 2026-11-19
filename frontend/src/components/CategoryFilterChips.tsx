import type { TranslationKey } from "../i18n";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { HDIcon, type IconName } from "./HDIcon";

export type CategoryType = "all" | "light" | "climate" | "cover" | "security" | "media" | "switch" | "sensor";

interface CategoryDef {
  id: CategoryType;
  icon: IconName;
  labelKey: TranslationKey;
  match: (entity: DiscoveredEntity, state?: HassEntity) => boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "all",
    icon: "grid",
    labelKey: "filterAll",
    match: () => true,
  },
  {
    id: "light",
    icon: "light",
    labelKey: "filterLights",
    match: (e) => e.domain === "light",
  },
  {
    id: "climate",
    icon: "climate",
    labelKey: "filterClimate",
    match: (e) => e.domain === "climate" || e.domain === "fan",
  },
  {
    id: "cover",
    icon: "cover",
    labelKey: "filterCovers",
    match: (e) => e.domain === "cover",
  },
  {
    id: "security",
    icon: "lock",
    labelKey: "filterSecurity",
    match: (e, state) =>
      ["lock", "alarm_control_panel", "camera"].includes(e.domain) ||
      (e.domain === "binary_sensor" && ["door", "window", "garage_door", "motion", "safety", "smoke", "lock"].includes(String(state?.attributes.device_class ?? e.device_class ?? ""))),
  },
  {
    id: "media",
    icon: "media",
    labelKey: "filterMedia",
    match: (e) => e.domain === "media_player",
  },
  {
    id: "switch",
    icon: "switch",
    labelKey: "filterSwitches",
    match: (e) => e.domain === "switch" || e.domain === "input_boolean",
  },
  {
    id: "sensor",
    icon: "sensor",
    labelKey: "filterSensors",
    match: (e) => e.domain === "sensor" || e.domain === "binary_sensor",
  },
];

export function entityMatchesCategory(entity: DiscoveredEntity, category: CategoryType, state?: HassEntity): boolean {
  if (category === "all") return true;
  const def = CATEGORIES.find((c) => c.id === category);
  return def ? def.match(entity, state) : true;
}

interface Props {
  activeCategory: CategoryType;
  entities: DiscoveredEntity[];
  hass: HomeAssistant;
  onSelect: (category: CategoryType) => void;
  t: (key: TranslationKey) => string;
}

export function CategoryFilterChips({ activeCategory, entities, hass, onSelect, t }: Props) {
  // Count how many entities belong to each category
  const counts = new Map<CategoryType, number>();
  const activeCounts = new Map<CategoryType, number>();

  for (const cat of CATEGORIES) {
    if (cat.id === "all") {
      counts.set("all", entities.length);
      continue;
    }
    const matching = entities.filter((e) => cat.match(e, hass.states[e.entity_id]));
    counts.set(cat.id, matching.length);

    const on = matching.filter((e) => {
      const s = hass.states[e.entity_id]?.state;
      return s === "on" || s === "open" || s === "playing" || s === "heat" || s === "cool";
    }).length;
    activeCounts.set(cat.id, on);
  }

  // Only show categories that have at least 1 entity
  const availableCategories = CATEGORIES.filter((cat) => {
    if (cat.id === "all") return true;
    return (counts.get(cat.id) ?? 0) > 0;
  });

  // If there's only 1 real category (e.g. only lights), don't clutter the UI
  if (availableCategories.length <= 2) {
    return null;
  }

  return (
    <div className="category-filter-bar" role="tablist" aria-label="Category filter">
      {availableCategories.map((cat) => {
        const isSelected = activeCategory === cat.id;
        const total = counts.get(cat.id) ?? 0;
        const active = activeCounts.get(cat.id) ?? 0;
        return (
          <button
            key={cat.id}
            aria-selected={isSelected}
            className={`category-chip ${isSelected ? "category-chip--active" : ""}`}
            onClick={() => onSelect(cat.id)}
            role="tab"
            type="button"
          >
            <span className="category-chip__icon">
              <HDIcon name={cat.icon} size={16} />
            </span>
            <span className="category-chip__label">{t(cat.labelKey)}</span>
            {cat.id !== "all" && (
              <span className={`category-chip__count ${active > 0 ? "category-chip__count--active" : ""}`}>
                {active > 0 ? active : total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
