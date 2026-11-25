import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { ContextHeader } from "../../components/ContextHeader";
import { EditableGrid } from "../../components/EditableGrid";
import { EntityCard } from "../../components/EntityCard";
import { EntityModal } from "../../components/EntityModal";
import { HDIcon, RoomIcon, type IconName } from "../../components/HDIcon";
import { HomeStatus } from "../../components/HomeStatus";
import { roomKey } from "../../layout";
import type { DiscoveredEntity } from "../../types/discovery";
import { HomeGrid } from "../HomeScreen";
import { SceneStrip } from "../../components/SceneStrip";
import { pageId, usePageContent, type PageRef } from "../pages";
import { entityIndex, type ScreenProps } from "../types";
import { detachSidebar, RoomDevices, useSidebarRoomList } from "./RoomDevices";
import { roomLights, setRoomLights } from "./shared";

export interface NavLink { id: string; label: string; icon: IconName }

interface SidebarLayoutProps extends ScreenProps {
  links: NavLink[];
  onAddPage?: () => void;
  onNavigate: (page: string) => void;
  onSelectRoom: (roomId: string | null) => void;
  /** Media, Security, Scenes or a custom page, shown on the right like a room. */
  page: PageRef | null;
  roomId: string | null;
  /** A screen of its own on the right (the floor plan), with the id of its menu link. */
  custom?: ReactNode;
  customId?: string;
}

/** Control-center layout: a fixed column with context and navigation, content on the right. */
export function SidebarLayout(props: SidebarLayoutProps) {
  const { allRooms, config, custom, customId, data, editing, hass, language, links, onAddPage, onNavigate, onSelectRoom, page, roomId, t } = props;
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const linkNavRef = useRef<HTMLElement>(null);
  const [draggingLink, setDraggingLink] = useState<string | null>(null);
  const [liveLinkOrder, setLiveLinkOrder] = useState<string[] | null>(null);
  const linkOrderRef = useRef<string[] | null>(null);
  const linkStartY = useRef(0);
  const didDragLink = useRef(false);
  const shownLinks = liveLinkOrder
    ? liveLinkOrder.map((id) => links.find((l) => l.id === id)).filter((l): l is NavLink => Boolean(l))
    : links;

  const startLinkDrag = (event: ReactPointerEvent, id: string) => {
    if (!editing) return;
    event.preventDefault();
    linkNavRef.current?.setPointerCapture(event.pointerId);
    linkStartY.current = event.clientY;
    didDragLink.current = false;
    linkOrderRef.current = links.map((l) => l.id);
    setDraggingLink(id);
    setLiveLinkOrder(linkOrderRef.current);
  };
  const moveLinkDrag = (event: ReactPointerEvent) => {
    const cur = linkOrderRef.current;
    if (!draggingLink || !cur || !linkNavRef.current) return;
    if (Math.abs(event.clientY - linkStartY.current) > 5) didDragLink.current = true;
    const over = [...linkNavRef.current.querySelectorAll<HTMLElement>("[data-tab]")].find((btn) => {
      const box = btn.getBoundingClientRect();
      return event.clientY >= box.top && event.clientY <= box.bottom;
    })?.dataset.tab;
    if (!over || over === draggingLink) return;
    const next = cur.filter((id) => id !== draggingLink);
    next.splice(cur.indexOf(over), 0, draggingLink);
    linkOrderRef.current = next;
    setLiveLinkOrder(next);
  };
  const endLinkDrag = () => {
    const next = linkOrderRef.current;
    linkOrderRef.current = null;
    if (next && next.join() !== links.map((l) => l.id).join()) {
      const merged = [
        ...(config.navigation.rooms ? ["rooms"] : []),
        ...next,
      ];
      props.onConfig((current) => ({ ...current, navigation: { ...current.navigation, order: merged } }));
    }
    setDraggingLink(null);
    setLiveLinkOrder(null);
  };
  const roomList = useSidebarRoomList(props);
  const room = roomList.rooms.find((item) => item.id === roomId);
  const { roomName } = entityIndex(allRooms);
  const name = (id: string, fallback: string) => (id === "__unassigned__" ? t("unassigned") : fallback);

  return <main className={`screen sb-layout ${editing ? "screen--editing" : ""}`}>
    <ContextHeader config={config} hass={hass} language={language} onSettings={props.onSettings} part="status" t={t} />
    <aside className="sb-side">
      <ContextHeader config={config} hass={hass} language={language} onSettings={props.onSettings} part="clock" t={t} />
      {config?.visibility?.home_cards?.status && !editing && <HomeStatus config={config} data={data} hass={hass} t={t} />}
      <nav className="sb-nav" aria-label={t("navigation")}>
        <button aria-current={!room && !page && !custom ? "page" : undefined} onClick={() => onSelectRoom(null)} type="button"><span className="sb-nav__icon"><HDIcon name="home" size={18} /></span><span>{t("overview")}</span></button>
        <EditableGrid
          className="sb-nav__rooms"
          editing={editing}
          hiddenItems={roomList.hiddenItems}
          items={roomList.rooms.map((item) => {
            const { on } = roomLights(hass, item);
            return { key: roomKey(item.id), label: name(item.id, item.name), node: <button aria-current={room?.id === item.id ? "page" : undefined} onClick={() => onSelectRoom(item.id)} type="button">
              <span className="sb-nav__icon"><RoomIcon room={item} size={18} /></span><span>{name(item.id, item.name)}</span>{on.length > 0 && <i>{on.length}</i>}
            </button> };
          })}
          layout={roomList.layout}
          onLayout={roomList.onLayout}
          sizable={false}
          t={t}
        />
      </nav>
      {links.length > 0 || (editing && onAddPage) ? (
        <nav
          aria-label={t("pages")}
          className={editing ? "sb-links sb-links--editing" : "sb-links"}
          onLostPointerCapture={endLinkDrag}
          onPointerMove={moveLinkDrag}
          onPointerUp={endLinkDrag}
          ref={linkNavRef}
        >
          {shownLinks.map((link) => (
            <button
              aria-current={(page && pageId(page) === link.id) || customId === link.id ? "page" : undefined}
              aria-label={editing ? `${link.label}: ${t("dragToReorder")}` : link.label}
              className={draggingLink === link.id ? "sb-links__dragging" : undefined}
              data-tab={link.id}
              key={link.id}
              onClick={() => {
                if (didDragLink.current) { didDragLink.current = false; return; }
                onNavigate(link.id);
              }}
              onPointerDown={editing ? (event) => startLinkDrag(event, link.id) : undefined}
              type="button"
            >
              <HDIcon name={editing ? "grip" : link.icon} size={16} />
              <span>{link.label}</span>
            </button>
          ))}
          {editing && onAddPage && <button className="sb-links__add" onClick={onAddPage} type="button"><HDIcon name="plus" size={16} /><span>{t("createTab")}</span></button>}
        </nav>
      ) : null}
    </aside>

    <section className="sb-main" key={customId ?? (page ? pageId(page) : room?.id ?? "home")}>
      {custom ? custom : page ? <SidebarPage key={pageId(page)} onLongPress={setModalEntity} page={page} props={props} /> : room ? <>
        <header className="sb-main__header">
          <div><span className="eyebrow">{(() => { const { lights, on } = roomLights(hass, room); return lights.length === 0 ? t("roomsPage") : on.length === 0 ? t("allOff") : t("roomLitOf").replace("{on}", String(on.length)).replace("{total}", String(lights.length)); })()}</span><h1>{name(room.id, room.name)}</h1></div>
          {roomLights(hass, room).lights.length > 0 && !editing && <div className="room-actions"><button onClick={() => setRoomLights(hass, room, true)} type="button"><HDIcon name="light" size={18} />{t("turnOn")}</button><button className="room-actions__primary" onClick={() => setRoomLights(hass, room, false)} type="button"><HDIcon name="power" size={18} />{t("turnOff")}</button></div>}
        </header>
        {editing && <p className="edit-hint">{t("editHint")}</p>}
        <RoomDevices className="sb-grid" key={room.id} props={props} render={(entity) => <EntityCard entity={entity} hass={hass} language={language} onLongPress={setModalEntity} t={t} />} room={room} sizable />
      </> : <>
        <header className="sb-main__header"><div><span className="eyebrow">{t("appName")}</span><h1>{t("overview")}</h1></div></header>
        {editing && <p className="edit-hint">{t("editHint")}</p>}
        {config?.visibility?.home_cards?.scenes && <SceneStrip props={props} />}
        <HomeGrid {...props} className="sb-grid sb-home" onLayout={detachSidebar(props)} onOpenRoom={(id) => onSelectRoom(id)} />
      </>}
    </section>
    {modalEntity && <EntityModal entity={modalEntity} hass={hass} language={language} onClose={() => setModalEntity(null)} roomName={roomName(modalEntity)} t={t} />}
  </main>;
}

/** A dock page in the sidebar layout: its title and devices on the right, like a room. */
function SidebarPage({ onLongPress, page, props }: { onLongPress: (entity: DiscoveredEntity) => void; page: PageRef; props: ScreenProps }) {
  const { editing, hass, language, t } = props;
  const content = usePageContent(props, page);
  return <>
    <header className="sb-main__header"><div><span className="eyebrow">{content.count} {t("entities")}</span><h1>{content.title}</h1></div></header>
    {editing && <p className="edit-hint">{t("editHint")}</p>}
    {content.body({ className: "sb-grid", open: onLongPress, render: (entity) => <EntityCard entity={entity} hass={hass} language={language} onLongPress={onLongPress} t={t} />, sizable: true })}
  </>;
}
