import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { hourOptions } from "../../clock";
import { ContextHeader } from "../../components/ContextHeader";
import { EntityCard } from "../../components/EntityCard";
import { EntityModal } from "../../components/EntityModal";
import { shrinkImage } from "../../components/FloorPlan";
import { HDIcon, RoomIcon, type IconName } from "../../components/HDIcon";
import { SceneStrip } from "../../components/SceneStrip";
import { useEscape } from "../../useEscape";
import { homeStatusText } from "../../homeStatus";
import { isRoomLight, roomTemperature } from "../../personalize";
import { usePlan } from "../../plan";
import type { HOMESMARTRoomPhoto } from "../../types/config";
import type { DiscoveredEntity, Room } from "../../types/discovery";
import { HomeGrid } from "../HomeScreen";
import { pageId, usePageContent, type PageRef } from "../pages";
import { entityIndex, type ScreenProps } from "../types";
import { detachSidebar, RoomDevices, useSidebarRoomList } from "./RoomDevices";
import { roomLights, setRoomLights } from "./shared";
import type { NavLink } from "./SidebarLayout";

// The Photo layout (Pro): a photo of the room fills the screen behind, and a panel in the theme's
// color covers its right side with the room's cards. The photo darkens while the room's lights are off
// and glows warm where its lamp is while one is on. Home has a photo of its own. On a phone the photo
// is a band at the top and the panel slides up over it.

const HOME = "__home__";

interface PhotoLayoutProps extends ScreenProps {
  activePage: string;
  roomId: string | null;
  links: NavLink[];
  /** Opens a page (and a room, on "rooms"); "home" goes back to Home. */
  onGo: (page: string, roomId?: string | null) => void;
  page: PageRef | null;
  plan?: ReactNode;
}

function useNow(every: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), every);
    return () => window.clearInterval(timer);
  }, [every]);
  return now;
}

/** The photo (or, without one, the theme's color with the room's icon), lit or dark like the room. */
function Backdrop({ photo, lit, room }: { photo?: HOMESMARTRoomPhoto; lit: boolean; room?: Room }) {
  const dark = Boolean(photo) && photo?.dim !== false && !lit;
  const style = photo ? ({ backgroundImage: `url("${photo.src}")`, backgroundPosition: `${photo.x ?? 50}% 50%`, "--gx": `${(photo.glow?.x ?? 0.5) * 100}%`, "--gy": `${(photo.glow?.y ?? 0.4) * 100}%` } as CSSProperties) : undefined;
  return <div aria-hidden="true" className={`ph-photo${photo ? "" : " ph-photo--none"}${dark ? " ph-photo--off" : ""}`} style={style}>
    {!photo && room && <span className="ph-photo__icon"><RoomIcon room={room} size={180} /></span>}
    {!photo && !room && <span className="ph-photo__icon"><HDIcon name="home" size={180} /></span>}
    {photo?.glow && lit && <i className="ph-photo__glow" />}
    <i className="ph-photo__shade" />
  </div>;
}

export function PhotoLayout(props: PhotoLayoutProps) {
  const { activePage, allRooms, config, data, editing, hass, language, links, onGo, page, plan, roomId, t } = props;
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const pro = usePlan().pro;
  const roomList = useSidebarRoomList(props);
  const { roomName } = useMemo(() => entityIndex(allRooms), [allRooms]);
  const room = activePage === "rooms" && roomId ? roomList.rooms.find((item) => item.id === roomId) ?? data.rooms.find((item) => item.id === roomId) : undefined;
  const current = plan ? "plan" : room ? "rooms" : page ? pageId(page) : "home";
  const name = (item: Room) => (item.id === "__unassigned__" ? t("unassigned") : item.name);
  const key = room ? room.id : HOME;
  const photo = config.room_photos?.[key];
  const now = useNow(15_000);
  const screen = useRef<HTMLElement>(null);
  // The preview in the photo window has the shape of the photo on screen, so the lamp lands where marked.
  const photoAspect = () => {
    const box = screen.current?.querySelector(".ph-photo")?.getBoundingClientRect();
    return box && box.height > 0 ? box.width / box.height : 0.7;
  };

  // Lit: a light of the room on (on Home or a page, any light of the house).
  const houseLights = data.rooms.flatMap((item) => item.entities.filter(isRoomLight));
  const houseOn = houseLights.filter((entity) => hass.states[entity.entity_id]?.state === "on").length;
  const { lights, on } = room ? roomLights(hass, room) : { lights: houseLights, on: houseLights.filter((entity) => hass.states[entity.entity_id]?.state === "on") };
  const lit = room ? on.length > 0 : houseOn > 0;

  const time = new Intl.DateTimeFormat(language, { hour: "2-digit", minute: "2-digit", ...hourOptions() }).format(now);
  const date = new Intl.DateTimeFormat(language, { weekday: "long", day: "numeric", month: "long" }).format(now);
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const litText = (count: number, total: number) => (total === 0 ? "" : count === 0 ? t("allOff") : t("roomLitOf").replace("{on}", String(count)).replace("{total}", String(total)));

  const tabs: Array<{ id: string; label: string; icon: IconName; go: () => void }> = [
    { id: "home", label: t("home"), icon: "home", go: () => onGo("home") },
    ...links.map((link) => ({ id: link.id, label: link.label, icon: link.icon, go: () => onGo(link.id) })),
  ];
  const active = current === "rooms" ? "home" : current;

  const card = (entity: DiscoveredEntity) => <EntityCard entity={entity} hass={hass} language={language} onLongPress={setModalEntity} t={t} />;
  const allLights = (turnOn: boolean) => {
    const ids = [...new Set(lights.map((entity) => entity.entity_id))];
    if (ids.length > 0) void hass.callService("light", turnOn ? "turn_on" : "turn_off", { entity_id: ids });
  };
  const lightButtons = lights.length > 0 && !editing && <div className="ph-actions">
    <button className="ph-btn" onClick={() => (room ? setRoomLights(hass, room, true) : allLights(true))} type="button"><HDIcon name="light" size={17} />{t("turnOn")}</button>
    <button className="ph-btn ph-btn--main" onClick={() => (room ? setRoomLights(hass, room, false) : allLights(false))} type="button"><HDIcon name="power" size={17} />{t("turnOff")}</button>
  </div>;

  let title: string;
  let sub: string;
  let body: ReactNode;
  if (plan) {
    // The tab already names the page: the plan gets the whole panel.
    title = ""; sub = "";
    body = <div className="ph-plan">{plan}</div>;
  } else if (room) {
    title = name(room);
    sub = [litText(on.length, lights.length), roomTemperature(hass, room)].filter(Boolean).join(" · ") || capital(date);
    body = <RoomDevices className="sb-grid ph-grid" key={room.id} props={props} render={card} room={room} sizable />;
  } else if (page) {
    body = <PhotoPage onOpen={setModalEntity} page={page} props={props} />;
    title = ""; sub = "";
  } else {
    title = t("overview"); sub = `${capital(date)} · ${time}`;
    body = <>
      {config?.visibility?.home_cards?.scenes && <SceneStrip props={props} />}
      <HomeGrid {...props} className="sb-grid ph-grid" onLayout={detachSidebar(props)} onOpenRoom={(id) => onGo("rooms", id)} />
    </>;
  }

  const sideTitle = room ? name(room) : time;
  const sideSub = room ? [litText(on.length, lights.length), roomTemperature(hass, room)].filter(Boolean).join(" · ") : `${capital(date)} · ${homeStatusText(config, hass, houseOn, t)}`;

  return <main className={`screen ph ${editing ? "screen--editing" : ""}`} ref={screen}>
    <Backdrop lit={lit} photo={photo} room={room} />
    <aside className="ph-side">
      <div className="ph-side__top">
        {editing && pro && <button aria-label={room ? t("phPhoto") : t("phHomePhoto")} className="ph-round" onClick={() => setEditingPhoto(true)} type="button"><HDIcon name="camera" size={20} /></button>}
      </div>
      <div className="ph-side__title">
        <h1 className={room ? undefined : "ph-side__time"}>{sideTitle}</h1>
        {sideSub && <p>{room && lights.length > 0 && <HDIcon name="light" size={16} />}{sideSub}</p>}
      </div>
      <nav aria-label={t("roomsPage")} className="ph-rooms">
        {roomList.rooms.map((item) => {
          const itemOn = roomLights(hass, item).on.length > 0;
          return <button aria-current={room?.id === item.id ? "page" : undefined} key={item.id} onClick={() => onGo(room?.id === item.id ? "home" : "rooms", room?.id === item.id ? null : item.id)} type="button">{itemOn && <i />}{name(item)}</button>;
        })}
      </nav>
    </aside>
    <section className="ph-panel">
      <div className="ph-bar">
        <nav aria-label={t("navigation")} className="ph-tabs">
          {tabs.map((tab) => <button aria-current={active === tab.id ? "page" : undefined} key={tab.id} onClick={tab.go} type="button"><HDIcon name={tab.icon} size={16} /><span>{tab.label}</span></button>)}
        </nav>
        <ContextHeader config={config} hass={hass} language={language} onSettings={props.onSettings} part="status" t={t} />
      </div>
      <div className={`ph-scroll${plan ? " ph-scroll--plan" : ""}${editing ? " ph-scroll--editing" : ""}`} key={current + (room?.id ?? "")}>
        {(title || sub) && <header className="ph-head">
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          {!plan && lightButtons}
        </header>}
        {editing && <p className="edit-hint">{t("editHint")}</p>}
        {body}
      </div>
    </section>
    {editingPhoto && <PhotoSheet aspect={photoAspect()} onClose={() => setEditingPhoto(false)} photoKey={key} props={props} title={room ? `${t("phPhoto")} · ${name(room)}` : t("phHomePhoto")} />}
    {modalEntity && <EntityModal entity={modalEntity} hass={hass} language={language} onClose={() => setModalEntity(null)} roomName={roomName(modalEntity)} t={t} />}
  </main>;
}

/** A dock page on the panel: its title, how many devices, and its cards. */
function PhotoPage({ onOpen, page, props }: { onOpen: (entity: DiscoveredEntity) => void; page: PageRef; props: ScreenProps }) {
  const { editing, hass, language, t } = props;
  const content = usePageContent(props, page);
  return <>
    <header className="ph-head"><div><h2>{content.title}</h2><p>{content.count} {t("entities")}</p></div></header>
    {editing && <p className="edit-hint">{t("editHint")}</p>}
    {content.body({ className: "sb-grid ph-grid", open: onOpen, render: (entity) => <EntityCard entity={entity} hass={hass} language={language} onLongPress={onOpen} t={t} />, sizable: true })}
  </>;
}

/** Edit mode: send a photo for the room (or Home), frame it, and set how it reacts to the lights. */
function PhotoSheet({ aspect, onClose, photoKey, props, title }: { aspect: number; onClose: () => void; photoKey: string; props: ScreenProps; title: string }) {
  const { config, hass, onConfig, t } = props;
  const photo = config.room_photos?.[photoKey];
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEscape(onClose);
  const save = (next: HOMESMARTRoomPhoto | null) => onConfig((current) => {
    const photos = { ...(current.room_photos ?? {}) };
    if (next) photos[photoKey] = next; else delete photos[photoKey];
    return { ...current, room_photos: photos };
  });
  const change = (part: Partial<HOMESMARTRoomPhoto>) => { if (photo) save({ ...photo, ...part }); };
  const send = async (file: File) => {
    setSending(true);
    setError("");
    try {
      const data = await shrinkImage(file, { photo: true, max: 2000 });
      const result = await hass.connection.sendMessagePromise<{ url: string }>({ type: "homesmart/floorplan/upload", floor: `room-${photoKey}`, data });
      save({ ...(photo ?? {}), src: result.url });
    } catch (failure) {
      setError(failure instanceof Error && failure.message === "unreadable" ? t("phUnreadable") : t("floorplanImageError"));
    } finally {
      setSending(false);
    }
  };
  const mark = (event: MouseEvent<HTMLDivElement>) => {
    if (!photo || !photo.glow) return;
    const box = event.currentTarget.getBoundingClientRect();
    change({ glow: { x: Math.round(((event.clientX - box.left) / box.width) * 1000) / 1000, y: Math.round(((event.clientY - box.top) / box.height) * 1000) / 1000 } });
  };
  return <div aria-label={title} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
    <section className="hd-sheet ph-sheet">
      <header className="hd-sheet__header"><h2>{title}</h2><button className="hd-sheet__close" onClick={onClose} type="button">{t("close")}</button></header>
      <div className="ph-sheet__body">
        <div className={`ph-sheet__preview${photo?.glow ? " ph-sheet__preview--mark" : ""}`} onClick={mark} role="presentation" style={{ aspectRatio: String(Math.max(0.45, Math.min(2.2, aspect))) }}>
          {photo ? <>
            <span className="ph-sheet__img" style={{ backgroundImage: `url("${photo.src}")`, backgroundPosition: `${photo.x ?? 50}% 50%` }} />
            {photo.glow && <i className="ph-sheet__dot" style={{ left: `${photo.glow.x * 100}%`, top: `${photo.glow.y * 100}%` }} />}
          </> : <span className="ph-sheet__empty"><HDIcon name="camera" size={34} /></span>}
        </div>
        <div className="ph-sheet__side">
          <button className="ph-btn ph-btn--main" disabled={sending} onClick={() => input.current?.click()} type="button"><HDIcon name="camera" size={17} />{sending ? t("phSending") : photo ? t("phChange") : t("phAdd")}</button>
          {photo && <button className="ph-btn" onClick={() => save(null)} type="button"><HDIcon name="trash" size={17} />{t("phRemove")}</button>}
          <input accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void send(file); }} ref={input} type="file" />
          <p className="ph-sheet__hint">{error || t("phHint")}</p>
        </div>
      </div>
      {photo && <div className="ph-sheet__options">
        <label className="ph-sheet__row"><span>{t("phFocus")}</span><input max={100} min={0} onChange={(event) => change({ x: Number(event.target.value) })} type="range" value={photo.x ?? 50} /></label>
        <label className="ph-sheet__row"><span>{t("phDim")}</span><input checked={photo.dim !== false} onChange={(event) => change({ dim: event.target.checked })} type="checkbox" /></label>
        <label className="ph-sheet__row"><span>{t("phGlow")}{photo.glow && <small>{t("phGlowHint")}</small>}</span><input checked={Boolean(photo.glow)} onChange={(event) => change({ glow: event.target.checked ? { x: 0.5, y: 0.4 } : undefined })} type="checkbox" /></label>
      </div>}
    </section>
  </div>;
}
