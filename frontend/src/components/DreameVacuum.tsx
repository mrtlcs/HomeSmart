import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { cameraSnapshot, selectOption, selectOptions, vacuumActions, vacuumStatus } from "../devices";
import type { TranslationKey } from "../i18n";
import type { ScreenProps } from "../screens/types";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { ContextHeader } from "./ContextHeader";
import { EntityModal } from "./EntityModal";
import { HDIcon } from "./HDIcon";
import { HDSelect, HDSegmented } from "./HDSelect";

// Dreame X40 Master & Robot Vacuum Studio (Tasshack/dreame-vacuum aware).
// Auto-discovers all sibling entities sharing the robot's `device_id` (plus slug-prefix fallback):
// map camera, dock water & drying states, consumables/care wear, rooms, cleaning modes,
// suction levels, water flow, and automations/shortcuts.

export interface VacuumDiscovery {
  vacuumId: string;
  deviceId: string | null;
  mapId?: string;
  batteryId?: string;
  cleanedAreaId?: string;
  cleaningTimeId?: string;
  cleaningCountId?: string;
  taskStatusId?: string;
  cleaningModeId?: string;
  suctionLevelId?: string;
  waterVolumeId?: string;
  dockStatusId?: string;
  dryingStatusId?: string;
  cleanWaterId?: string;
  dirtyWaterId?: string;
  mopPadsId?: string;
  autoEmptySwitchId?: string;
  washMopsBtnId?: string;
  emptyDustBtnId?: string;
  dryMopsBtnId?: string;
  consumables: Array<{
    key: string;
    labelKey: TranslationKey;
    pctId?: string;
    timeId?: string;
  }>;
  rooms: Array<{ id: number; name: string; icon?: string }>;
  schedules: string[];
}

function readNum(hass: HomeAssistant, id?: string): number | null {
  if (!id) return null;
  const v = Number.parseFloat(hass.states[id]?.state ?? "");
  return Number.isFinite(v) ? v : null;
}

function formatStr(hass: HomeAssistant, id?: string): string | null {
  if (!id) return null;
  const st = hass.states[id];
  if (!st || ["unavailable", "unknown"].includes(st.state)) return null;
  const unit = typeof st.attributes.unit_of_measurement === "string" ? st.attributes.unit_of_measurement : "";
  return unit ? `${st.state} ${unit}` : st.state.replaceAll("_", " ");
}

export function discoverVacuumDevice(hass: HomeAssistant, vacuumId: string): VacuumDiscovery {
  const vacState = hass.states[vacuumId];
  const deviceId = hass.entities?.[vacuumId]?.device_id ?? null;
  const slug = vacuumId.replace(/^vacuum\./, "").toLowerCase();

  const siblingIds = Object.keys(hass.states).filter((id) => {
    if (deviceId && hass.entities?.[id]?.device_id === deviceId) return true;
    return slug.length > 3 && id.toLowerCase().includes(slug);
  });

  const pick = (rx: RegExp, domainPrefix?: string) =>
    siblingIds.find((id) => (!domainPrefix || id.startsWith(domainPrefix)) && rx.test(id));

  const mapId = pick(/map/, "camera.") ?? siblingIds.find((id) => id.startsWith("camera."));
  const batteryId = pick(/battery(_level)?$/, "sensor.");
  const cleanedAreaId = pick(/cleaned_area/, "sensor.");
  const cleaningTimeId = pick(/cleaning_time/, "sensor.");
  const cleaningCountId = pick(/(total_clean_count|cleaning_count|total_cleans)/, "sensor.");
  const taskStatusId = pick(/(task_status|dock_status|_status)$/, "sensor.");
  const cleaningModeId = pick(/cleaning_mode/, "select.");
  const suctionLevelId = pick(/suction_level/, "select.");
  const waterVolumeId = pick(/(water_volume|mop_pad_humidity|wetness)/, "select.");

  const dockStatusId = pick(/dock.*status|station_status/, "sensor.");
  const dryingStatusId = pick(/(drying_progress|drying_status|drying)/, "sensor.") ?? pick(/drying/, "binary_sensor.");
  const cleanWaterId = pick(/(clean_water|water_tank|water_box|fresh_water)/);
  const dirtyWaterId = pick(/(dirty_water|waste_water|water_shortage)/);
  const mopPadsId = pick(/(mop_pad|mop_attach|mop_install)/);
  const autoEmptySwitchId = pick(/auto_empty/, "switch.");
  const washMopsBtnId = pick(/start_washing|wash_mop/, "button.");
  const emptyDustBtnId = pick(/auto_empty|start_emptying|empty_dust/, "button.");
  const dryMopsBtnId = pick(/start_drying|dry_mop/, "button.") ?? pick(/drying/, "switch.");

  const consumableDefs: Array<{ key: string; labelKey: TranslationKey; pctRx: RegExp; timeRx: RegExp }> = [
    { key: "main_brush", labelKey: "vacuumMainBrush", pctRx: /main_brush_left$/, timeRx: /main_brush_time_left/ },
    { key: "side_brush", labelKey: "vacuumSideBrush", pctRx: /side_brush_left$/, timeRx: /side_brush_time_left/ },
    { key: "filter", labelKey: "vacuumFilter", pctRx: /filter_left$/, timeRx: /filter_time_left/ },
    { key: "sensors", labelKey: "vacuumSensorsLeft", pctRx: /sensor_dirty_left$/, timeRx: /sensor_dirty_time_left/ },
    { key: "strainer", labelKey: "vacuumDockStrainer", pctRx: /(tank_filter|strainer|silver_ion).*left$/, timeRx: /(tank_filter|strainer).*time_left/ },
  ];

  const consumables = consumableDefs
    .map((def) => ({
      key: def.key,
      labelKey: def.labelKey,
      pctId: pick(def.pctRx, "sensor."),
      timeId: pick(def.timeRx, "sensor."),
    }))
    .filter((c) => Boolean(c.pctId || c.timeId));

  // Tasshack exposes room segments on the camera map `rooms` attribute or vacuum `rooms` attribute
  const rawRooms =
    (mapId && hass.states[mapId]?.attributes?.rooms) ||
    vacState?.attributes?.rooms ||
    vacState?.attributes?.segments;
  const rooms: Array<{ id: number; name: string; icon?: string }> = [];
  if (rawRooms && typeof rawRooms === "object") {
    for (const [key, val] of Object.entries(rawRooms as Record<string, unknown>)) {
      const idNum = Number(key);
      if (!Number.isFinite(idNum)) continue;
      if (typeof val === "string") {
        rooms.push({ id: idNum, name: val });
      } else if (val && typeof val === "object") {
        const obj = val as Record<string, unknown>;
        const name = String(obj.name ?? obj.room_name ?? `Room ${idNum}`);
        rooms.push({ id: idNum, name, icon: typeof obj.icon === "string" ? obj.icon : undefined });
      }
    }
  }

  // Automations / shortcuts mentioning the vacuum or belonging to same device
  const autoWords = new RegExp(`(${slug}|dreame|vacuum|hút bụi|lau nhà|dọn)`, "i");
  const schedules = Object.keys(hass.states)
    .filter((id) => {
      if (id.startsWith("automation.") && autoWords.test(`${id} ${String(hass.states[id]?.attributes.friendly_name ?? "")}`)) return true;
      if ((id.startsWith("button.") || id.startsWith("script.")) && siblingIds.includes(id) && /clean|shortcut|wash|empty|dry|mop/i.test(id)) return true;
      return false;
    })
    .slice(0, 8);

  return {
    vacuumId,
    deviceId,
    mapId,
    batteryId,
    cleanedAreaId,
    cleaningTimeId,
    cleaningCountId,
    taskStatusId,
    cleaningModeId,
    suctionLevelId,
    waterVolumeId,
    dockStatusId,
    dryingStatusId,
    cleanWaterId,
    dirtyWaterId,
    mopPadsId,
    autoEmptySwitchId,
    washMopsBtnId,
    emptyDustBtnId,
    dryMopsBtnId,
    consumables,
    rooms,
    schedules,
  };
}

function asDiscovered(hass: HomeAssistant, id: string): DiscoveredEntity {
  const st = hass.states[id];
  return {
    entity_id: id,
    domain: id.split(".")[0],
    name: String(st?.attributes.friendly_name ?? id),
    area_id: "",
    device_id: hass.entities?.[id]?.device_id ?? null,
    device_class: (st?.attributes.device_class as string | undefined) ?? null,
    icon: null,
  };
}

/** Wide / Bento Robot Card (inspired by Image 1: Live Map + Pill Controls + 4x2 Metrics Grid). */
export function VacuumExpandedTile({
  entity,
  hass,
  onOpenDetails,
  t,
}: {
  entity: DiscoveredEntity;
  hass: HomeAssistant;
  onOpenDetails: (target: DiscoveredEntity) => void;
  t: (key: TranslationKey) => string;
}) {
  const info = useMemo(() => discoverVacuumDevice(hass, entity.entity_id), [hass.states, hass.entities, entity.entity_id]);
  const state = hass.states[entity.entity_id];
  const mapState = info.mapId ? hass.states[info.mapId] : undefined;
  const mapTick = mapState?.last_updated ? (Date.parse(mapState.last_updated) || 0) : 0;
  const mapSrc = mapState ? cameraSnapshot(mapState, mapTick) : null;
  const actions = state ? vacuumActions(hass, state, t) : null;

  const batteryPct = readNum(hass, info.batteryId) ?? (typeof state?.attributes.battery_level === "number" ? state.attributes.battery_level : null);
  const fanSpeed = info.suctionLevelId ? hass.states[info.suctionLevelId]?.state : String(state?.attributes.fan_speed ?? "—");
  const countVal = formatStr(hass, info.cleaningCountId);

  const metrics: Array<{ label: string; value: string; warn?: boolean }> = [
    { label: t("currentState"), value: vacuumStatus(state, t) },
    { label: t("vehicleBattery"), value: batteryPct != null ? `${Math.round(batteryPct)}%` : "—" },
    { label: t("vacuumSuction"), value: String(fanSpeed || "—") },
    { label: info.consumables[3] ? t(info.consumables[3].labelKey) : t("vacuumSensorsLeft"), value: formatStr(hass, info.consumables[3]?.timeId ?? info.consumables[3]?.pctId) ?? "—" },
    { label: info.consumables[2] ? t(info.consumables[2].labelKey) : t("vacuumFilter"), value: formatStr(hass, info.consumables[2]?.timeId ?? info.consumables[2]?.pctId) ?? "—" },
    { label: info.consumables[0] ? t(info.consumables[0].labelKey) : t("vacuumMainBrush"), value: formatStr(hass, info.consumables[0]?.timeId ?? info.consumables[0]?.pctId) ?? "—" },
    { label: info.consumables[1] ? t(info.consumables[1].labelKey) : t("vacuumSideBrush"), value: formatStr(hass, info.consumables[1]?.timeId ?? info.consumables[1]?.pctId) ?? "—" },
    { label: t("vacuumLastRun"), value: countVal ?? formatStr(hass, info.cleanedAreaId) ?? "—" },
  ];

  return (
    <div className="hs-vac-tile">
      {mapSrc && (
        <div
          className="hs-vac-tile__map"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("HOMESMART-navigate", { detail: "vacuum" }));
          }}
          role="button"
          tabIndex={0}
        >
          <img alt={entity.name} src={mapSrc} />
          <span className="hs-vac-tile__map-badge">
            <HDIcon name="vacuum" size={13} />
            {entity.name}
          </span>
        </div>
      )}

      {actions && (
        <div className="hs-vac-tile__pills" onClick={(e) => e.stopPropagation()}>
          <button aria-label={actions.main.label} onClick={() => void actions.main.run()} title={actions.main.label} type="button">
            <HDIcon name={actions.main.icon} size={15} />
          </button>
          <button aria-label={actions.dock.label} onClick={() => void actions.dock.run()} title={actions.dock.label} type="button">
            <HDIcon name={actions.dock.icon} size={15} />
          </button>
          <button
            aria-label={t("vacuumLocate")}
            onClick={() => void hass.callService("vacuum", "locate", { entity_id: entity.entity_id })}
            title={t("vacuumLocate")}
            type="button"
          >
            <HDIcon name="pin" size={15} />
          </button>
          <button
            aria-label={t("noticeTapDetails")}
            onClick={() => onOpenDetails(entity)}
            title={t("noticeTapDetails")}
            type="button"
          >
            <HDIcon name="settings" size={14} />
          </button>
        </div>
      )}

      <div className="hs-vac-tile__stats" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("HOMESMART-navigate", { detail: "vacuum" })); }}>
        {metrics.map((m) => (
          <div className={`hs-vac-stat${m.warn ? " hs-vac-stat--warn" : ""}`} key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dedicated Full-Screen Dreame X40 Master Control Studio (inspired by Image 2). */
export function VacuumScreen(props: ScreenProps & { embedded?: boolean }) {
  const { config, data, hass, language, t } = props;
  const vacuums = useMemo(
    () =>
      data.rooms
        .flatMap((r) => r.entities)
        .filter((e, idx, arr) => e.domain === "vacuum" && arr.findIndex((x) => x.entity_id === e.entity_id) === idx),
    [data.rooms],
  );
  const [selectedVacId, setSelectedVacId] = useState<string>(() => vacuums[0]?.entity_id ?? "");
  const activeVacId = vacuums.some((v) => v.entity_id === selectedVacId) ? selectedVacId : (vacuums[0]?.entity_id ?? "");
  const info = useMemo(() => (activeVacId ? discoverVacuumDevice(hass, activeVacId) : null), [hass.states, hass.entities, activeVacId]);

  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [passes, setPasses] = useState<1 | 2>(1);
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const [busyCmd, setBusyCmd] = useState<string | null>(null);

  const state = activeVacId ? hass.states[activeVacId] : undefined;
  const actions = state ? vacuumActions(hass, state, t) : null;
  const batteryPct = info ? (readNum(hass, info.batteryId) ?? (typeof state?.attributes.battery_level === "number" ? state.attributes.battery_level : null)) : null;
  const charging = state?.state === "docked" && (batteryPct == null || batteryPct < 100);
  const mapState = info?.mapId ? hass.states[info.mapId] : undefined;
  const mapTick = mapState?.last_updated ? (Date.parse(mapState.last_updated) || 0) : 0;
  const mapSrc = mapState ? cameraSnapshot(mapState, mapTick) : null;

  useEffect(() => {
    setSelectedRooms([]);
  }, [activeVacId]);

  const runCmd = async (label: string, fn: () => Promise<unknown>) => {
    setBusyCmd(label);
    try {
      await fn();
    } finally {
      setBusyCmd(null);
    }
  };

  const toggleRoomPick = (id: number) => {
    setSelectedRooms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const cleanSelectedRooms = () => {
    if (!info || selectedRooms.length === 0) return;
    void runCmd("rooms", () =>
      hass.callService("dreame_vacuum", "vacuum_clean_segment", {
        entity_id: info.vacuumId,
        segments: selectedRooms,
        repeats: passes,
      }).catch(() =>
        hass.callService("vacuum", "send_command", {
          entity_id: info.vacuumId,
          command: "app_segment_clean",
          params: selectedRooms,
        }),
      ),
    );
  };

  const cleanModeState = info?.cleaningModeId ? hass.states[info.cleaningModeId] : undefined;
  const suctionState = info?.suctionLevelId ? hass.states[info.suctionLevelId] : undefined;
  const waterState = info?.waterVolumeId ? hass.states[info.waterVolumeId] : undefined;
  const fanSpeedOptions = suctionState
    ? selectOptions(suctionState)
    : Array.isArray(state?.attributes.fan_speed_list)
      ? state.attributes.fan_speed_list.map(String)
      : [];

  const body = (
    <section className="hs-vac-screen">
      <header className="hs-vac-header">
        <div>
          <span className="eyebrow">
            <span className={`hs-vac-dot${state?.state === "cleaning" ? " hs-vac-dot--clean" : ""}`} />
            {state ? vacuumStatus(state, t) : t("unavailable")}
            {info?.taskStatusId && formatStr(hass, info.taskStatusId) ? ` · ${formatStr(hass, info.taskStatusId)}` : ""}
          </span>
          <h1>{String(state?.attributes.friendly_name ?? "Dreame X40 Master")}</h1>
        </div>
        <div className="hs-vac-header__right">
          {vacuums.length > 1 && (
            <HDSelect
              ariaLabel={t("vacuumSelectRobot")}
              onChange={setSelectedVacId}
              options={vacuums.map((v) => ({ value: v.entity_id, label: v.name }))}
              value={activeVacId}
            />
          )}
          {batteryPct != null && (
            <div className="hs-vac-bat-ring" style={{ "--bat-pct": `${Math.round(batteryPct)}%` } as CSSProperties}>
              <svg viewBox="0 0 48 48">
                <circle className="hs-vac-bat-ring__track" cx="24" cy="24" r="20" />
                <circle
                  className="hs-vac-bat-ring__arc"
                  cx="24"
                  cy="24"
                  r="20"
                  strokeDasharray={`${(125.66 * (batteryPct / 100)).toFixed(1)} 125.66`}
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span>{Math.round(batteryPct)}%</span>
              {charging && <i className="hs-vac-bat-ring__bolt">⚡</i>}
            </div>
          )}
        </div>
      </header>

      {!info || !state ? (
        <section className="empty-state">
          <span className="empty-state__icon"><HDIcon name="vacuum" size={32} /></span>
          <h2>{t("vacuumTabTitle")}</h2>
          <p>{t("noVisibleEntities")}</p>
        </section>
      ) : (
        <div className="hs-vac-columns">
          {/* ─── Left Column: Dock Station, Consumables Care & Interactive Map + Rooms ─── */}
          <div className="hs-vac-col">
            <div className="hs-vac-panel hs-vac-dock-panel">
              <div className="hs-vac-dock-split">
                <div className="hs-vac-dock-art" aria-hidden="true">
                  <svg viewBox="0 0 120 140">
                    {/* Dreame X40 Master compact low-profile omni station SVG */}
                    <rect x="20" y="12" width="80" height="106" rx="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
                    <rect x="29" y="22" width="28" height="32" rx="6" fill="rgba(96,165,250,0.32)" stroke="rgba(96,165,250,0.65)" strokeWidth="1.5" />
                    <rect x="63" y="22" width="28" height="32" rx="6" fill="rgba(217,174,122,0.28)" stroke="rgba(217,174,122,0.55)" strokeWidth="1.5" />
                    <circle cx="60" cy="64" r="3" fill={state.state === "cleaning" ? "#fbbf24" : "#34d399"} />
                    <path d="M 32 118 L 32 82 A 28 28 0 0 1 88 82 L 88 118 Z" fill="rgba(0,0,0,0.32)" />
                    <ellipse cx="60" cy="108" rx="22" ry="12" fill="rgba(255,255,255,0.9)" />
                    <circle cx="60" cy="105" r="7" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
                    <rect x="10" y="120" width="100" height="8" rx="4" fill="rgba(255,255,255,0.16)" />
                  </svg>
                </div>

                <div className="hs-vac-dock-info">
                  <span className="eyebrow">{t("vacuumDockTitle")}</span>
                  <div className="hs-vac-pills">
                    <span className="hs-vac-pill hs-vac-pill--ok">🏠 Dock {formatStr(hass, info.dockStatusId) ?? t("vacuumOk")}</span>
                    {info.dryingStatusId && (
                      <span className="hs-vac-pill">💨 {formatStr(hass, info.dryingStatusId) ?? t("vacuumMopsDry")}</span>
                    )}
                    {info.cleanWaterId && (
                      <span className="hs-vac-pill">💧 {t("vacuumCleanWater")}: {formatStr(hass, info.cleanWaterId) ?? t("vacuumOk")}</span>
                    )}
                    {info.dirtyWaterId && (
                      <span className="hs-vac-pill">🪣 {t("vacuumDirtyWater")}: {formatStr(hass, info.dirtyWaterId) ?? t("vacuumOk")}</span>
                    )}
                    {info.mopPadsId && (
                      <span className="hs-vac-pill">🫧 {t("vacuumMopPads")}: {hass.states[info.mopPadsId]?.state === "on" || hass.states[info.mopPadsId]?.state === "installed" ? t("vacuumFitted") : (formatStr(hass, info.mopPadsId) ?? t("vacuumFitted"))}</span>
                    )}
                  </div>

                  {info.consumables.length > 0 && (
                    <>
                      <span className="eyebrow" style={{ marginTop: 10 }}>{t("vacuumCareTitle")}</span>
                      <div className="hs-vac-care-grid">
                        {info.consumables.map((c) => {
                          const pct = readNum(hass, c.pctId) ?? 100;
                          const color = pct <= 15 ? "#ef4444" : pct <= 40 ? "#f59e0b" : "#34d399";
                          const hoursText = formatStr(hass, c.timeId) ?? `${Math.round(pct)}%`;
                          return (
                            <button
                              className="hs-vac-care-item"
                              key={c.key}
                              onClick={() => setModalEntity(asDiscovered(hass, c.pctId ?? c.timeId!))}
                              type="button"
                            >
                              <div className="hs-vac-care-ring">
                                <svg viewBox="0 0 40 40">
                                  <circle className="hs-vac-care-ring__track" cx="20" cy="20" r="16" />
                                  <circle
                                    cx="20"
                                    cy="20"
                                    fill="none"
                                    r="16"
                                    stroke={color}
                                    strokeDasharray={`${(100.53 * Math.max(0, Math.min(1, pct / 100))).toFixed(1)} 100.53`}
                                    strokeLinecap="round"
                                    strokeWidth="3.2"
                                    transform="rotate(-90 20 20)"
                                  />
                                </svg>
                                <span>{Math.round(pct)}%</span>
                              </div>
                              <b>{t(c.labelKey)}</b>
                              <small>{hoursText}</small>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hs-vac-panel hs-vac-map-panel">
              <div className="hs-vac-map-head">
                <span className="eyebrow">{t("vacuumRoomsTitle")}</span>
                <div className="hs-vac-map-tools">
                  <button
                    className={`hd-pill${passes === 2 ? " hd-pill--on" : ""}`}
                    onClick={() => setPasses((p) => (p === 1 ? 2 : 1))}
                    type="button"
                  >
                    {t("vacuumRepeats")}: ×{passes}
                  </button>
                  {selectedRooms.length > 0 && (
                    <button className="hd-pill hd-pill--solid" disabled={busyCmd !== null} onClick={cleanSelectedRooms} type="button">
                      ▶ {t("vacuumCleanRooms")} ({selectedRooms.length})
                    </button>
                  )}
                </div>
              </div>

              {info.rooms.length > 0 ? (
                <div className="hs-vac-room-chips">
                  {info.rooms.map((rm) => {
                    const picked = selectedRooms.includes(rm.id);
                    return (
                      <button
                        aria-pressed={picked}
                        className={`hs-vac-room-chip${picked ? " hs-vac-room-chip--on" : ""}`}
                        key={rm.id}
                        onClick={() => toggleRoomPick(rm.id)}
                        type="button"
                      >
                        {rm.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="hs-vac-hint">{t("vacuumNoRoomsFound")}</p>
              )}

              {mapSrc && (
                <div className="hs-vac-live-map" onClick={() => info.mapId && setModalEntity(asDiscovered(hass, info.mapId))} role="button" tabIndex={0}>
                  <img alt="Dreame Map" src={mapSrc} />
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column: Primary Commands, Stats, Clean Mode, Suction & Schedules ─── */}
          <div className="hs-vac-col">
            <div className="hs-vac-panel">
              <div className="hs-vac-primary-actions">
                {actions && (
                  <button
                    className="hs-vac-action hs-vac-action--primary"
                    disabled={busyCmd !== null}
                    onClick={() => void runCmd("main", actions.main.run)}
                    type="button"
                  >
                    <HDIcon name={actions.main.icon} size={18} />
                    <span>{state.state === "cleaning" ? t("vacuumPause") : t("vacuumCleanAll")}</span>
                  </button>
                )}
                {actions && (
                  <button className="hs-vac-action" disabled={busyCmd !== null} onClick={() => void runCmd("dock", actions.dock.run)} type="button">
                    <HDIcon name="home" size={18} />
                    <span>{t("vacuumDock")}</span>
                  </button>
                )}
                <button
                  className="hs-vac-action"
                  disabled={busyCmd !== null}
                  onClick={() => void runCmd("locate", () => hass.callService("vacuum", "locate", { entity_id: info.vacuumId }))}
                  type="button"
                >
                  <HDIcon name="pin" size={18} />
                  <span>{t("vacuumLocate")}</span>
                </button>
              </div>

              {(info.washMopsBtnId || info.emptyDustBtnId) && (
                <div className="hs-vac-dock-cmds">
                  {info.washMopsBtnId && (
                    <button
                      className="hd-pill"
                      onClick={() => void runCmd("wash", () => hass.callService("button", "press", { entity_id: info.washMopsBtnId! }))}
                      type="button"
                    >
                      🫧 {t("vacuumWashMops")}
                    </button>
                  )}
                  {info.emptyDustBtnId && (
                    <button
                      className="hd-pill"
                      onClick={() => void runCmd("empty", () => hass.callService("button", "press", { entity_id: info.emptyDustBtnId! }))}
                      type="button"
                    >
                      💨 {t("vacuumEmptyDust")}
                    </button>
                  )}
                  {info.dryMopsBtnId && info.dryMopsBtnId.startsWith("button.") && (
                    <button
                      className="hd-pill"
                      onClick={() => void runCmd("dry", () => hass.callService("button", "press", { entity_id: info.dryMopsBtnId! }))}
                      type="button"
                    >
                      ☀️ {t("vacuumMopDrying")}
                    </button>
                  )}
                </div>
              )}

              <div className="hs-vac-telemetry-3">
                <div className="hs-vac-tele-box">
                  <small>{t("vacuumArea")}</small>
                  <strong>{formatStr(hass, info.cleanedAreaId) ?? "—"}</strong>
                </div>
                <div className="hs-vac-tele-box">
                  <small>{t("vacuumTime")}</small>
                  <strong>{formatStr(hass, info.cleaningTimeId) ?? "—"}</strong>
                </div>
                <div className="hs-vac-tele-box">
                  <small>{t("vacuumLastRun")}</small>
                  <strong>{formatStr(hass, info.cleaningCountId) ?? "—"}</strong>
                </div>
              </div>
            </div>

            {(cleanModeState || fanSpeedOptions.length > 0 || waterState) && (
              <div className="hs-vac-panel hs-vac-modes">
                {cleanModeState && (
                  <div className="hs-vac-mode-block">
                    <span className="eyebrow">{t("vacuumCleanWith")}</span>
                    <HDSegmented
                      ariaLabel={t("vacuumCleanWith")}
                      onChange={(opt) => void selectOption(hass, info.cleaningModeId!, opt)}
                      options={selectOptions(cleanModeState).map((o) => ({ value: o, label: o }))}
                      value={cleanModeState.state}
                    />
                  </div>
                )}

                {fanSpeedOptions.length > 0 && (
                  <div className="hs-vac-mode-block">
                    <span className="eyebrow">{t("vacuumSuction")}</span>
                    <HDSegmented
                      ariaLabel={t("vacuumSuction")}
                      onChange={(opt) =>
                        info.suctionLevelId
                          ? void selectOption(hass, info.suctionLevelId, opt)
                          : void hass.callService("vacuum", "set_fan_speed", { entity_id: info.vacuumId, fan_speed: opt })
                      }
                      options={fanSpeedOptions.map((o) => ({ value: o, label: o }))}
                      value={suctionState ? suctionState.state : String(state.attributes.fan_speed ?? "")}
                    />
                  </div>
                )}

                {waterState && (
                  <div className="hs-vac-mode-block">
                    <span className="eyebrow">{t("vacuumWaterFlow")}</span>
                    <HDSegmented
                      ariaLabel={t("vacuumWaterFlow")}
                      onChange={(opt) => void selectOption(hass, info.waterVolumeId!, opt)}
                      options={selectOptions(waterState).map((o) => ({ value: o, label: o }))}
                      value={waterState.state}
                    />
                  </div>
                )}
              </div>
            )}

            {(info.schedules.length > 0 || info.autoEmptySwitchId) && (
              <div className="hs-vac-panel">
                <span className="eyebrow">{t("vacuumSchedulesTitle")}</span>
                <div className="hs-vac-schedules">
                  {info.autoEmptySwitchId && hass.states[info.autoEmptySwitchId] && (
                    <label className="hs-vac-schedule-row">
                      <span>{String(hass.states[info.autoEmptySwitchId].attributes.friendly_name ?? t("vacuumEmptyDust"))}</span>
                      <input
                        checked={hass.states[info.autoEmptySwitchId].state === "on"}
                        className="st-switch"
                        onChange={() => void hass.callService("switch", "toggle", { entity_id: info.autoEmptySwitchId! })}
                        type="checkbox"
                      />
                    </label>
                  )}
                  {info.schedules.map((sid) => {
                    const st = hass.states[sid];
                    if (!st) return null;
                    const isAuto = sid.startsWith("automation.");
                    return (
                      <div className="hs-vac-schedule-row" key={sid}>
                        <span>{String(st.attributes.friendly_name ?? sid)}</span>
                        {isAuto ? (
                          <input
                            checked={st.state === "on"}
                            className="st-switch"
                            onChange={() => void hass.callService("automation", "toggle", { entity_id: sid })}
                            type="checkbox"
                          />
                        ) : (
                          <button
                            className="hd-pill"
                            onClick={() => void hass.callService(sid.startsWith("script.") ? "script" : "button", sid.startsWith("script.") ? "turn_on" : "press", { entity_id: sid })}
                            type="button"
                          >
                            <HDIcon name="play" size={12} />
                            {t("runScript")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modalEntity && (
        <EntityModal
          entity={modalEntity}
          hass={hass}
          language={language}
          onClose={() => setModalEntity(null)}
          t={t}
        />
      )}
    </section>
  );

  if (props.embedded) return body;
  return (
    <main className="screen vacuum-screen">
      <ContextHeader config={config} hass={hass} language={language} onSettings={props.onSettings} t={t} />
      {body}
    </main>
  );
}

export const VACUUM_STUDIO_CSS = String.raw`
/* ─── Expanded Vacuum Card (Image 1 style) ─── */
.hs-vac-tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}
.hs-vac-tile__map {
  position: relative;
  border-radius: calc(var(--u, 8px) * 1.8 * var(--hd-r, 1));
  overflow: hidden;
  background: rgba(15, 35, 66, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  flex: 1 1 110px;
  min-height: 92px;
  cursor: pointer;
}
.hs-vac-tile__map img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hs-vac-tile__map-badge {
  position: absolute;
  left: 8px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
}
.hs-vac-tile__pills {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.hs-vac-tile__pills button {
  flex: 1;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.hs-vac-tile__pills button:hover {
  background: rgba(255, 255, 255, 0.24);
}
.hs-vac-tile__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  cursor: pointer;
}
.hs-vac-stat {
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.09);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.hs-vac-stat small {
  font-size: 10px;
  opacity: 0.68;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-vac-stat strong {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Full Dreame Vacuum Studio Tab (Image 2 style) ─── */
.hs-vac-screen {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 2);
}
.hs-vac-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}
.hs-vac-header h1 {
  margin: 4px 0 0;
  font: 400 calc(var(--u, 8px) * 3.4) / 1.1 var(--f-display);
  color: var(--ink);
}
.hs-vac-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  margin-right: 7px;
  vertical-align: middle;
}
.hs-vac-dot--clean {
  background: #fbbf24;
  box-shadow: 0 0 8px #fbbf24;
}
.hs-vac-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hs-vac-bat-ring {
  position: relative;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
}
.hs-vac-bat-ring svg {
  width: 52px;
  height: 52px;
}
.hs-vac-bat-ring__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 4;
}
.hs-vac-bat-ring__arc {
  fill: none;
  stroke: #34d399;
  stroke-width: 4;
  stroke-linecap: round;
}
.hs-vac-bat-ring span {
  position: absolute;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hs-vac-bat-ring__bolt {
  position: absolute;
  right: -2px;
  bottom: -2px;
  font-size: 12px;
  font-style: normal;
}
.hs-vac-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: calc(var(--u, 8px) * 2);
  align-items: start;
}
.hs-vac-col {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 2);
}
.hs-vac-panel {
  padding: calc(var(--u, 8px) * 2.2);
  border-radius: calc(var(--u, 8px) * 3 * var(--hd-r, 1));
  background: var(--glass, rgba(255, 255, 255, 0.14));
  border: 1px solid var(--hd-frame, var(--line, rgba(255, 255, 255, 0.2)));
  backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hs-vac-dock-split {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}
.hs-vac-dock-art svg {
  width: 100%;
  height: auto;
  display: block;
}
.hs-vac-dock-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.hs-vac-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hs-vac-pill {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
  font-weight: 500;
}
.hs-vac-pill--ok {
  border-color: rgba(52, 211, 153, 0.4);
  background: rgba(52, 211, 153, 0.14);
}
.hs-vac-care-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
  gap: 8px;
}
.hs-vac-care-item {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: inherit;
  cursor: pointer;
  text-align: center;
}
.hs-vac-care-item:hover {
  background: rgba(255, 255, 255, 0.11);
}
.hs-vac-care-item b {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}
.hs-vac-care-item small {
  font-size: 10.5px;
  opacity: 0.72;
}
.hs-vac-care-ring {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
}
.hs-vac-care-ring svg {
  width: 40px;
  height: 40px;
}
.hs-vac-care-ring__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 3.2;
}
.hs-vac-care-ring span {
  position: absolute;
  font-size: 10px;
  font-weight: 700;
}
.hs-vac-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.hs-vac-map-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.hs-vac-room-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.hs-vac-room-chip {
  padding: 7px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.hs-vac-room-chip--on {
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
}
.hs-vac-hint {
  margin: 0;
  font-size: 12.5px;
  opacity: 0.7;
}
.hs-vac-live-map {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(12, 26, 52, 0.65);
  cursor: pointer;
}
.hs-vac-live-map img {
  width: 100%;
  max-height: 290px;
  object-fit: contain;
  display: block;
}
.hs-vac-primary-actions {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 10px;
}
.hs-vac-action {
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.09);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}
.hs-vac-action--primary {
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
}
.hs-vac-dock-cmds {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hs-vac-telemetry-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.hs-vac-tele-box {
  padding: 11px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.09);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hs-vac-tele-box small {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.65;
}
.hs-vac-tele-box strong {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hs-vac-modes {
  gap: 14px;
}
.hs-vac-mode-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.hs-vac-schedules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hs-vac-schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

/* ─── Multi-Sensor Container Styles (EntityList v2.1) ─── */
.app-shell .hd-elist__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.app-shell .hd-elist__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.16);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #6ee7b7;
}
.app-shell .hd-elist__tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  flex: 1;
  align-content: center;
}
.app-shell .hd-elist__tiles--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.app-shell .hd-elist-tile {
  padding: 10px 12px;
  border-radius: calc(var(--u, 8px) * 1.8 * var(--hd-r, 1));
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: inherit;
  cursor: pointer;
  min-width: 0;
  text-align: center;
}
.app-shell .hd-elist-tile:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}
.app-shell .hd-elist-tile__head {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  max-width: 100%;
}
.app-shell .hd-elist-tile__head span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-shell .hd-elist-tile__value {
  font-size: calc(var(--u, 8px) * 2.1);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}
.app-shell .hd-elist__rings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
  gap: 8px;
  flex: 1;
  align-content: center;
}
.app-shell .hd-elist-ring {
  padding: 8px 4px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: inherit;
  cursor: pointer;
}
.app-shell .hd-elist-ring__svg-wrap {
  position: relative;
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
}
.app-shell .hd-elist-ring__svg-wrap svg {
  width: 54px;
  height: 54px;
}
.app-shell .hd-elist-ring__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 4;
}
.app-shell .hd-elist-ring__arc {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}
.app-shell .hd-elist-ring__val {
  position: absolute;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.app-shell .hd-elist-ring__name {
  font-size: 11px;
  font-weight: 600;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-shell .hd-elist__hero-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.app-shell .hd-elist-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.app-shell .hd-elist-hero__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: none;
}
.app-shell .hd-elist-hero__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-shell .hd-elist-hero__copy small {
  font-size: 11.5px;
  opacity: 0.72;
}
.app-shell .hd-elist-hero__copy strong {
  font-size: calc(var(--u, 8px) * 2.3);
  font-weight: 700;
}
.app-shell .hd-elist-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.app-shell .hd-elist-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 11.5px;
  color: inherit;
  cursor: pointer;
}
.app-shell .hd-elist__rows--2col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 10px;
}
.hd-elist-editor__row-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.hd-elist-editor__colors {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 4px;
}
.hs-color-swatch--sm {
  width: 20px !important;
  height: 20px !important;
}

@media (max-width: 900px) {
  .hs-vac-columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .hs-vac-dock-split {
    grid-template-columns: 1fr;
  }
  .hs-vac-dock-art {
    max-width: 110px;
    margin: 0 auto;
  }
  .hs-vac-tile__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .hs-vac-primary-actions {
    grid-template-columns: 1fr;
  }
  .app-shell .hd-elist__rows--2col {
    grid-template-columns: 1fr;
  }
}
`;
