import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { normalizeLanguage, type TranslationKey } from "../i18n";
import { RUNNABLE, SELECTS } from "../devices";
import { useCustomize } from "../personalize";
import type { EntityListStyle, HomeSmartEntityList } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { LinkedDevice } from "./CardLinks";
import { displayState } from "./EntityCard";
import { EntityModal } from "./EntityModal";
import { EntityPicker } from "./EntityPicker";
import { EntityIcon, HDIcon } from "./HDIcon";
import { HDSegmented, HDSelect } from "./HDSelect";

// Grouped Multi-Sensor Bento Container (upgraded EntityListCard):
// Combines multiple sensors/devices into one unified frame with 5 visual styles:
// - "rows"       : Classic scrollable key-value / switch list
// - "grid_2col"  : Compact 2-column split rows
// - "tiles"      : Color-tinted stat tiles (like Network Download / Upload boxes)
// - "rings"      : Circular SVG progress rings (like Care / Battery / Resource meters)
// - "hero_chips" : Primary large sensor header + secondary clickable stat chips

export const MAX_LIST_ENTITIES = 30;
const CONTROLLED = new Set(["cover", "light", "switch", "fan", "input_boolean", "lock", "scene", ...RUNNABLE, ...SELECTS]);
const TILE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];

const shellOf = (node: Element | null) => node?.closest(".app-shell") ?? null;

function parsePercent(state?: HassEntity): number | null {
  if (!state) return null;
  const val = Number.parseFloat(state.state);
  if (!Number.isFinite(val)) return null;
  const unit = String(state.attributes.unit_of_measurement ?? "");
  if (unit === "%" || (val >= 0 && val <= 100 && !unit)) return Math.max(0, Math.min(100, val));
  return null;
}

function autoColorFor(index: number, pct?: number | null): string {
  if (typeof pct === "number") {
    if (pct <= 15) return "#ef4444";
    if (pct <= 35) return "#f59e0b";
    return "#10b981";
  }
  return TILE_COLORS[index % TILE_COLORS.length];
}

/** The card: the title, then grouped entities rendered in the chosen style. */
export function EntityListCard({ editing, hass, list, t }: { editing: boolean; hass: HomeAssistant; list: HomeSmartEntityList; t: (key: TranslationKey) => string }) {
  const customize = useCustomize();
  const root = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<DiscoveredEntity | null>(null);
  const language = normalizeLanguage(hass.language ?? hass.locale?.language);
  const entities = list.entities.map((id) => customize?.lookup(id)).filter((entity): entity is DiscoveredEntity => Boolean(entity));
  const label = (entity: DiscoveredEntity) => list.names?.[entity.entity_id] || entity.name;
  const shell = shellOf(root.current);
  const styleMode: EntityListStyle = list.style ?? "rows";

  const renderTileOrRing = (entity: DiscoveredEntity, idx: number, ring = false) => {
    const state = hass.states[entity.entity_id];
    const pct = parsePercent(state);
    const color = list.colors?.[entity.entity_id] ?? autoColorFor(idx, ring ? pct : null);
    const valueText = displayState(state, entity, t, language);
    const tileStyle = {
      "--tile-accent": color,
      background: `color-mix(in srgb, ${color} 16%, rgba(255, 255, 255, 0.04))`,
      borderColor: `color-mix(in srgb, ${color} 42%, rgba(255, 255, 255, 0.14))`,
    } as CSSProperties;

    if (ring) {
      const ratio = pct != null ? pct / 100 : 0.72;
      const r = 21;
      const c = 2 * Math.PI * r;
      const dash = `${(c * ratio).toFixed(2)} ${c.toFixed(2)}`;
      return (
        <button className="hd-elist-ring" key={entity.entity_id} onClick={() => setOpened(entity)} type="button">
          <div className="hd-elist-ring__svg-wrap">
            <svg viewBox="0 0 54 54">
              <circle className="hd-elist-ring__track" cx="27" cy="27" r={r} />
              <circle
                className="hd-elist-ring__arc"
                cx="27"
                cy="27"
                r={r}
                stroke={color}
                strokeDasharray={dash}
                transform="rotate(-90 27 27)"
              />
            </svg>
            <span className="hd-elist-ring__val">{valueText}</span>
          </div>
          <span className="hd-elist-ring__name">{label(entity)}</span>
        </button>
      );
    }

    return (
      <button className="hd-elist-tile" key={entity.entity_id} onClick={() => setOpened(entity)} style={tileStyle} type="button">
        <span className="hd-elist-tile__head" style={{ color }}>
          <EntityIcon entity={entity} size={15} />
          <span>{label(entity)}</span>
        </span>
        <strong className="hd-elist-tile__value">{valueText}</strong>
      </button>
    );
  };

  return (
    <div className={`device-tile hd-elist hd-elist--${styleMode}${editing ? " hd-elist--editing" : ""}`} ref={root}>
      <div className="hd-elist__header">
        <span className="hd-elist__title">{list.title}</span>
        {(styleMode === "tiles" || styleMode === "rings") && (
          <span className="hd-elist__badge">{t("sysRealtime")}</span>
        )}
      </div>

      {entities.length === 0 ? (
        <p className="hd-elist__empty">{t("listEmpty")}</p>
      ) : styleMode === "tiles" ? (
        <div className={`hd-elist__tiles${entities.length === 3 ? " hd-elist__tiles--3" : ""}`}>
          {entities.map((entity, idx) => renderTileOrRing(entity, idx, false))}
        </div>
      ) : styleMode === "rings" ? (
        <div className="hd-elist__rings">
          {entities.map((entity, idx) => renderTileOrRing(entity, idx, true))}
        </div>
      ) : styleMode === "hero_chips" ? (
        <div className="hd-elist__hero-wrap">
          {(() => {
            const first = entities[0];
            const rest = entities.slice(1);
            const firstColor = list.colors?.[first.entity_id] ?? TILE_COLORS[0];
            return (
              <>
                <button className="hd-elist-hero" onClick={() => setOpened(first)} style={{ borderColor: `color-mix(in srgb, ${firstColor} 45%, transparent)` }} type="button">
                  <span className="hd-elist-hero__icon" style={{ background: `color-mix(in srgb, ${firstColor} 22%, transparent)`, color: firstColor }}>
                    <EntityIcon entity={first} size={22} />
                  </span>
                  <div className="hd-elist-hero__copy">
                    <small>{label(first)}</small>
                    <strong>{displayState(hass.states[first.entity_id], first, t, language)}</strong>
                  </div>
                </button>
                {rest.length > 0 && (
                  <div className="hd-elist-chips">
                    {rest.map((entity) => (
                      <button className="hd-elist-chip" key={entity.entity_id} onClick={() => setOpened(entity)} type="button">
                        <EntityIcon entity={entity} size={14} />
                        <span>{label(entity)}:</span>
                        <b>{displayState(hass.states[entity.entity_id], entity, t, language)}</b>
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className={`hd-elist__rows${styleMode === "grid_2col" ? " hd-elist__rows--2col" : ""}`}>
          {entities.map((entity) =>
            CONTROLLED.has(entity.domain) ? (
              <div className="hd-elist__row" key={entity.entity_id}>
                <button aria-label={`${t("noticeTapDetails")}: ${label(entity)}`} className="hd-elist__icon" onClick={() => setOpened(entity)} type="button">
                  <EntityIcon entity={entity} size={18} />
                </button>
                <LinkedDevice entity={entity} hass={hass} label={label(entity)} language={language} t={t} />
              </div>
            ) : (
              <button className="hd-elist__row hd-elist__row--value" key={entity.entity_id} onClick={() => setOpened(entity)} type="button">
                <span className="hd-elist__icon"><EntityIcon entity={entity} size={18} /></span>
                <span className="hd-link__name">{label(entity)}</span>
                <b className="hd-link__value">{displayState(hass.states[entity.entity_id], entity, t, language)}</b>
              </button>
            ),
          )}
        </div>
      )}

      {opened && shell && createPortal(<EntityModal entity={opened} hass={hass} language={language} onClose={() => setOpened(null)} t={t} />, shell)}
    </div>
  );
}

/** A text field saved when it is left (or on Enter). */
function Field({ label, maxLength, onSave, placeholder, value }: { label: string; maxLength: number; onSave: (value: string) => void; placeholder?: string; value: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input aria-label={label} maxLength={maxLength} onBlur={() => { if (draft.trim() !== value) onSave(draft.trim()); }} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder={placeholder} type="text" value={draft} />;
}

/** Edit mode, a tap on a list card: its title, layout mode, per-sensor colors, and order. */
export function EntityListSheet({ list, onChange, onClose, t }: { list: HomeSmartEntityList; onChange: (list: HomeSmartEntityList) => void; onClose: () => void; t: (key: TranslationKey) => string }) {
  const customize = useCustomize();
  const sheet = useRef<HTMLElement>(null);
  const [picking, setPicking] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !picking) onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, picking]);
  const rooms = customize?.rooms() ?? [];
  const devices = useMemo(() => {
    const found = new Map<string, { name: string; room: string; ids: string[] }>();
    for (const room of rooms) for (const entity of room.entities) {
      if (!entity.device_id) continue;
      const device = found.get(entity.device_id) ?? { name: entity.device_name || entity.name, room: room.id === "__unassigned__" ? "" : room.name, ids: [] };
      if (!device.ids.includes(entity.entity_id)) device.ids.push(entity.entity_id);
      found.set(entity.device_id, device);
    }
    return [...found.entries()].filter(([, device]) => device.ids.length > 1).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [rooms]);
  if (!customize) return null;
  const ids = list.entities;
  const set = (change: Partial<HomeSmartEntityList>) => onChange({ ...list, ...change });
  const fromDevice = (deviceId: string) => {
    const device = devices.find(([id]) => id === deviceId)?.[1];
    if (!device) return;
    const entities = [...ids, ...device.ids.filter((id) => !ids.includes(id))].slice(0, MAX_LIST_ENTITIES);
    set({ entities, ...(!list.title || list.title === t("newList") ? { title: device.name.slice(0, 60) } : {}) });
  };
  const toggle = (id: string) => {
    if (ids.includes(id)) {
      const { [id]: _gone, ...names } = list.names ?? {};
      const { [id]: _goneC, ...colors } = list.colors ?? {};
      set({ entities: ids.filter((item) => item !== id), names, colors });
    } else if (ids.length < MAX_LIST_ENTITIES) set({ entities: [...ids, id] });
  };
  const move = (index: number, by: number) => {
    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    set({ entities: next });
  };
  const rename = (id: string, name: string) => {
    const { [id]: _old, ...names } = list.names ?? {};
    set({ names: name ? { ...names, [id]: name.slice(0, 40) } : names });
  };
  const setColor = (id: string, hex: string) => {
    const { [id]: _old, ...rest } = list.colors ?? {};
    set({ colors: hex ? { ...rest, [id]: hex } : rest });
  };
  const shell = shellOf(sheet.current);
  const styleOptions: Array<{ value: EntityListStyle; label: string }> = [
    { value: "rows", label: t("listStyleRows") },
    { value: "grid_2col", label: t("listStyleGrid2") },
    { value: "tiles", label: t("listStyleTiles") },
    { value: "rings", label: t("listStyleRings") },
    { value: "hero_chips", label: t("listStyleHero") },
  ];
  const currentStyle: EntityListStyle = list.style ?? "rows";

  return (
    <div aria-label={t("listCard")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
      <section className="hd-sheet hd-detail hd-elist-editor" ref={sheet}>
        <header className="hd-detail__header">
          <span className="hd-detail__icon"><HDIcon name="list" size={24} /></span>
          <div><span className="eyebrow">{t("listCard")}</span><h2>{list.title || t("newList")}</h2></div>
          <button aria-label={t("close")} className="hd-close" onClick={onClose} type="button"><HDIcon name="close" size={20} /></button>
        </header>
        <section className="room-options hd-detail__options">
          <div className="room-options__row hd-links-editor">
            <span className="eyebrow">{t("listTitle")}</span>
            <div className="hd-links-editor__item"><Field label={t("listTitle")} maxLength={60} onSave={(title) => set({ title: title || t("newList") })} placeholder={t("newList")} value={list.title} /></div>
            <small>{t("listHint")}</small>
          </div>
          <div className="room-options__row hd-links-editor">
            <span className="eyebrow">{t("listStyleLabel")}</span>
            <HDSegmented
              ariaLabel={t("listStyleLabel")}
              onChange={(style) => set({ style: style as EntityListStyle })}
              options={styleOptions}
              value={currentStyle}
            />
          </div>
          <div className="room-options__row hd-links-editor">
            <span className="eyebrow">{t("listFromDevice")}</span>
            <HDSelect ariaLabel={t("listFromDevice")} onChange={fromDevice} options={[{ label: t("listChooseDevice"), value: "" }, ...devices.map(([id, device]) => ({ label: device.room ? `${device.name} · ${device.room}` : device.name, value: id }))]} value="" />
          </div>
          <div className="room-options__row hd-links-editor">
            <span className="eyebrow">{t("listEntities")}</span>
            {ids.map((id, index) => (
              <div className="hd-elist-editor__row-wrap" key={id}>
                <div className="hd-links-editor__item hd-elist-editor__item">
                  <Field label={`${t("cardLinkName")}: ${customize.lookup(id)?.name ?? id}`} maxLength={40} onSave={(name) => rename(id, name)} placeholder={customize.lookup(id)?.name ?? id} value={list.names?.[id] ?? ""} />
                  <button aria-label={`${t("moveUp")}: ${customize.lookup(id)?.name ?? id}`} disabled={index === 0} onClick={() => move(index, -1)} type="button"><span className="rotate-up"><HDIcon name="chevron" size={14} /></span></button>
                  <button aria-label={`${t("moveDown")}: ${customize.lookup(id)?.name ?? id}`} disabled={index === ids.length - 1} onClick={() => move(index, 1)} type="button"><span className="rotate-down"><HDIcon name="chevron" size={14} /></span></button>
                  <button aria-label={`${t("removeItem")}: ${customize.lookup(id)?.name ?? id}`} onClick={() => toggle(id)} type="button"><HDIcon name="minus" size={14} /></button>
                </div>
                {(currentStyle === "tiles" || currentStyle === "rings" || currentStyle === "hero_chips") && (
                  <div className="hd-elist-editor__colors">
                    <button
                      aria-label={t("sensorColorAuto")}
                      className={`hs-color-swatch hs-color-swatch--sm${!list.colors?.[id] ? " hs-color-swatch--on" : ""}`}
                      onClick={() => setColor(id, "")}
                      type="button"
                    ><HDIcon name="palette" size={10} /></button>
                    {TILE_COLORS.map((hex) => (
                      <button
                        aria-label={hex}
                        className={`hs-color-swatch hs-color-swatch--sm${list.colors?.[id] === hex ? " hs-color-swatch--on" : ""}`}
                        key={hex}
                        onClick={() => setColor(id, hex)}
                        style={{ background: hex }}
                        type="button"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {ids.length < MAX_LIST_ENTITIES && <button className="hd-pill" onClick={() => setPicking(true)} type="button"><HDIcon name="plus" size={16} />{t("listAddEntities")}</button>}
          </div>
          <label className="hd-detail__confirm"><span><b>{t("listHideCards")}</b><small>{t("listHideCardsDescription")}</small></span><input checked={Boolean(list.hide_cards)} className="st-switch" onChange={(event) => set({ hide_cards: event.target.checked })} type="checkbox" /></label>
        </section>
      </section>
      {picking && shell && createPortal(<EntityPicker language={undefined} onClose={() => setPicking(false)} onToggle={toggle} rooms={rooms} selected={ids} t={t} title={t("listAddEntities")} />, shell)}
    </div>
  );
}
