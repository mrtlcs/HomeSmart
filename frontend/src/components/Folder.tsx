import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeLanguage, type TranslationKey } from "../i18n";
import { keyId } from "../layout";
import { useCustomize } from "../personalize";
import { usePlan } from "../plan";
import { ACTIVE } from "../screens/layouts/shared";
import type { HOMESMARTFolder, ScreenLayout } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";
import { useEscape } from "../useEscape";
import { EditableGrid } from "./EditableGrid";
import { EntityCard } from "./EntityCard";
import { EntityModal } from "./EntityModal";
import { EntityPicker } from "./EntityPicker";
import { HDIcon, isIconName } from "./HDIcon";
import { PageIconButton } from "./RoomOptions";

// A folder card (Pro): a card on any screen that opens a window with its own cards, arranged like a
// room in Edit mode (add devices, sizes, separators, lists). Good for a garden or a garage on Home.

const EMPTY: ScreenLayout = { order: [], hidden: [], wide: [] };
const iconOf = (folder: HOMESMARTFolder) => (folder.icon && isIconName(folder.icon) ? folder.icon : "grid");

/** The card: icon, title and how many of its devices are on; lit while any is. */
export function FolderCard({ folder, hass, onOpen, t }: { folder: HOMESMARTFolder; hass: HomeAssistant; onOpen: () => void; t: (key: TranslationKey) => string }) {
  const on = folder.entities.filter((id) => ACTIVE.has(hass.states[id]?.state ?? "")).length;
  return <button aria-label={`${t("folderOpen")}: ${folder.title}`} className={`device-tile hd-folder${on > 0 ? " device-tile--active" : ""}`} onClick={onOpen} type="button">
    <div className="device-tile__top"><span className="device-tile__icon"><HDIcon name={iconOf(folder)} size={22} /></span><span className="hd-folder__arrow"><HDIcon name="chevron" size={17} /></span></div>
    <div className="device-tile__copy"><strong>{folder.title}</strong><span>{on > 0 ? t("folderOn").replace("{count}", String(on)) : t("folderCount").replace("{count}", String(folder.entities.length))}</span></div>
  </button>;
}

/** The window: the folder's own grid. In Edit mode its title and icon change here, and its cards are
 * arranged like a room's. Saved inside the folder, on the screen that holds it. */
export function FolderSheet({ editing, folder, hass, onChange, onClose, t }: { editing: boolean; folder: HOMESMARTFolder; hass: HomeAssistant; onChange: (folder: HOMESMARTFolder) => void; onClose: () => void; t: (key: TranslationKey) => string }) {
  const customize = useCustomize();
  const plan = usePlan();
  const sheet = useRef<HTMLElement>(null);
  const [picking, setPicking] = useState(false);
  const [opened, setOpened] = useState<DiscoveredEntity | null>(null);
  const [title, setTitle] = useState(folder.title);
  useEffect(() => setTitle(folder.title), [folder.title]);
  useEscape(onClose, !picking && !opened);
  const language = normalizeLanguage(hass.locale?.language ?? hass.language);
  const layout = folder.layout ?? EMPTY;
  const entities = folder.entities.map((id) => customize?.lookup(id)).filter((entity): entity is DiscoveredEntity => Boolean(entity));
  const hidden = new Set(layout.hidden);
  const shown = entities.filter((entity) => !hidden.has(`entity:${entity.entity_id}`));
  const ordered = [...shown].sort((a, b) => {
    const at = (entity: DiscoveredEntity) => { const index = layout.order.indexOf(`entity:${entity.entity_id}`); return index < 0 ? 9999 : index; };
    return at(a) - at(b);
  });
  const toggle = (id: string) => {
    if (folder.entities.includes(id)) onChange({ ...folder, entities: folder.entities.filter((item) => item !== id) });
    else if (plan.allow(id)) onChange({ ...folder, entities: [...folder.entities, id] });
  };
  const shell = sheet.current?.closest(".app-shell") ?? null;
  return <div aria-label={folder.title} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
    <section className="hd-sheet hd-folder-sheet" ref={sheet}>
      <header className="hd-sheet__header">
        {editing
          ? <div className="hd-folder-sheet__naming">
              <PageIconButton fallback="grid" onPick={(icon) => onChange({ ...folder, icon })} t={t} value={folder.icon} />
              <input aria-label={t("listTitle")} maxLength={60} onBlur={() => { if (title.trim() !== folder.title) onChange({ ...folder, title: title.trim() || t("newFolder") }); }} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder={t("newFolder")} value={title} />
            </div>
          : <div className="hd-folder-sheet__title"><span className="hd-folder-sheet__icon"><HDIcon name={iconOf(folder)} size={20} /></span><h2>{folder.title}</h2></div>}
        <button className="hd-sheet__close" onClick={onClose} type="button">{t("close")}</button>
      </header>
      <div className="hd-folder-sheet__body">
        {ordered.length === 0 && !editing
          ? <p className="hd-folder-sheet__empty">{t("folderEmpty")}</p>
          : <EditableGrid
              addLabel={t("addDevices")}
              className="device-grid"
              editing={editing}
              folders={false}
              hass={hass}
              hiddenItems={[]}
              items={ordered.map((entity) => ({ key: `entity:${entity.entity_id}`, label: entity.name, removal: "remove", node: <EntityCard entity={entity} hass={hass} language={language} onLongPress={setOpened} t={t} /> }))}
              layout={layout}
              onAdd={() => setPicking(true)}
              onLayout={(next) => onChange({ ...folder, layout: next })}
              onRemove={(key) => onChange({ ...folder, entities: folder.entities.filter((id) => id !== keyId(key)) })}
              sections
              sizable
              t={t}
            />}
      </div>
    </section>
    {picking && customize && <EntityPicker language={language} onClose={() => setPicking(false)} onToggle={toggle} rooms={customize.rooms()} selected={folder.entities} t={t} title={t("addDevices")} />}
    {opened && shell && createPortal(<EntityModal entity={opened} hass={hass} language={language} onClose={() => setOpened(null)} t={t} />, shell)}
  </div>;
}
