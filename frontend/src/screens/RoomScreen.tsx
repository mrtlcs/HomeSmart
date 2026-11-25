import { inRoom, isRoomLight } from "../personalize";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSwipeGesture } from "../useSwipeGesture";
import { ContextHeader } from "../components/ContextHeader";
import { EditableGrid } from "../components/EditableGrid";
import { EntityCard } from "../components/EntityCard";
import { EntityModal } from "../components/EntityModal";
import { EntityPicker } from "../components/EntityPicker";
import { SceneStrip } from "../components/SceneStrip";
import { isEnvironmentSensor, SensorStrip } from "../components/SensorStrip";
import { RoomOptions } from "../components/RoomOptions";
import { HDIcon, RoomIcon } from "../components/HDIcon";
import { CategoryFilterChips, type CategoryType, entityMatchesCategory } from "../components/CategoryFilterChips";
import { arrange, compactSensors, entityKey, getLayout, keyId, pickerRooms, roomScreen, showItem } from "../layout";
import type { DiscoveredEntity, Room } from "../types/discovery";
import { entityIndex, type ScreenProps } from "./types";
import { usePlan } from "../plan";
import { useFloorGroups } from "../components/FloorPlan";

const DOMAIN_ORDER = ["light", "switch", "fan", "cover", "climate", "media_player", "vacuum", "select", "input_select", "script", "button", "input_button", "scene", "lock", "camera", "alarm_control_panel", "binary_sensor", "sensor", "plant"];

export function RoomScreen(props: ScreenProps & { onSelectRoom: (roomId: string) => void; room: Room }) {
  const { allRooms, config, data, editing, hass, language, onLayout, onSelectRoom, room, t } = props;
  const [busy, setBusy] = useState(false);
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const [picking, setPicking] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>("all");
  const plan = usePlan();
  const screen = roomScreen(room.id);
  const layout = getLayout(config, screen);
  const roomName = room.id === "__unassigned__" ? t("unassigned") : room.name;
  const lights = room.entities.filter(isRoomLight);
  const activeLights = lights.filter((entity) => hass.states[entity.entity_id]?.state === "on");
  // With scenes at the top of each room, the room's own scenes leave the cards for the strip.
  const natural = room.entities.filter((entity) => !(config.room_scenes && entity.domain === "scene") && !(config.room_sensors && isEnvironmentSensor(entity, hass))).sort((a, b) => DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain) || a.name.localeCompare(b.name));
  const everywhere = entityIndex(allRooms);
  const own = new Set(room.entities.map((entity) => entity.entity_id));
  // Devices brought in from other rooms in edit mode.
  const added = (layout.added ?? []).filter((id) => !own.has(id) && everywhere.byId.has(id));
  const byId = new Map([...room.entities, ...added.map((id) => everywhere.byId.get(id)!)].map((entity) => [entity.entity_id, inRoom(entity, screen, config.room_names?.[screen])]));
  const allScreenEntities = useMemo(() => Array.from(byId.values()), [byId]);
  const { visible, hidden } = arrange([...natural.map((entity) => entityKey(entity.entity_id)), ...added.map(entityKey)], layout, true);
  const filteredVisible = useMemo(() => {
    if (editing || categoryFilter === "all") return visible;
    return visible.filter((key) => {
      const entity = byId.get(keyId(key));
      return entity ? entityMatchesCategory(entity, categoryFilter, hass.states[entity.entity_id]) : true;
    });
  }, [visible, editing, categoryFilter, byId, hass.states]);
  const setAdded = (ids: string[]) => onLayout(screen, { ...layout, added: ids });
  const groups = useFloorGroups(hass, data.rooms, Boolean(config.rooms_by_floor), t("floorplanNoFloor"));
  const [slideDir, setSlideDir] = useState<"next" | "prev" | null>(null);
  const roomPaneRef = useRef<HTMLElement>(null);
  const flatRooms = useMemo(() => groups.flatMap((group) => group.rooms), [groups]);
  const currentIdx = flatRooms.findIndex((item) => item.id === room.id);

  useSwipeGesture(roomPaneRef, {
    disabled: editing,
    onSwipeLeft: () => {
      if (currentIdx >= 0 && currentIdx < flatRooms.length - 1) {
        setSlideDir("next");
        onSelectRoom(flatRooms[currentIdx + 1].id);
      }
    },
    onSwipeRight: () => {
      if (currentIdx > 0) {
        setSlideDir("prev");
        onSelectRoom(flatRooms[currentIdx - 1].id);
      } else if (currentIdx === 0) {
        window.dispatchEvent(new CustomEvent("HOMESMART-navigate", { detail: "home" }));
      }
    },
  });

  useEffect(() => {
    const activeBtn = document.querySelector('.room-selector__list > button[aria-selected="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [room.id]);

  const setRoomLights = async (service: "turn_on" | "turn_off") => {
    if (busy || lights.length === 0) return;
    setBusy(true);
    try { await hass.callService("light", service, { entity_id: lights.map((entity) => entity.entity_id) }); } finally { setBusy(false); }
  };

  return (
    <main className={`screen room-screen ${editing ? "screen--editing" : ""}`}>
      <ContextHeader config={config} hass={hass} language={language} onSettings={props.onSettings} t={t} />
      <div className="room-workspace">
        <aside className="room-selector" aria-label={t("roomsNavigation")}>
          <div className="room-selector__list" role="tablist">
            {groups.map((group) => [
              group.name != null && <span className="room-selector__floor" key={`floor-${group.id}`}>{group.name}</span>,
              ...group.rooms.map((item) => {
                const count = item.entities.filter((entity) => isRoomLight(entity) && hass.states[entity.entity_id]?.state === "on").length;
                return <button aria-selected={item.id === room.id} key={item.id} onClick={() => { setSlideDir(null); onSelectRoom(item.id); }} role="tab" type="button"><span className="room-selector__icon"><RoomIcon room={item} size={19} /></span><span>{item.id === "__unassigned__" ? t("unassigned") : item.name}</span>{count > 0 && <i>{count}</i>}</button>;
              }),
            ])}
          </div>
        </aside>

        <section className={`room-pane ${slideDir === "next" ? "room-pane-slide-next" : slideDir === "prev" ? "room-pane-slide-prev" : "room-pane-fade"}`} data-room-accent={room.accent || undefined} key={room.id} ref={roomPaneRef} style={room.accent ? ({ "--room-theme": room.accent } as React.CSSProperties) : undefined}>
          <header className="room-operational-header">
            <div>
              <span className="eyebrow">{activeLights.length === 0 ? t("allOff") : (activeLights.length === 1 ? t("oneRoomLightOn") : t("roomLightsOn").replace("{count}", String(activeLights.length)))}</span>
              <h1>{roomName}</h1>
            </div>
            {lights.length > 0 && !editing && <div className="room-actions"><button disabled={busy} onClick={() => void setRoomLights("turn_on")} type="button"><HDIcon name="light" size={18} />{t("turnOn")}</button><button className="room-actions__primary" disabled={busy} onClick={() => void setRoomLights("turn_off")} type="button"><HDIcon name="power" size={18} />{t("turnOff")}</button></div>}
          </header>
          {editing && <p className="edit-hint">{t("editHint")}</p>}
          {editing && <RoomOptions allRooms={allRooms} compact={compactSensors(layout, visible, (next) => onLayout(screen, next))} hass={hass} room={room} t={t} />}
          {config.room_sensors && <SensorStrip props={props} room={room} />}
          {config.room_scenes && <SceneStrip props={props} room={room} />}
          {!editing && <CategoryFilterChips activeCategory={categoryFilter} entities={allScreenEntities} hass={hass} onSelect={setCategoryFilter} t={t} />}
          {visible.length === 0 && !editing && !(config.room_scenes && room.entities.some((entity) => entity.domain === "scene")) && !(config.room_sensors && room.entities.some((entity) => isEnvironmentSensor(entity, hass)))
            ? <section className="empty-state"><p>{t("noVisibleEntities")}</p></section>
            : <EditableGrid
                hass={hass}
                className="device-grid"
                editing={editing}
                hiddenItems={hidden.map((key) => ({ key, label: byId.get(keyId(key))?.name ?? keyId(key) }))}
                items={filteredVisible.map((key) => {
                  const entity = byId.get(keyId(key))!;
                  return { key, label: entity.name, removal: own.has(entity.entity_id) ? "hide" : "remove", node: <EntityCard entity={entity} hass={hass} language={language} onLongPress={setModalEntity} t={t} /> };
                })}
                addLabel={t("addDevices")}
                roomScreen={screen}
                layout={layout}
                onAdd={() => setPicking(true)}
                onLayout={(next) => onLayout(screen, next)}
                onRemove={(key) => setAdded(added.filter((id) => id !== keyId(key)))}
                sections
                t={t}
              />}
        </section>
      </div>
      {modalEntity && <EntityModal entity={modalEntity} hass={hass} language={language} onClose={() => setModalEntity(null)} roomName={everywhere.roomName(modalEntity) ?? roomName} t={t} />}
      {picking && <EntityPicker language={language} onClose={() => setPicking(false)} onToggle={(id) => { if (hidden.includes(entityKey(id))) { if (plan.allow(id)) onLayout(screen, showItem(layout, entityKey(id), visible)); } else if (added.includes(id)) setAdded(added.filter((item) => item !== id)); else if (plan.allow(id)) setAdded([...added, id]); }} rooms={pickerRooms(room, hidden, props.catalogRooms.filter((item) => item.id !== room.id))} selected={added} t={t} />}
    </main>
  );
}
