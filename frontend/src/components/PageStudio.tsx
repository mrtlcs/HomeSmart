import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { domainLabel, type TranslationKey } from "../i18n";
import { WIDGET_KEYS, type WidgetKey } from "../layout";
import type {
  HomeSmartConfig,
  HomeSmartEntityList,
  HomeSmartPageConfig,
  HomeSmartPageTemplate,
  HomeSmartPageType,
  PageCustomGauge,
  ScreenLayout,
} from "../types/config";
import type { DiscoveredEntity, Room } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";
import { WIDGET_LABELS } from "./HomeWidget";
import { domainIcon, HDIcon, isIconName, type IconName } from "./HDIcon";
import { HDSelect } from "./HDSelect";
import { PageIconButton, PageIconPicker } from "./RoomOptions";
import { SENSOR_PALETTE, SensorStylePicker } from "./SensorVisuals";

export const PAGE_STUDIO_CSS = `
.navigation-dock__add {
  border: 1px dashed rgba(255, 255, 255, 0.34) !important;
  background: rgba(255, 255, 255, 0.06) !important;
  opacity: 0.92;
}
.navigation-dock__add:hover {
  border-color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(255, 255, 255, 0.14) !important;
  opacity: 1;
}
.sb-links__add,
.ph-tabs__add {
  border: 1px dashed rgba(255, 255, 255, 0.32) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}
.hs-studio-sheet {
  width: min(640px, 94vw);
  max-height: min(88vh, 840px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hs-studio-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
}
.hs-tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 10px;
}
.hs-tpl-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}
.hs-tpl-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
}
.hs-tpl-card--on {
  border-color: var(--hd-highlight, #60a5fa);
  background: color-mix(in srgb, var(--hd-highlight, #60a5fa) 18%, rgba(255, 255, 255, 0.06));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--hd-highlight, #60a5fa) 35%, transparent);
}
.hs-tpl-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
}
.hs-tpl-card strong {
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.25;
}
.hs-tpl-card small {
  font-size: 0.76rem;
  opacity: 0.76;
  line-height: 1.35;
}
.hs-studio-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hs-studio-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
}
.hs-studio-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.hs-domain-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hs-domain-chip {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.hs-domain-chip--on {
  border-color: var(--hd-highlight, #60a5fa);
  background: color-mix(in srgb, var(--hd-highlight, #60a5fa) 24%, transparent);
}
.hs-studio-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hs-widget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.hs-widget-row--on {
  border-color: var(--hd-highlight, #60a5fa);
  background: color-mix(in srgb, var(--hd-highlight, #60a5fa) 16%, rgba(255, 255, 255, 0.06));
}
.hs-widget-row__left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.hs-custom-cols {
  grid-template-columns: repeat(var(--tab-cols, 4), minmax(0, 1fr)) !important;
}
@media (max-width: 720px) {
  .hs-custom-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
`;

const PAGE_SWATCHES = ["#60a5fa", "#a78bfa", "#fb923c", "#34d399", "#f472b6", "#2dd4bf", "#fbbf24"];

const AUTO_FILTER_DOMAINS = ["light", "climate", "switch", "sensor", "binary_sensor", "camera", "media_player", "vacuum", "lock"] as const;

const WIDGET_ICONS: Record<WidgetKey, IconName> = {
  "widget:security": "shield",
  "widget:climate": "climate",
  "widget:media": "media",
  "widget:today": "calendar",
  "widget:weather": "cloud",
  "widget:sun": "sun",
  "widget:energy": "bolt",
  "widget:bins": "trash",
  "widget:plan": "plan",
  "widget:recent": "media",
  "widget:insights": "star",
};

interface TemplateDef {
  id: HomeSmartPageTemplate;
  type: HomeSmartPageType;
  icon: IconName;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const TEMPLATES: TemplateDef[] = [
  { id: "blank", type: "custom", icon: "grid", titleKey: "tplBlank", descKey: "tplBlankDesc" },
  { id: "server", type: "custom", icon: "server", titleKey: "tplServer", descKey: "tplServerDesc" },
  { id: "energy", type: "custom", icon: "bolt", titleKey: "tplEnergy", descKey: "tplEnergyDesc" },
  { id: "environment", type: "custom", icon: "climate", titleKey: "tplEnv", descKey: "tplEnvDesc" },
  { id: "cameras", type: "cameras", icon: "camera", titleKey: "camerasTitle", descKey: "tplCamerasDesc" },
  { id: "scenes", type: "scenes", icon: "scene", titleKey: "scenes", descKey: "tplScenesDesc" },
  { id: "favorites", type: "favorites", icon: "star", titleKey: "favorites", descKey: "tplFavoritesDesc" },
];

function usePortalShell() {
  const anchor = useRef<HTMLSpanElement>(null);
  const [shell, setShell] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setShell(anchor.current?.closest(".app-shell") ?? null);
  }, []);
  return { anchor, shell };
}

function numericValue(hass: HomeAssistant, entityId: string): number | null {
  const raw = hass.states[entityId]?.state;
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function isNetworkMetric(entity: DiscoveredEntity, hass: HomeAssistant): boolean {
  const unit = String(hass.states[entity.entity_id]?.attributes?.unit_of_measurement ?? "").toLowerCase();
  const hay = `${entity.entity_id} ${entity.name}`.toLowerCase();
  if (unit.includes("b/s") || unit.includes("bps") || unit.includes("mb/s") || unit.includes("kb/s") || unit.includes("mib/s")) return true;
  return /download|upload|rx|tx|throughput|traffic|bandwidth|latency|ping/.test(hay);
}

function isGaugeCandidate(entity: DiscoveredEntity, hass: HomeAssistant): boolean {
  if (entity.domain !== "sensor") return false;
  if (numericValue(hass, entity.entity_id) == null) return false;
  if (isNetworkMetric(entity, hass)) return false;
  const unit = String(hass.states[entity.entity_id]?.attributes?.unit_of_measurement ?? "").toLowerCase();
  const hay = `${entity.entity_id} ${entity.name} ${entity.device_class ?? ""}`.toLowerCase();
  return unit === "%" || unit.includes("°") || /cpu|mem|ram|disk|storage|temp|load|usage|battery|util/.test(hay);
}

export function PageCreatorModal({
  catalogRooms,
  hass,
  onClose,
  onCreate,
  t,
}: {
  catalogRooms: Room[];
  config: HomeSmartConfig;
  hass: HomeAssistant;
  language?: string;
  onClose: () => void;
  onCreate: (result: { page: HomeSmartPageConfig; layout?: ScreenLayout }) => void;
  t: (key: TranslationKey) => string;
}) {
  const { anchor, shell } = usePortalShell();
  const [template, setTemplate] = useState<HomeSmartPageTemplate>("blank");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<string>("grid");
  const [pickingIcon, setPickingIcon] = useState(false);
  const [accent, setAccent] = useState<string>("");

  const allEntities = useMemo(() => {
    const seen = new Set<string>();
    const list: DiscoveredEntity[] = [];
    for (const room of catalogRooms) {
      for (const e of room.entities) {
        if (!seen.has(e.entity_id)) {
          seen.add(e.entity_id);
          list.push(e);
        }
      }
    }
    return list;
  }, [catalogRooms]);

  const devices = useMemo(() => {
    const map = new Map<string, { id: string; name: string; entities: DiscoveredEntity[]; sensors: number }>();
    for (const entity of allEntities) {
      if (!entity.device_id) continue;
      const entry = map.get(entity.device_id) ?? {
        id: entity.device_id,
        name: entity.device_name || entity.name,
        entities: [],
        sensors: 0,
      };
      entry.entities.push(entity);
      if (entity.domain === "sensor") entry.sensors += 1;
      map.set(entity.device_id, entry);
    }
    return [...map.values()]
      .filter((d) => d.entities.length >= 2)
      .sort((a, b) => b.sensors - a.sensors || b.entities.length - a.entities.length || a.name.localeCompare(b.name));
  }, [allEntities]);

  const [deviceId, setDeviceId] = useState<string>(() => devices[0]?.id ?? "");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selectedTpl = TEMPLATES.find((item) => item.id === template) ?? TEMPLATES[0];

  const selectTemplate = (next: TemplateDef) => {
    setTemplate(next.id);
    setIcon(next.icon);
  };

  const handleCreate = () => {
    const nowId = Date.now().toString(36);
    const id = `page-${selectedTpl.id}-${nowId}`;
    const selectedDevice = devices.find((d) => d.id === deviceId);
    const fallbackTitle = template === "server" && selectedDevice ? selectedDevice.name : t(selectedTpl.titleKey);
    const finalTitle = title.trim() || fallbackTitle;

    const page: HomeSmartPageConfig = {
      id,
      title: finalTitle.slice(0, 80),
      type: selectedTpl.type,
      icon,
      entity_ids: [],
      template,
      ...(accent ? { accent } : {}),
    };
    const layout: ScreenLayout = { order: [], hidden: [], wide: [] };

    if (template === "server" && selectedDevice) {
      const devEntities = selectedDevice.entities;
      const gauges = devEntities.filter((e) => isGaugeCandidate(e, hass)).slice(0, 4);
      const gaugeIds = new Set(gauges.map((g) => g.entity_id));
      const netSensors = devEntities.filter((e) => e.domain === "sensor" && isNetworkMetric(e, hass)).slice(0, 6);
      const netIds = new Set(netSensors.map((n) => n.entity_id));

      page.custom_gauges = gauges.map((g, idx) => {
        const unit = String(hass.states[g.entity_id]?.attributes?.unit_of_measurement ?? "");
        return {
          id: `g-${idx}-${nowId}`,
          entity_id: g.entity_id,
          style: "gauge",
          color: SENSOR_PALETTE[idx % SENSOR_PALETTE.length].color,
          ...(unit === "%" ? { min: 0, max: 100 } : {}),
        };
      });

      const gaugeKeys = page.custom_gauges.map((g) => `gauge:${g.id}`);
      layout.order.push(...gaugeKeys);

      if (netSensors.length >= 2) {
        const listKey = `list:srv-${nowId}`;
        const list: HomeSmartEntityList = {
          title: selectedDevice.name,
          entities: netSensors.map((e) => e.entity_id),
          style: "tiles",
        };
        layout.lists = { [listKey]: list };
        layout.order.push(listKey);
        layout.wide.push(listKey);
      }

      const remaining = devEntities
        .filter((e) => !gaugeIds.has(e.entity_id) && !netIds.has(e.entity_id) && ["sensor", "binary_sensor", "switch", "button", "update", "number"].includes(e.domain))
        .slice(0, 12)
        .map((e) => e.entity_id);
      page.entity_ids = remaining;
      layout.order.push(...remaining.map((eid) => `entity:${eid}`));
    } else if (template === "energy") {
      page.widgets = ["widget:energy"];
      layout.order.push("widget:energy");
      layout.wide.push("widget:energy");
      const powerSensors = allEntities
        .filter((e) => e.domain === "sensor" && (e.device_class === "power" || e.device_class === "energy") && numericValue(hass, e.entity_id) != null)
        .slice(0, 4);
      if (powerSensors.length > 0) {
        page.custom_gauges = powerSensors.map((s, idx) => ({
          id: `e-${idx}-${nowId}`,
          entity_id: s.entity_id,
          style: idx % 2 === 0 ? "line" : "bar",
          color: SENSOR_PALETTE[(idx + 2) % SENSOR_PALETTE.length].color,
        }));
        layout.order.push(...page.custom_gauges.map((g) => `gauge:${g.id}`));
      }
    } else if (template === "environment") {
      page.auto_filter = {
        domains: ["climate", "fan", "humidifier"],
        device_classes: ["temperature", "humidity", "pm25", "aqi", "co2", "carbon_dioxide", "voc"],
      };
      const envSensors = allEntities
        .filter((e) => e.domain === "sensor" && ["temperature", "humidity", "pm25", "aqi", "co2", "carbon_dioxide"].includes(e.device_class ?? ""))
        .slice(0, 6);
      if (envSensors.length >= 2) {
        const listKey = `list:env-${nowId}`;
        layout.lists = {
          [listKey]: {
            title: finalTitle.slice(0, 40),
            entities: envSensors.map((e) => e.entity_id),
            style: "rings",
          },
        };
        layout.order.push(listKey);
        layout.wide.push(listKey);
      }
    }

    const hasCustomLayout = layout.order.length > 0 || layout.wide.length > 0 || Boolean(layout.lists);
    onCreate({ page, ...(hasCustomLayout ? { layout } : {}) });
  };

  const sheet = (
    <div aria-label={t("tabStudioTitle")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog">
      <section className="hd-sheet hs-studio-sheet">
        <header className="hd-sheet__header">
          <div>
            <span className="eyebrow">{t("tabStudioTitle")}</span>
            <h2>{t("createTab")}</h2>
          </div>
          <button aria-label={t("close")} className="hd-close" onClick={onClose} type="button"><HDIcon name="close" size={20} /></button>
        </header>

        <div className="hs-studio-body">
          <p className="edit-hint" style={{ margin: 0 }}>{t("tabTemplateDesc")}</p>
          <div className="hs-tpl-grid" role="radiogroup" aria-label={t("tabStudioTitle")}>
            {TEMPLATES.map((tpl) => (
              <button
                aria-checked={template === tpl.id}
                className={`hs-tpl-card${template === tpl.id ? " hs-tpl-card--on" : ""}`}
                key={tpl.id}
                onClick={() => selectTemplate(tpl)}
                role="radio"
                type="button"
              >
                <span className="hs-tpl-card__icon"><HDIcon name={tpl.icon} size={18} /></span>
                <strong>{t(tpl.titleKey)}</strong>
                <small>{t(tpl.descKey)}</small>
              </button>
            ))}
          </div>

          {template === "server" && devices.length > 0 && (
            <label className="hs-studio-field">
              <span className="eyebrow">{t("tabPickDevice")}</span>
              <HDSelect
                ariaLabel={t("tabPickDevice")}
                onChange={setDeviceId}
                options={devices.map((d) => ({ value: d.id, label: `${d.name} (${d.entities.length})` }))}
                value={deviceId}
              />
            </label>
          )}

          <div className="hs-studio-row">
            <label className="hs-studio-field">
              <span className="eyebrow">{t("pageName")}</span>
              <input
                className="st-input st-input--framed"
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={template === "server" && devices.find((d) => d.id === deviceId)?.name ? devices.find((d) => d.id === deviceId)!.name : t(selectedTpl.titleKey)}
                value={title}
              />
            </label>
            <div className="hs-studio-field">
              <span className="eyebrow">{t("pageIconLabel")}</span>
              <div className="room-options__icons">
                <button aria-expanded={pickingIcon} aria-label={t("pageIconLabel")} onClick={() => setPickingIcon((was) => !was)} type="button">
                  <HDIcon name={isIconName(icon) ? icon : "grid"} size={18} />
                </button>
              </div>
            </div>
          </div>

          {pickingIcon && (
            <PageIconPicker
              onPick={(next) => { setIcon(next); setPickingIcon(false); }}
              t={t}
              value={isIconName(icon) ? icon : "grid"}
            />
          )}

          <div className="hs-studio-field">
            <span className="eyebrow">{t("roomTheme")}</span>
            <div className="hs-room-swatches" role="radiogroup" aria-label={t("roomTheme")}>
              <button
                aria-checked={!accent}
                aria-label={t("roomThemeAuto")}
                className={`hs-color-swatch hs-color-swatch--auto${!accent ? " hs-color-swatch--on" : ""}`}
                onClick={() => setAccent("")}
                role="radio"
                type="button"
              >
                <HDIcon name="palette" size={13} />
              </button>
              {PAGE_SWATCHES.map((hex) => (
                <button
                  aria-checked={accent === hex}
                  aria-label={hex}
                  className={`hs-color-swatch${accent === hex ? " hs-color-swatch--on" : ""}`}
                  key={hex}
                  onClick={() => setAccent(hex)}
                  role="radio"
                  style={{ background: hex }}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="hs-studio-footer">
          <button className="hd-pill" onClick={onClose} type="button">{t("close")}</button>
          <button className="primary-button" onClick={handleCreate} type="button">
            <HDIcon name="plus" size={16} />{t("createTab")}
          </button>
        </footer>
      </section>
    </div>
  );

  return <><span hidden ref={anchor} />{shell ? createPortal(sheet, shell) : sheet}</>;
}

export function PageWidgetPickerModal({
  onClose,
  onToggle,
  selected,
  t,
}: {
  onClose: () => void;
  onToggle: (widgetKey: string) => void;
  selected: string[];
  t: (key: TranslationKey) => string;
}) {
  const { anchor, shell } = usePortalShell();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sheet = (
    <div aria-label={t("tabAddWidget")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog">
      <section className="hd-sheet hs-studio-sheet">
        <header className="hd-sheet__header">
          <div>
            <span className="eyebrow">{t("tabStudioTitle")}</span>
            <h2>{t("tabAddWidget")}</h2>
          </div>
          <button className="hd-sheet__close" onClick={onClose} type="button">{t("doneEditing")}</button>
        </header>
        <p className="edit-hint" style={{ margin: 0 }}>{t("tabPickWidgetsHint")}</p>
        <div className="hs-studio-body">
          {WIDGET_KEYS.map((key) => {
            const on = selected.includes(key);
            return (
              <button
                aria-pressed={on}
                className={`hs-widget-row${on ? " hs-widget-row--on" : ""}`}
                key={key}
                onClick={() => onToggle(key)}
                type="button"
              >
                <span className="hs-widget-row__left">
                  <HDIcon name={WIDGET_ICONS[key] ?? "grid"} size={18} />
                  <span>{t(WIDGET_LABELS[key])}</span>
                </span>
                <span className="hd-picker__check">{on && <HDIcon name="check" size={16} />}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  return <><span hidden ref={anchor} />{shell ? createPortal(sheet, shell) : sheet}</>;
}

export function PageGaugeModal({
  hass,
  initial,
  language,
  onClose,
  onDelete,
  onSave,
  rooms,
  t,
}: {
  hass: HomeAssistant;
  initial?: PageCustomGauge;
  language?: string;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (gauge: PageCustomGauge) => void;
  rooms: Room[];
  t: (key: TranslationKey) => string;
}) {
  const { anchor, shell } = usePortalShell();
  const [query, setQuery] = useState("");
  const [entityId, setEntityId] = useState(initial?.entity_id ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [style, setStyle] = useState<PageCustomGauge["style"]>(initial?.style ?? "gauge");
  const [color, setColor] = useState<string | undefined>(initial?.color);
  const [min, setMin] = useState<number | undefined>(initial?.min);
  const [max, setMax] = useState<number | undefined>(initial?.max);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sensors = useMemo(() => {
    const seen = new Set<string>();
    const out: DiscoveredEntity[] = [];
    for (const room of rooms) {
      for (const entity of room.entities) {
        if (!seen.has(entity.entity_id) && ["sensor", "number", "input_number"].includes(entity.domain)) {
          seen.add(entity.entity_id);
          out.push(entity);
        }
      }
    }
    const q = query.trim().toLowerCase();
    return out
      .filter((e) => !q || `${e.name} ${e.entity_id}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [rooms, query]);

  const activeId = entityId || sensors[0]?.entity_id || "";

  const handleSave = () => {
    if (!activeId) return;
    onSave({
      id: initial?.id ?? `g-${Date.now().toString(36)}`,
      entity_id: activeId,
      ...(label.trim() ? { label: label.trim().slice(0, 60) } : {}),
      style: style ?? "gauge",
      ...(color ? { color } : {}),
      ...(min != null ? { min } : {}),
      ...(max != null ? { max } : {}),
    });
  };

  const sheet = (
    <div aria-label={t("tabAddGauge")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog">
      <section className="hd-sheet hs-studio-sheet">
        <header className="hd-sheet__header">
          <div>
            <span className="eyebrow">{t("tabStudioTitle")}</span>
            <h2>{t("tabAddGauge")}</h2>
          </div>
          <button aria-label={t("close")} className="hd-close" onClick={onClose} type="button"><HDIcon name="close" size={20} /></button>
        </header>

        <div className="hs-studio-body">
          <SensorStylePicker
            onChange={(next) => {
              setStyle(next.style ?? "gauge");
              setColor(next.color);
              setMin(next.min);
              setMax(next.max);
            }}
            showDefault={false}
            t={t}
            value={{ style: style ?? "gauge", color, min, max }}
          />

          <label className="hs-studio-field">
            <span className="eyebrow">{t("tabGaugeLabel")}</span>
            <input
              className="st-input st-input--framed"
              maxLength={60}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={hass.states[activeId]?.attributes?.friendly_name as string ?? activeId}
              value={label}
            />
          </label>

          <div className="hs-studio-field">
            <span className="eyebrow">{t("tabPickSensor")}</span>
            <label className="hd-search"><HDIcon name="search" size={16} /><input onChange={(e) => setQuery(e.target.value)} placeholder={t("searchDevices")} type="search" value={query} /></label>
            <div className="hd-picker__rows" style={{ maxHeight: 220, overflowY: "auto" }}>
              {sensors.map((entity) => {
                const on = activeId === entity.entity_id;
                const state = hass.states[entity.entity_id];
                const unit = state?.attributes?.unit_of_measurement ? ` ${String(state.attributes.unit_of_measurement)}` : "";
                return (
                  <button
                    aria-pressed={on}
                    className={`hd-picker__row${on ? " hd-picker__row--on" : ""}`}
                    key={entity.entity_id}
                    onClick={() => setEntityId(entity.entity_id)}
                    type="button"
                  >
                    <span className="hd-picker__icon"><HDIcon name={domainIcon(entity.domain)} size={16} /></span>
                    <span className="hd-picker__copy">
                      <strong>{entity.name}</strong>
                      <small>{domainLabel(entity.domain, language)}{state ? ` · ${state.state}${unit}` : ""}</small>
                    </span>
                    <span className="hd-picker__check">{on && <HDIcon name="check" size={16} />}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="hs-studio-footer">
          {onDelete && (
            <button className="hd-pill" onClick={onDelete} style={{ marginRight: "auto" }} type="button">
              <HDIcon name="trash" size={16} />{t("removeItem")}
            </button>
          )}
          <button className="hd-pill" onClick={onClose} type="button">{t("close")}</button>
          <button className="primary-button" disabled={!activeId} onClick={handleSave} type="button">
            <HDIcon name="check" size={16} />{t("save")}
          </button>
        </footer>
      </section>
    </div>
  );

  return <><span hidden ref={anchor} />{shell ? createPortal(sheet, shell) : sheet}</>;
}

export function PageStudioControls({
  isCameras,
  language,
  onDuplicate,
  onDelete,
  onUpdatePage,
  page,
  t,
}: {
  isCameras: boolean;
  language?: string;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdatePage: (patch: Partial<HomeSmartPageConfig>) => void;
  page: HomeSmartPageConfig;
  t: (key: TranslationKey) => string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autoDomains = page.auto_filter?.domains ?? [];

  const toggleDomain = (domain: string) => {
    const next = autoDomains.includes(domain)
      ? autoDomains.filter((d) => d !== domain)
      : [...autoDomains, domain];
    onUpdatePage({
      auto_filter: next.length > 0 || (page.auto_filter?.device_classes?.length ?? 0) > 0
        ? { ...page.auto_filter, domains: next }
        : undefined,
    });
  };

  return (
    <section className="room-options" aria-label={t("tabStudioTitle")}>
      <div className="room-options__row">
        <span className="eyebrow">{t("pageIconLabel")}</span>
        <PageIconButton
          fallback={isCameras ? "camera" : page.type === "scenes" ? "scene" : page.type === "favorites" ? "star" : "grid"}
          onPick={(icon) => onUpdatePage({ icon })}
          t={t}
          value={page.icon}
        />
      </div>

      <div className="room-options__row">
        <span className="eyebrow">{isCameras ? t("cameraColumns") : t("tabColumns")}</span>
        <div className="room-options__icons" role="radiogroup" aria-label={t("tabColumns")}>
          {!isCameras && (
            <button aria-checked={!page.columns} onClick={() => onUpdatePage({ columns: undefined })} role="radio" type="button">
              {t("tabColumnsAuto")}
            </button>
          )}
          {(isCameras ? [1, 2, 3, 4] : [2, 3, 4]).map((val) => (
            <button
              aria-checked={(isCameras ? (page.columns ?? 2) : page.columns) === val}
              key={val}
              onClick={() => onUpdatePage({ columns: val })}
              role="radio"
              type="button"
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="room-options__row">
        <span className="eyebrow">{t("roomTheme")}</span>
        <div aria-label={t("roomTheme")} className="hs-room-swatches" role="radiogroup">
          <button
            aria-checked={!page.accent}
            aria-label={t("roomThemeAuto")}
            className={`hs-color-swatch hs-color-swatch--auto${!page.accent ? " hs-color-swatch--on" : ""}`}
            onClick={() => onUpdatePage({ accent: undefined })}
            role="radio"
            type="button"
          >
            <HDIcon name="palette" size={13} />
          </button>
          {PAGE_SWATCHES.map((hex) => (
            <button
              aria-checked={page.accent === hex}
              aria-label={hex}
              className={`hs-color-swatch${page.accent === hex ? " hs-color-swatch--on" : ""}`}
              key={hex}
              onClick={() => onUpdatePage({ accent: hex })}
              role="radio"
              style={{ background: hex }}
              type="button"
            />
          ))}
        </div>
      </div>

      {page.type === "custom" && (
        <div className="room-options__row">
          <span className="eyebrow">{t("tabAutoFilter")}</span>
          <div className="hs-domain-chips">
            {AUTO_FILTER_DOMAINS.map((domain) => {
              const on = autoDomains.includes(domain);
              return (
                <button
                  aria-pressed={on}
                  className={`hs-domain-chip${on ? " hs-domain-chip--on" : ""}`}
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  type="button"
                >
                  {domainLabel(domain, language)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="room-options__row">
        <span className="eyebrow">{t("tabStudioTitle")}</span>
        <div className="hs-studio-actions">
          <button className="hd-pill" onClick={onDuplicate} type="button">
            <HDIcon name="plus" size={15} />{t("tabDuplicate")}
          </button>
          <button
            className={`hd-pill${confirmDelete ? " st-icon-button--danger" : ""}`}
            onBlur={() => setConfirmDelete(false)}
            onClick={() => {
              if (!confirmDelete) { setConfirmDelete(true); return; }
              onDelete();
            }}
            type="button"
          >
            <HDIcon name="trash" size={15} />{confirmDelete ? t("tabDeleteConfirm") : t("deletePage")}
          </button>
        </div>
      </div>
    </section>
  );
}
