import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { coverOn } from "../devices";
import { domainLabel } from "../i18n";
import { arrange, entityKey, getLayout, roomScreen } from "../layout";
import { isRoomLight } from "../personalize";
import type { HomeSmartConfig } from "../types/config";
import type { DiscoveredEntity, Room } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { EntityCard } from "./EntityCard";
import { EntityModal } from "./EntityModal";
import { HDIcon, RoomIcon } from "./HDIcon";

const DOMAIN_ORDER = [
  "light",
  "switch",
  "fan",
  "cover",
  "climate",
  "media_player",
  "vacuum",
  "select",
  "input_select",
  "script",
  "button",
  "input_button",
  "scene",
  "lock",
  "camera",
  "alarm_control_panel",
  "binary_sensor",
  "sensor",
  "plant",
];

const ACTIVE_STATES = new Set([
  "on",
  "open",
  "opening",
  "playing",
  "paused",
  "heat",
  "cool",
  "heat_cool",
  "auto",
  "dry",
  "fan_only",
  "unlocked",
  "cleaning",
  "returning",
]);

const PRESENCE_CLASSES = new Set(["motion", "occupancy", "presence"]);

const ACTIVITY_DOMAINS: Array<{ domain: string; label: string; color: string }> = [
  { domain: "light", label: "Lights", color: "var(--on, #ffc94d)" },
  { domain: "climate", label: "Climate", color: "var(--cool, #6cc4ff)" },
  { domain: "fan", label: "Fan", color: "#5eead4" },
  { domain: "media_player", label: "Media", color: "var(--ok, #5fd68a)" },
  { domain: "cover", label: "Cover", color: "#c4b5fd" },
  { domain: "switch", label: "Switch", color: "#fbbf24" },
  { domain: "lock", label: "Lock", color: "#f87171" },
];

function getDeviceClass(entity: DiscoveredEntity, state?: HassEntity): string {
  return String(state?.attributes.device_class ?? entity.device_class ?? "").toLowerCase();
}

function isEntityActive(entity: DiscoveredEntity, state?: HassEntity): boolean {
  if (!state) return false;
  if (entity.domain === "cover") return coverOn(entity, state.state);
  if (entity.domain === "lock") return state.state === "unlocked";
  return ACTIVE_STATES.has(state.state);
}

function extractTemperature(room: Room, hass: HomeAssistant): string | null {
  if (room.temperature_entity) {
    const state = hass.states[room.temperature_entity];
    const value = state ? Number.parseFloat(state.state) : Number.NaN;
    if (Number.isFinite(value)) {
      const unit = typeof state?.attributes.unit_of_measurement === "string" ? state.attributes.unit_of_measurement : "°";
      return `${Math.round(value * 10) / 10}${unit.startsWith("°") ? unit : "°"}`;
    }
  }

  for (const entity of room.entities) {
    if (entity.domain !== "sensor") continue;
    const state = hass.states[entity.entity_id];
    if (getDeviceClass(entity, state) !== "temperature") continue;
    const value = state ? Number.parseFloat(state.state) : Number.NaN;
    if (Number.isFinite(value)) {
      const unit = typeof state?.attributes.unit_of_measurement === "string" ? state.attributes.unit_of_measurement : "°";
      return `${Math.round(value * 10) / 10}${unit.startsWith("°") ? unit : "°"}`;
    }
  }

  const climate = room.entities.find((entity) => entity.domain === "climate");
  const current = climate ? hass.states[climate.entity_id]?.attributes.current_temperature : undefined;
  return typeof current === "number" && Number.isFinite(current) ? `${Math.round(current * 10) / 10}°` : null;
}

function extractHumidity(room: Room, hass: HomeAssistant): string | null {
  if (room.humidity_entity) {
    const state = hass.states[room.humidity_entity];
    const value = state ? Number.parseFloat(state.state) : Number.NaN;
    if (Number.isFinite(value)) return `${Math.round(value)}%`;
  }

  for (const entity of room.entities) {
    if (entity.domain !== "sensor") continue;
    const state = hass.states[entity.entity_id];
    if (getDeviceClass(entity, state) !== "humidity") continue;
    const value = state ? Number.parseFloat(state.state) : Number.NaN;
    if (Number.isFinite(value)) return `${Math.round(value)}%`;
  }

  const climate = room.entities.find((entity) => entity.domain === "climate");
  const currentHumidity = climate ? hass.states[climate.entity_id]?.attributes.humidity : undefined;
  return typeof currentHumidity === "number" && Number.isFinite(currentHumidity) ? `${Math.round(currentHumidity)}%` : null;
}

function detectRoomPresence(room: Room, hass: HomeAssistant): boolean {
  return room.entities.some((entity) => {
    if (entity.domain !== "binary_sensor") return false;
    const state = hass.states[entity.entity_id];
    return state?.state === "on" && PRESENCE_CLASSES.has(getDeviceClass(entity, state));
  });
}

function formatLightSummary(activeCount: number, totalLights: number, activeDevicesCount: number, t: (k: string) => string): string {
  if (totalLights > 0) {
    if (activeCount === 1) return t("roomSummaryLight");
    if (activeCount > 1) return t("roomSummaryLights").replace("{count}", String(activeCount));
    return t("roomSummaryAllOff");
  }
  if (activeDevicesCount > 0) {
    return `${activeDevicesCount} ${t("active")}`;
  }
  return t("roomSummaryAllOff");
}

export interface RoomSummaryCardProps {
  room: Room;
  hass: HomeAssistant;
  language?: string;
  t: (k: string) => string;
  onClick: () => void;
}

export function RoomSummaryCard({ room, hass, language, t, onClick }: RoomSummaryCardProps) {
  const roomName = room.id === "__unassigned__" ? t("unassigned") : room.name;
  const visibleEntities = room.entities.filter((entity) => !entity.hidden);
  const lights = visibleEntities.filter(isRoomLight);
  const activeLightsCount = lights.filter((entity) => hass.states[entity.entity_id]?.state === "on").length;
  const activeDevicesCount = visibleEntities.filter((entity) => isEntityActive(entity, hass.states[entity.entity_id])).length;
  const unavailable =
    visibleEntities.length > 0 &&
    visibleEntities.every((entity) => {
      const state = hass.states[entity.entity_id]?.state;
      return !state || state === "unavailable" || state === "unknown";
    });

  const temperature = extractTemperature(room, hass);
  const humidity = extractHumidity(room, hass);
  const hasPresence = detectRoomPresence(room, hass);
  const isActive = activeLightsCount > 0;
  const summaryText = formatLightSummary(activeLightsCount, lights.length, activeDevicesCount, t);

  const domainDots = ACTIVITY_DOMAINS.filter(({ domain }) =>
    visibleEntities.some((entity) => entity.domain === domain),
  ).map((def) => ({
    ...def,
    active: visibleEntities.some(
      (entity) => entity.domain === def.domain && isEntityActive(entity, hass.states[entity.entity_id]),
    ),
  }));

  const cardClasses = [
    "hs-room-summary",
    isActive ? "hs-room-summary--active" : "",
    hasPresence ? "hs-room-summary--presence" : "",
    unavailable ? "hs-room-summary--unavailable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={`${roomName}: ${summaryText}`}
      className={cardClasses}
      onClick={onClick}
      type="button"
    >
      <div className="hs-room-summary__top">
        <span className="hs-room-summary__icon">
          <RoomIcon room={room} size={20} />
        </span>
        <div className="hs-room-summary__badges">
          {hasPresence && (
            <span
              aria-label={t("roomSummaryPresence")}
              className="hs-room-summary__presence-dot"
              title={t("roomSummaryPresence")}
            />
          )}
          <span className="hs-room-summary__chevron" aria-hidden="true">
            <HDIcon name="chevron" size={16} />
          </span>
        </div>
      </div>

      <div className="hs-room-summary__body">
        <strong className="hs-room-summary__name">{roomName}</strong>
        <span className="hs-room-summary__lights">{summaryText}</span>
      </div>

      <div className="hs-room-summary__footer">
        <div className="hs-room-summary__dots" aria-hidden="true">
          {domainDots.map((dot) => (
            <span
              key={dot.domain}
              className={`hs-room-summary__dot${dot.active ? " hs-room-summary__dot--active" : ""}`}
              data-domain={dot.domain}
              style={dot.active ? ({ "--dot-color": dot.color } as CSSProperties) : undefined}
              title={domainLabel(dot.domain, language)}
            />
          ))}
        </div>
        {(temperature || humidity) && (
          <div className="hs-room-summary__metrics">
            {temperature && (
              <span className="hs-room-summary__metric">
                <HDIcon name="climate" size={12} />
                {temperature}
              </span>
            )}
            {humidity && (
              <span className="hs-room-summary__metric">
                <HDIcon name="drop" size={12} />
                {humidity}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export interface RoomPopupProps {
  room: Room;
  hass: HomeAssistant;
  config: HomeSmartConfig;
  t: (k: string) => string;
  language?: string;
  onClose: () => void;
  onOpenFullRoom?: () => void;
  editing: boolean;
}

export function RoomPopup({ room, hass, config, t, language, onClose, onOpenFullRoom, editing }: RoomPopupProps) {
  const popupRef = useRef<HTMLElement>(null);
  const startedInsideRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const [busyLights, setBusyLights] = useState(false);

  const roomName = room.id === "__unassigned__" ? t("unassigned") : room.name;

  useEffect(() => {
    setModalEntity(null);
    if (popupRef.current) {
      popupRef.current.scrollTop = 0;
    }
  }, [room.id]);

  useEffect(() => {
    if (modalEntity) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalEntity]);

  const visibleEntities = useMemo(() => {
    const screen = roomScreen(room.id);
    const layout = getLayout(config, screen);
    const hiddenLegacy = new Set(config.visibility?.hidden_room_entities ?? []);
    const candidates = room.entities.filter((entity) => editing || (!entity.hidden && !hiddenLegacy.has(entity.entity_id)));
    const sorted = [...candidates].sort((a, b) => {
      const ai = DOMAIN_ORDER.indexOf(a.domain);
      const bi = DOMAIN_ORDER.indexOf(b.domain);
      const rankA = ai < 0 ? DOMAIN_ORDER.length : ai;
      const rankB = bi < 0 ? DOMAIN_ORDER.length : bi;
      return rankA - rankB || (a.name ?? a.entity_id).localeCompare(b.name ?? b.entity_id);
    });
    const byKey = new Map(sorted.map((entity) => [entityKey(entity.entity_id), entity]));
    const { visible } = arrange([...byKey.keys()], layout, true);
    return visible.map((key) => byKey.get(key)).filter((entity): entity is DiscoveredEntity => Boolean(entity));
  }, [room.id, room.entities, config, editing]);

  const lights = useMemo(() => room.entities.filter(isRoomLight), [room.entities]);
  const activeLightsCount = lights.filter((entity) => hass.states[entity.entity_id]?.state === "on").length;
  const temperature = extractTemperature(room, hass);
  const humidity = extractHumidity(room, hass);
  const hasPresence = detectRoomPresence(room, hass);

  const toggleRoomLights = async () => {
    if (busyLights || lights.length === 0) return;
    setBusyLights(true);
    try {
      await hass.callService("light", activeLightsCount > 0 ? "turn_off" : "turn_on", {
        entity_id: lights.map((light) => light.entity_id),
      });
    } finally {
      setBusyLights(false);
    }
  };

  const summaryParts = [
    formatLightSummary(activeLightsCount, lights.length, 0, t),
    temperature,
    humidity,
  ].filter(Boolean);

  const shell = popupRef.current?.closest(".app-shell") ?? null;
  const detailModal = modalEntity ? (
    <EntityModal
      entity={modalEntity}
      hass={hass}
      language={language}
      onClose={() => setModalEntity(null)}
      roomName={roomName}
      t={t}
    />
  ) : null;

  return (
    <>
      <div
        aria-label={roomName}
        aria-modal="true"
        className="hs-room-popup-backdrop"
        onClick={(event) => {
          const wasInside = startedInsideRef.current;
          startedInsideRef.current = false;
          if (event.target === event.currentTarget && !wasInside) {
            onClose();
          }
        }}
        onMouseDown={(event) => {
          startedInsideRef.current = event.target !== event.currentTarget;
        }}
        role="dialog"
      >
        <section
          className={`hs-room-popup${editing ? " hs-room-popup--editing" : ""}${hasPresence ? " hs-room-popup--presence" : ""}`}
          ref={popupRef}
        >
          <header className="hs-room-popup__header">
            <div className="hs-room-popup__title-group">
              <span className={`hs-room-popup__icon${activeLightsCount > 0 ? " hs-room-popup__icon--active" : ""}`}>
                <RoomIcon room={room} size={22} />
              </span>
              <div className="hs-room-popup__heading">
                <h2>{roomName}</h2>
                <p>{summaryParts.join(" · ")}</p>
              </div>
            </div>

            <div className="hs-room-popup__actions">
              {onOpenFullRoom && (
                <button
                  aria-label={t("openAction")}
                  className="hs-room-popup__close"
                  onClick={onOpenFullRoom}
                  title={t("openAction")}
                  type="button"
                >
                  <HDIcon name="expand" size={16} />
                </button>
              )}
              {lights.length > 0 && !editing && (
                <button
                  aria-label={`${roomName}: ${activeLightsCount > 0 ? t("turnAllOff") : t("turnAllOn")}`}
                  className={`hs-room-popup__power${activeLightsCount > 0 ? " hs-room-popup__power--on" : ""}`}
                  disabled={busyLights}
                  onClick={() => void toggleRoomLights()}
                  title={activeLightsCount > 0 ? t("turnAllOff") : t("turnAllOn")}
                  type="button"
                >
                  <HDIcon name="power" size={16} />
                </button>
              )}
              <button
                aria-label={t("close")}
                className="hs-room-popup__close"
                onClick={onClose}
                title={t("close")}
                type="button"
              >
                <HDIcon name="close" size={18} />
              </button>
            </div>
          </header>

          <div className="hs-room-popup__body">
            {visibleEntities.length === 0 ? (
              <div className="hs-room-popup__empty">
                <p>{t("noVisibleEntities")}</p>
              </div>
            ) : (
              <div className="hs-room-popup__grid">
                {visibleEntities.map((entity) => (
                  <EntityCard
                    key={entity.entity_id}
                    entity={entity}
                    hass={hass}
                    language={language}
                    onLongPress={setModalEntity}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {detailModal && (shell ? createPortal(detailModal, shell) : detailModal)}
    </>
  );
}

export const ROOM_POPUP_CSS: string = String.raw`
/* RoomSummaryCard — compact room overview */
.hs-room-summary {
  position: relative;
  min-width: 0;
  width: 100%;
  min-height: calc(var(--u, 8px) * 16.5);
  padding: calc(var(--u, 8px) * 1.8);
  border-radius: calc(var(--u, 8px) * 3 * var(--hd-r, 1));
  border: 1px solid var(--hd-frame, var(--line, rgba(255, 255, 255, 0.2)));
  background: var(--glass, rgba(255, 255, 255, 0.14));
  backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  color: var(--ink, #ffffff);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1.2);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.hs-room-summary:hover {
  transform: translateY(-2px);
  box-shadow: 0 calc(var(--u, 8px) * 1) calc(var(--u, 8px) * 2.5) rgba(0, 0, 0, 0.22);
}

.hs-room-summary:active {
  transform: scale(0.978);
}

.hs-room-summary:focus-visible {
  outline: 2px solid var(--ink, #ffffff);
  outline-offset: 2px;
}

.hs-room-summary--active {
  background: var(--paper, var(--hd-accent, #f4edd9));
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
}

.hs-room-summary--presence {
  border-color: rgba(95, 214, 138, 0.65);
  box-shadow:
    0 0 0 1px rgba(95, 214, 138, 0.28),
    0 0 18px rgba(95, 214, 138, 0.24),
    inset 0 0 14px rgba(95, 214, 138, 0.08);
  animation: hs-presence-glow 3s ease-in-out infinite;
}

.hs-room-summary--active.hs-room-summary--presence {
  border-color: rgba(95, 214, 138, 0.8);
  box-shadow:
    0 0 0 1.5px rgba(95, 214, 138, 0.42),
    0 0 22px rgba(95, 214, 138, 0.28);
}

.hs-room-summary--unavailable {
  opacity: 0.45;
}

.hs-room-summary__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1);
}

.hs-room-summary__icon {
  width: calc(var(--u, 8px) * 4.6);
  height: calc(var(--u, 8px) * 4.6);
  border-radius: var(--hd-round, 50%);
  display: grid;
  place-items: center;
  flex: none;
  background: rgba(255, 255, 255, 0.16);
  color: inherit;
  transition: background 0.25s ease, color 0.25s ease;
}

.hs-room-summary--active .hs-room-summary__icon {
  background: var(--on, #ffc94d);
  color: var(--on-ink, #2a2110);
}

.hs-room-summary__badges {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.8);
}

.hs-room-summary__presence-dot {
  width: calc(var(--u, 8px) * 1);
  height: calc(var(--u, 8px) * 1);
  border-radius: 50%;
  background: var(--ok, #5fd68a);
  box-shadow: 0 0 8px var(--ok, #5fd68a);
  animation: hs-presence-pulse 2s ease-in-out infinite;
}

.hs-room-summary__chevron {
  color: var(--ink-3, rgba(255, 255, 255, 0.5));
  display: inline-flex;
  align-items: center;
}

.hs-room-summary--active .hs-room-summary__chevron {
  color: var(--paper-ink-2, rgba(43, 36, 24, 0.62));
}

.hs-room-summary__body {
  margin-top: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 0.35);
}

.hs-room-summary__name {
  display: block;
  font: 600 calc(var(--u, 8px) * 1.95) / 1.15 var(--f-body, system-ui, sans-serif);
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hs-room-summary__lights {
  display: block;
  font: 500 calc(var(--u, 8px) * 1.55) / 1.25 var(--f-body, system-ui, sans-serif);
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hs-room-summary--active .hs-room-summary__lights {
  color: var(--paper-ink-2, rgba(43, 36, 24, 0.62));
}

.hs-room-summary__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1);
  min-height: calc(var(--u, 8px) * 2);
}

.hs-room-summary__dots {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.55);
  flex-wrap: wrap;
}

.hs-room-summary__dot {
  width: calc(var(--u, 8px) * 0.9);
  height: calc(var(--u, 8px) * 0.9);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.hs-room-summary--active .hs-room-summary__dot {
  background: rgba(43, 36, 24, 0.18);
}

.hs-room-summary__dot--active {
  background: var(--dot-color, var(--on, #ffc94d));
  box-shadow: 0 0 8px var(--dot-color, var(--on, #ffc94d));
  transform: scale(1.12);
}

.hs-room-summary--active .hs-room-summary__dot--active {
  background: var(--dot-color, var(--on-deep, #e8a21b));
}

.hs-room-summary__metrics {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.9);
  font: 500 calc(var(--u, 8px) * 1.45) / 1 var(--f-body, system-ui, sans-serif);
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.hs-room-summary--active .hs-room-summary__metrics {
  color: var(--paper-ink-2, rgba(43, 36, 24, 0.62));
}

.hs-room-summary__metric {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.3);
  white-space: nowrap;
}

/* RoomPopup — slide-up glassmorphism modal */
.hs-room-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 48;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--u, 8px) * 3);
  background: rgba(8, 6, 12, 0.56);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: hs-popup-fade-in 0.22s ease both;
}

.hs-room-popup {
  width: min(100%, 860px);
  max-height: min(86vh, 780px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: calc(var(--u, 8px) * 4 * var(--hd-r, 1));
  border: 1px solid var(--hd-frame, var(--line, rgba(255, 255, 255, 0.2)));
  background: rgba(24, 22, 30, 0.78);
  backdrop-filter: blur(32px) saturate(1.4);
  -webkit-backdrop-filter: blur(32px) saturate(1.4);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  color: var(--ink, #ffffff);
  animation: hs-popup-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hs-room-popup--presence {
  border-color: rgba(95, 214, 138, 0.45);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.48),
    0 0 24px rgba(95, 214, 138, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.hs-room-popup__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1.8);
  padding: calc(var(--u, 8px) * 2.4) calc(var(--u, 8px) * 2.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.hs-room-popup__title-group {
  display: flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 1.5);
  min-width: 0;
  flex: 1;
}

.hs-room-popup__icon {
  width: calc(var(--u, 8px) * 5.2);
  height: calc(var(--u, 8px) * 5.2);
  border-radius: var(--hd-round, 50%);
  display: grid;
  place-items: center;
  flex: none;
  background: rgba(255, 255, 255, 0.12);
  color: var(--ink, #ffffff);
}

.hs-room-popup__icon--active {
  background: var(--on, #ffc94d);
  color: var(--on-ink, #2a2110);
}

.hs-room-popup__heading {
  min-width: 0;
  flex: 1;
}

.hs-room-popup__heading h2 {
  margin: 0;
  font: 500 calc(var(--u, 8px) * 2.8) / 1.15 var(--f-display, system-ui, sans-serif);
  color: var(--ink, #ffffff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hs-room-popup__heading p {
  margin: calc(var(--u, 8px) * 0.35) 0 0;
  font: 500 calc(var(--u, 8px) * 1.65) / 1.25 var(--f-body, system-ui, sans-serif);
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hs-room-popup__actions {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 1);
  flex: none;
}

.hs-room-popup__power,
.hs-room-popup__close {
  width: calc(var(--u, 8px) * 4.8);
  height: calc(var(--u, 8px) * 4.8);
  min-width: 36px;
  min-height: 36px;
  border-radius: var(--hd-round, 50%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.12);
  color: var(--ink, #ffffff);
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.15s ease;
}

.hs-room-popup__power:hover,
.hs-room-popup__close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.hs-room-popup__power:active,
.hs-room-popup__close:active {
  transform: scale(0.94);
}

.hs-room-popup__power--on {
  background: var(--on, #ffc94d);
  color: var(--on-ink, #2a2110);
  border-color: transparent;
}

.hs-room-popup__power--on:hover {
  background: var(--on-deep, #e8a21b);
}

.hs-room-popup__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: calc(var(--u, 8px) * 2.4) calc(var(--u, 8px) * 2.8) calc(var(--u, 8px) * 2.8);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.hs-room-popup__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--u, 8px) * 19.5), 1fr));
  grid-auto-rows: minmax(calc(var(--u, 8px) * 16.5), auto);
  gap: calc(var(--u, 8px) * 1.6);
}

.hs-room-popup__empty {
  padding: calc(var(--u, 8px) * 5) calc(var(--u, 8px) * 2);
  text-align: center;
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
  font: 500 calc(var(--u, 8px) * 1.8) / 1.4 var(--f-body, system-ui, sans-serif);
}

@keyframes hs-popup-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes hs-popup-slide-up {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes hs-popup-sheet-up {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hs-presence-glow {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgba(95, 214, 138, 0.26),
      0 0 16px rgba(95, 214, 138, 0.2),
      inset 0 0 12px rgba(95, 214, 138, 0.06);
  }
  50% {
    box-shadow:
      0 0 0 1.5px rgba(95, 214, 138, 0.45),
      0 0 24px rgba(95, 214, 138, 0.34),
      inset 0 0 16px rgba(95, 214, 138, 0.12);
  }
}

@keyframes hs-presence-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(0.85);
  }
}

@media (max-width: 720px) {
  .hs-room-summary {
    min-height: calc(var(--u, 7px) * 15);
    padding: calc(var(--u, 7px) * 1.6);
  }

  .hs-room-popup-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .hs-room-popup {
    width: 100%;
    max-width: 100%;
    max-height: 88dvh;
    border-radius: calc(var(--u, 7px) * 3.6 * var(--hd-r, 1)) calc(var(--u, 7px) * 3.6 * var(--hd-r, 1)) 0 0;
    border-bottom: 0;
    animation: hs-popup-sheet-up 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .hs-room-popup__header {
    padding: calc(var(--u, 7px) * 2) calc(var(--u, 7px) * 2.2);
  }

  .hs-room-popup__body {
    padding: calc(var(--u, 7px) * 2) calc(var(--u, 7px) * 2.2) calc(calc(var(--u, 7px) * 2.4) + env(safe-area-inset-bottom, 0px));
  }

  .hs-room-popup__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: calc(var(--u, 7px) * 1.4);
  }
}
`;
