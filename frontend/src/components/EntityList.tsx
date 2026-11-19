import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TranslationKey } from "../i18n";
import { RUNNABLE, SELECTS } from "../devices";
import { useCustomize } from "../personalize";
import type { HomeSmartEntityList } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";
import { LinkedDevice } from "./CardLinks";
import { displayState } from "./EntityCard";
import { EntityModal } from "./EntityModal";
import { EntityPicker } from "./EntityPicker";
import { EntityIcon, HDIcon } from "./HDIcon";
import { HDSelect } from "./HDSelect";

// A list card (Pro): several entities in one card, one per line, each with its value or its control.
// Made in Edit mode, usually from one device (a purifier's temperature, humidity, PM2.5 and filter).

export const MAX_LIST_ENTITIES = 30;
/** Kinds with a control on their line; the others show their value and a tap opens the details. */
const CONTROLLED = new Set(["cover", "light", "switch", "fan", "input_boolean", "lock", "scene", ...RUNNABLE, ...SELECTS]);

const shellOf = (node: Element | null) => node?.closest(".app-shell") ?? null;

/** The card: the title, then a line per entity. In Edit mode a tap opens its editor (the grid handles it). */
export function EntityListCard({ editing, hass, list, t }: { editing: boolean; hass: HomeAssistant; list: HomeSmartEntityList; t: (key: TranslationKey) => string }) {
  const customize = useCustomize();
  const root = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<DiscoveredEntity | null>(null);
  const language = hass.language ?? hass.locale?.language;
  const entities = list.entities.map((id) => customize?.lookup(id)).filter((entity): entity is DiscoveredEntity => Boolean(entity));
  const label = (entity: DiscoveredEntity) => list.names?.[entity.entity_id] || entity.name;
  const shell = shellOf(root.current);
  return <div className={`device-tile hd-elist${editing ? " hd-elist--editing" : ""}`} ref={root}>
    <span className="hd-elist__title">{list.title}</span>
    {entities.length === 0
      ? <p className="hd-elist__empty">{t("listEmpty")}</p>
      : <div className="hd-elist__rows">
        {entities.map((entity) => CONTROLLED.has(entity.domain)
          ? <div className="hd-elist__row" key={entity.entity_id}>
              <button aria-label={`${t("noticeTapDetails")}: ${label(entity)}`} className="hd-elist__icon" onClick={() => setOpened(entity)} type="button"><EntityIcon entity={entity} size={18} /></button>
              <LinkedDevice entity={entity} hass={hass} label={label(entity)} language={language} t={t} />
            </div>
          : <button className="hd-elist__row hd-elist__row--value" key={entity.entity_id} onClick={() => setOpened(entity)} type="button">
              <span className="hd-elist__icon"><EntityIcon entity={entity} size={18} /></span>
              <span className="hd-link__name">{label(entity)}</span>
              <b className="hd-link__value">{displayState(hass.states[entity.entity_id], entity, t, language)}</b>
            </button>)}
      </div>}
    {opened && shell && createPortal(<EntityModal entity={opened} hass={hass} language={language} onClose={() => setOpened(null)} t={t} />, shell)}
  </div>;
}

/** A text field saved when it is left (or on Enter). */
function Field({ label, maxLength, onSave, placeholder, value }: { label: string; maxLength: number; onSave: (value: string) => void; placeholder?: string; value: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input aria-label={label} maxLength={maxLength} onBlur={() => { if (draft.trim() !== value) onSave(draft.trim()); }} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder={placeholder} type="text" value={draft} />;
}

/** Edit mode, a tap on a list card: its title, a device's entities at once or one by one, their names and order. */
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
  // Devices of Home Assistant with more than one entity here, by name (with the room to tell twins apart).
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
    // A list still called by its first name takes the device's.
    set({ entities, ...(!list.title || list.title === t("newList") ? { title: device.name.slice(0, 60) } : {}) });
  };
  const toggle = (id: string) => {
    if (ids.includes(id)) { const { [id]: _gone, ...names } = list.names ?? {}; set({ entities: ids.filter((item) => item !== id), names }); }
    else if (ids.length < MAX_LIST_ENTITIES) set({ entities: [...ids, id] });
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
  const shell = shellOf(sheet.current);
  return <div aria-label={t("listCard")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
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
          <span className="eyebrow">{t("listFromDevice")}</span>
          <HDSelect ariaLabel={t("listFromDevice")} onChange={fromDevice} options={[{ label: t("listChooseDevice"), value: "" }, ...devices.map(([id, device]) => ({ label: device.room ? `${device.name} · ${device.room}` : device.name, value: id }))]} value="" />
        </div>
        <div className="room-options__row hd-links-editor">
          <span className="eyebrow">{t("listEntities")}</span>
          {ids.map((id, index) => <div className="hd-links-editor__item hd-elist-editor__item" key={id}>
            <Field label={`${t("cardLinkName")}: ${customize.lookup(id)?.name ?? id}`} maxLength={40} onSave={(name) => rename(id, name)} placeholder={customize.lookup(id)?.name ?? id} value={list.names?.[id] ?? ""} />
            <button aria-label={`${t("moveUp")}: ${customize.lookup(id)?.name ?? id}`} disabled={index === 0} onClick={() => move(index, -1)} type="button"><span className="rotate-up"><HDIcon name="chevron" size={14} /></span></button>
            <button aria-label={`${t("moveDown")}: ${customize.lookup(id)?.name ?? id}`} disabled={index === ids.length - 1} onClick={() => move(index, 1)} type="button"><span className="rotate-down"><HDIcon name="chevron" size={14} /></span></button>
            <button aria-label={`${t("removeItem")}: ${customize.lookup(id)?.name ?? id}`} onClick={() => toggle(id)} type="button"><HDIcon name="minus" size={14} /></button>
          </div>)}
          {ids.length < MAX_LIST_ENTITIES && <button className="hd-pill" onClick={() => setPicking(true)} type="button"><HDIcon name="plus" size={16} />{t("listAddEntities")}</button>}
        </div>
        <label className="hd-detail__confirm"><span><b>{t("listHideCards")}</b><small>{t("listHideCardsDescription")}</small></span><input checked={Boolean(list.hide_cards)} className="st-switch" onChange={(event) => set({ hide_cards: event.target.checked })} type="checkbox" /></label>
      </section>
    </section>
    {picking && shell && createPortal(<EntityPicker language={undefined} onClose={() => setPicking(false)} onToggle={toggle} rooms={rooms} selected={ids} t={t} title={t("listAddEntities")} />, shell)}
  </div>;
}
