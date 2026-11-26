import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { cameraSnapshot, selectOption, selectOptions, vacuumActions, vacuumStatus } from "../devices";
import type { TranslationKey } from "../i18n";
import type { ScreenProps } from "../screens/types";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { ContextHeader } from "./ContextHeader";
import { useTallTile } from "./EditableGrid";
import { EntityModal } from "./EntityModal";
import { HDIcon, type IconName } from "./HDIcon";
import { HDSelect } from "./HDSelect";

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

function isValidState(raw?: string | null): boolean {
  if (!raw) return false;
  const low = raw.trim().toLowerCase();
  return low !== "" && low !== "unavailable" && low !== "unknown" && low !== "none";
}

function formatStr(hass: HomeAssistant, id?: string): string | null {
  if (!id) return null;
  const st = hass.states[id];
  if (!st || !isValidState(st.state)) return null;
  const unit = typeof st.attributes.unit_of_measurement === "string" ? st.attributes.unit_of_measurement : "";
  return unit ? `${st.state} ${unit}` : st.state.replaceAll("_", " ");
}

function resolveFanSpeed(hass: HomeAssistant, state: HassEntity | undefined, suctionLevelId?: string): string {
  const fromSelect = formatStr(hass, suctionLevelId);
  if (fromSelect) return fromSelect;
  const attr = state?.attributes?.fan_speed;
  if (typeof attr === "string" && isValidState(attr)) return attr.replaceAll("_", " ");
  return "—";
}

function optionIcon(label: string, group: "mode" | "suction" | "water"): IconName {
  const s = label.toLowerCase();
  if (group === "water") return "drop";
  if (group === "mode") {
    if (/vac.*mop|hút.*lau|sweep.*mop/.test(s)) return "bolt";
    if (/mop|lau/.test(s) && !/vac|hút/.test(s)) return "drop";
    if (/custom|tùy/.test(s)) return "settings";
    return "vacuum";
  }
  if (/quiet|yên|silent|im/.test(s)) return "moon";
  if (/standard|balanced|tiêu|vừa/.test(s)) return "wind";
  if (/turbo|strong|mạnh/.test(s)) return "fan";
  if (/max|tối đa|ultra/.test(s)) return "power";
  return "fan";
}

export function discoverVacuumDevice(hass: HomeAssistant, vacuumId: string): VacuumDiscovery {
  const vacState = hass.states[vacuumId];
  const deviceId = hass.entities?.[vacuumId]?.device_id ?? null;
  const slug = vacuumId.replace(/^vacuum\./, "").toLowerCase();

  const stateIds = Object.keys(hass.states);
  const sameDevice = deviceId ? stateIds.filter((id) => hass.entities?.[id]?.device_id === deviceId) : [];
  const byName = stateIds.filter((id) => {
    if (hass.entities?.[id]?.device_id) return false;
    const objectId = id.split(".")[1]?.toLowerCase() ?? "";
    return slug.length > 3 && (objectId === slug || objectId.startsWith(`${slug}_`));
  });
  const siblingIds = [...sameDevice, ...byName];

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

/** Lightweight status summary for 1x vacuum cards on Home / Room / Custom tabs. */
export function getVacuumMiniStats(
  hass: HomeAssistant,
  vacuumId: string,
): { batteryPct: number | null; charging: boolean; subline: string | null } {
  const info = discoverVacuumDevice(hass, vacuumId);
  const state = hass.states[vacuumId];
  const batteryPct =
    readNum(hass, info.batteryId) ??
    (typeof state?.attributes.battery_level === "number" ? state.attributes.battery_level : null);
  const charging = state?.state === "docked" && (batteryPct == null || batteryPct < 100);
  const area = formatStr(hass, info.cleanedAreaId);
  const time = formatStr(hass, info.cleaningTimeId);
  const fan = resolveFanSpeed(hass, state, info.suctionLevelId);
  const parts = [area, time, fan !== "—" ? fan : null].filter(Boolean).slice(0, 2);
  return {
    batteryPct,
    charging,
    subline: parts.length > 0 ? parts.join(" · ") : null,
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

/** Wide / Tall Bento Robot Card (2x1 Horizontal Split or 2x2 Vertical Map Studio). */
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
  const tall = useTallTile();
  const info = useMemo(() => discoverVacuumDevice(hass, entity.entity_id), [hass.states, hass.entities, entity.entity_id]);
  const state = hass.states[entity.entity_id];
  const mapState = info.mapId ? hass.states[info.mapId] : undefined;
  const mapTick = mapState?.last_updated ? (Date.parse(mapState.last_updated) || 0) : 0;
  const mapSrc = mapState ? cameraSnapshot(mapState, mapTick) : null;
  const actions = state ? vacuumActions(hass, state, t) : null;

  const batteryPct = readNum(hass, info.batteryId) ?? (typeof state?.attributes.battery_level === "number" ? state.attributes.battery_level : null);
  const charging = state?.state === "docked" && (batteryPct == null || batteryPct < 100);
  const fanSpeed = resolveFanSpeed(hass, state, info.suctionLevelId);
  const countVal = formatStr(hass, info.cleaningCountId);
  const statusText = vacuumStatus(state, t);

  const metrics: Array<{ label: string; value: string; warn?: boolean }> = tall
    ? [
        { label: t("currentState"), value: statusText },
        { label: t("vehicleBattery"), value: batteryPct != null ? `${Math.round(batteryPct)}%` : "—" },
        { label: t("vacuumSuction"), value: fanSpeed },
        { label: info.consumables[3] ? t(info.consumables[3].labelKey) : t("vacuumSensorsLeft"), value: formatStr(hass, info.consumables[3]?.timeId ?? info.consumables[3]?.pctId) ?? "—" },
        { label: info.consumables[2] ? t(info.consumables[2].labelKey) : t("vacuumFilter"), value: formatStr(hass, info.consumables[2]?.timeId ?? info.consumables[2]?.pctId) ?? "—" },
        { label: info.consumables[0] ? t(info.consumables[0].labelKey) : t("vacuumMainBrush"), value: formatStr(hass, info.consumables[0]?.timeId ?? info.consumables[0]?.pctId) ?? "—" },
        { label: info.consumables[1] ? t(info.consumables[1].labelKey) : t("vacuumSideBrush"), value: formatStr(hass, info.consumables[1]?.timeId ?? info.consumables[1]?.pctId) ?? "—" },
        { label: t("vacuumLastRun"), value: countVal ?? formatStr(hass, info.cleanedAreaId) ?? "—" },
      ]
    : [
        { label: t("vehicleBattery"), value: batteryPct != null ? `${Math.round(batteryPct)}%` : "—" },
        { label: t("vacuumSuction"), value: fanSpeed },
        { label: info.consumables[3] ? t(info.consumables[3].labelKey) : t("vacuumSensorsLeft"), value: formatStr(hass, info.consumables[3]?.timeId ?? info.consumables[3]?.pctId) ?? "—" },
        { label: info.consumables[2] ? t(info.consumables[2].labelKey) : t("vacuumFilter"), value: formatStr(hass, info.consumables[2]?.timeId ?? info.consumables[2]?.pctId) ?? "—" },
        { label: info.consumables[0] ? t(info.consumables[0].labelKey) : t("vacuumMainBrush"), value: formatStr(hass, info.consumables[0]?.timeId ?? info.consumables[0]?.pctId) ?? "—" },
        { label: t("vacuumLastRun"), value: countVal ?? formatStr(hass, info.cleanedAreaId) ?? "—" },
      ];

  const openStudio = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("HOMESMART-navigate", { detail: "vacuum" }));
  };

  const mapCard = (
    <div
      className="hs-vac-tile__map"
      onClick={openStudio}
      role="button"
      tabIndex={0}
    >
      {mapSrc ? (
        <img alt={entity.name} src={mapSrc} />
      ) : (
        <div className="hs-vac-tile__map-fallback">
          <HDIcon name="vacuum" size={38} />
          <span>{statusText}</span>
        </div>
      )}
      <span className="hs-vac-tile__map-badge">
        <HDIcon name="vacuum" size={14} />
        {entity.name}
      </span>
      {batteryPct != null && (
        <span className={`hs-vac-tile__bat-badge${batteryPct <= 20 ? " hs-vac-tile__bat-badge--low" : ""}`}>
          {charging ? "⚡ " : ""}
          {Math.round(batteryPct)}%
        </span>
      )}
    </div>
  );

  const actionPills = actions && (
    <div className="hs-vac-tile__pills" onClick={(e) => e.stopPropagation()}>
      <button className="hs-vac-tile__pill-main" aria-label={actions.main.label} onClick={() => void actions.main.run()} title={actions.main.label} type="button">
        <HDIcon name={actions.main.icon} size={16} />
      </button>
      <button aria-label={actions.dock.label} onClick={() => void actions.dock.run()} title={actions.dock.label} type="button">
        <HDIcon name={actions.dock.icon} size={16} />
      </button>
      <button
        aria-label={t("vacuumLocate")}
        onClick={() => void hass.callService("vacuum", "locate", { entity_id: entity.entity_id })}
        title={t("vacuumLocate")}
        type="button"
      >
        <HDIcon name="pin" size={16} />
      </button>
      <button
        aria-label={t("noticeTapDetails")}
        onClick={() => onOpenDetails(entity)}
        title={t("noticeTapDetails")}
        type="button"
      >
        <HDIcon name="settings" size={15} />
      </button>
    </div>
  );

  if (tall) {
    return (
      <div className="hs-vac-tile hs-vac-tile--tall">
        {mapCard}
        <div className="hs-vac-tile__tall-bar">
          <div className="hs-vac-tile__status-line" onClick={openStudio}>
            <span className={`hs-vac-dot${state?.state === "cleaning" ? " hs-vac-dot--clean" : ""}`} />
            <strong>{statusText}</strong>
            {formatStr(hass, info.cleanedAreaId) && <small>· {formatStr(hass, info.cleanedAreaId)}</small>}
          </div>
          {actionPills}
        </div>
        <div className="hs-vac-tile__stats hs-vac-tile__stats--tall" onClick={openStudio}>
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

  return (
    <div className="hs-vac-tile hs-vac-tile--wide">
      {mapCard}
      <div className="hs-vac-tile__right">
        <div className="hs-vac-tile__right-head">
          <div className="hs-vac-tile__status-line" onClick={openStudio}>
            <span className={`hs-vac-dot${state?.state === "cleaning" ? " hs-vac-dot--clean" : ""}`} />
            <strong>{statusText}</strong>
          </div>
          {actionPills}
        </div>
        <div className="hs-vac-tile__stats hs-vac-tile__stats--wide" onClick={openStudio}>
          {metrics.map((m) => (
            <div className={`hs-vac-stat${m.warn ? " hs-vac-stat--warn" : ""}`} key={m.label}>
              <small>{m.label}</small>
              <strong>{m.value}</strong>
            </div>
          ))}
        </div>
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
  const activeFanSpeed =
    (suctionState && isValidState(suctionState.state) ? suctionState.state : null) ??
    (typeof state?.attributes.fan_speed === "string" && isValidState(state.attributes.fan_speed) ? state.attributes.fan_speed : "");

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
          <span className="empty-state__icon"><HDIcon name="vacuum" size={36} /></span>
          <h2>{t("vacuumTabTitle")}</h2>
          <p>{t("noVisibleEntities")}</p>
        </section>
      ) : (
        <div className="hs-vac-columns">
          {/* ─── Left Column: Dock Station + Care Rings + Interactive Rooms & Map ─── */}
          <div className="hs-vac-col">
            <div className="hs-vac-panel hs-vac-dock-panel">
              <div className="hs-vac-dock-split">
                <div className="hs-vac-dock-art">
                  <button
                    className="hs-vac-name-badge"
                    onClick={() => setModalEntity(asDiscovered(hass, info.vacuumId))}
                    type="button"
                  >
                    <span className="hs-vac-dot" />
                    <span>{String(state.attributes.friendly_name ?? "Robot")}</span>
                    <HDIcon name="pencil" size={13} />
                  </button>
                  <svg aria-hidden="true" viewBox="0 0 120 140">
                    {/* Dreame X40 Master compact low-profile omni station SVG */}
                    <rect x="18" y="10" width="84" height="108" rx="16" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.32)" strokeWidth="2.2" />
                    <rect x="27" y="21" width="30" height="35" rx="7" fill="rgba(56,189,248,0.36)" stroke="rgba(56,189,248,0.75)" strokeWidth="1.6" />
                    <rect x="63" y="21" width="30" height="35" rx="7" fill="rgba(217,174,122,0.32)" stroke="rgba(217,174,122,0.65)" strokeWidth="1.6" />
                    <circle cx="60" cy="65" r="3.5" fill={state.state === "cleaning" ? "#fbbf24" : "#34d399"} />
                    <path d="M 30 118 L 30 82 A 30 30 0 0 1 90 82 L 90 118 Z" fill="rgba(0,0,0,0.36)" />
                    <ellipse cx="60" cy="108" rx="23" ry="12.5" fill="rgba(255,255,255,0.92)" />
                    <circle cx="60" cy="105" r="7.5" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.8" />
                    <rect x="10" y="120" width="100" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
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
                </div>
              </div>

              {info.consumables.length > 0 && (
                <div className="hs-vac-care-wrap">
                  <span className="eyebrow">{t("vacuumCareTitle")}</span>
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
                            <svg viewBox="0 0 44 44">
                              <circle className="hs-vac-care-ring__track" cx="22" cy="22" r="18" />
                              <circle
                                cx="22"
                                cy="22"
                                fill="none"
                                r="18"
                                stroke={color}
                                strokeDasharray={`${(113.1 * Math.max(0, Math.min(1, pct / 100))).toFixed(1)} 113.1`}
                                strokeLinecap="round"
                                strokeWidth="3.6"
                                transform="rotate(-90 22 22)"
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
                </div>
              )}
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
                </div>
              </div>

              {info.rooms.length > 0 ? (
                <>
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
                          <HDIcon name="home" size={16} />
                          <span>{rm.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className={`hs-vac-clean-rooms-bar${selectedRooms.length > 0 ? " hs-vac-clean-rooms-bar--ready" : ""}`}
                    disabled={selectedRooms.length === 0 || busyCmd !== null}
                    onClick={cleanSelectedRooms}
                    type="button"
                  >
                    <HDIcon name={selectedRooms.length > 0 ? "play" : "pin"} size={17} />
                    <span>
                      {selectedRooms.length > 0
                        ? `${t("vacuumCleanRooms")} (${selectedRooms.length})`
                        : t("vacuumCleanRooms")}
                    </span>
                  </button>
                </>
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

          {/* ─── Right Column: Primary Commands, Stats, Visual Mode Selectors & Schedules ─── */}
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
                    <HDIcon name={actions.main.icon} size={20} />
                    <span>{state.state === "cleaning" ? t("vacuumPause") : t("vacuumCleanAll")}</span>
                  </button>
                )}
                {actions && (
                  <button className="hs-vac-action" disabled={busyCmd !== null} onClick={() => void runCmd("dock", actions.dock.run)} type="button">
                    <HDIcon name="home" size={20} />
                    <span>{t("vacuumDock")}</span>
                  </button>
                )}
                <button
                  className="hs-vac-action"
                  disabled={busyCmd !== null}
                  onClick={() => void runCmd("locate", () => hass.callService("vacuum", "locate", { entity_id: info.vacuumId }))}
                  type="button"
                >
                  <HDIcon name="pin" size={20} />
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
                    <div className="hs-vac-seg-grid" role="radiogroup" aria-label={t("vacuumCleanWith")}>
                      {selectOptions(cleanModeState).map((opt) => {
                        const on = cleanModeState.state === opt;
                        return (
                          <button
                            aria-checked={on}
                            className={`hs-vac-seg-btn${on ? " hs-vac-seg-btn--on" : ""}`}
                            key={opt}
                            onClick={() => void selectOption(hass, info.cleaningModeId!, opt)}
                            role="radio"
                            type="button"
                          >
                            <HDIcon name={optionIcon(opt, "mode")} size={19} />
                            <span>{opt.replaceAll("_", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {fanSpeedOptions.length > 0 && (
                  <div className="hs-vac-mode-block">
                    <span className="eyebrow">{t("vacuumSuction")}</span>
                    <div className="hs-vac-seg-grid" role="radiogroup" aria-label={t("vacuumSuction")}>
                      {fanSpeedOptions.map((opt) => {
                        const on = activeFanSpeed === opt;
                        return (
                          <button
                            aria-checked={on}
                            className={`hs-vac-seg-btn${on ? " hs-vac-seg-btn--on" : ""}`}
                            key={opt}
                            onClick={() =>
                              info.suctionLevelId
                                ? void selectOption(hass, info.suctionLevelId, opt)
                                : void hass.callService("vacuum", "set_fan_speed", { entity_id: info.vacuumId, fan_speed: opt })
                            }
                            role="radio"
                            type="button"
                          >
                            <HDIcon name={optionIcon(opt, "suction")} size={19} />
                            <span>{opt.replaceAll("_", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {waterState && (
                  <div className="hs-vac-mode-block">
                    <span className="eyebrow">{t("vacuumWaterFlow")}</span>
                    <div className="hs-vac-seg-grid" role="radiogroup" aria-label={t("vacuumWaterFlow")}>
                      {selectOptions(waterState).map((opt) => {
                        const on = waterState.state === opt;
                        return (
                          <button
                            aria-checked={on}
                            className={`hs-vac-seg-btn${on ? " hs-vac-seg-btn--on" : ""}`}
                            key={opt}
                            onClick={() => void selectOption(hass, info.waterVolumeId!, opt)}
                            role="radio"
                            type="button"
                          >
                            <HDIcon name={optionIcon(opt, "water")} size={19} />
                            <span>{opt.replaceAll("_", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
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
                            <HDIcon name="play" size={14} />
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
/* ─── 1x Vacuum Compact Card Upgrades ─── */
.app-shell .hs-vac-mini-bat {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.35);
  padding: calc(var(--u, 8px) * 0.35) calc(var(--u, 8px) * 0.9);
  border-radius: 999px;
  font-size: calc(var(--u, 8px) * 1.45);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--ink, #fff);
  white-space: nowrap;
}
.app-shell .hs-vac-mini-bat--ok {
  background: rgba(52, 211, 153, 0.18);
  border-color: rgba(52, 211, 153, 0.42);
  color: #6ee7b7;
}
.app-shell .hs-vac-mini-bat--low {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.45);
  color: #fca5a5;
}
.app-shell .device-tile--active .hs-vac-mini-bat {
  background: rgba(43, 36, 24, 0.12);
  border-color: rgba(43, 36, 24, 0.2);
  color: var(--paper-ink, #2b2418);
}

/* ─── Override default 2-column grid on wide cards so VacuumExpandedTile fills 100% width ─── */
.app-shell .device-tile--wide.device-tile--wide-vacuum {
  display: flex !important;
  flex-direction: column !important;
  grid-template-columns: none !important;
  grid-template-rows: none !important;
  padding: calc(var(--u, 8px) * 1.5) !important;
}

/* ─── Expanded Vacuum Card (2x1 Horizontal Split & 2x2 Tall Studio) ─── */
.hs-vac-tile {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}
.hs-vac-tile--wide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.38fr);
  gap: calc(var(--u, 8px) * 1.6);
  align-items: stretch;
}
.hs-vac-tile--tall {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1.4);
}
.hs-vac-tile__right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1.2);
  min-width: 0;
  min-height: 0;
}
.hs-vac-tile__right-head {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1);
}
.hs-vac-tile__tall-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1.2);
  flex-wrap: wrap;
}
.hs-vac-tile__status-line {
  display: flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.7);
  font-size: calc(var(--u, 8px) * 1.7);
  min-width: 0;
  cursor: pointer;
}
.hs-vac-tile__status-line strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-vac-tile__status-line small {
  opacity: 0.75;
  white-space: nowrap;
}
.hs-vac-tile__map {
  position: relative;
  border-radius: calc(var(--u, 8px) * 2 * var(--hd-r, 1));
  overflow: hidden;
  background: rgba(15, 35, 66, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.16);
  min-height: calc(var(--u, 8px) * 15);
  height: 100%;
  cursor: pointer;
}
.hs-vac-tile--tall .hs-vac-tile__map {
  flex: 1 1 52%;
  min-height: calc(var(--u, 8px) * 18);
  height: auto;
}
.hs-vac-tile__map img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hs-vac-tile__map-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u, 8px) * 0.8);
  opacity: 0.8;
  font-size: calc(var(--u, 8px) * 1.5);
}
.hs-vac-tile__map-badge {
  position: absolute;
  left: calc(var(--u, 8px) * 1);
  bottom: calc(var(--u, 8px) * 1);
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.6);
  padding: calc(var(--u, 8px) * 0.45) calc(var(--u, 8px) * 1.1);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  font-size: calc(var(--u, 8px) * 1.35);
  font-weight: 600;
  color: #ffffff;
  max-width: calc(100% - var(--u, 8px) * 2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-vac-tile__bat-badge {
  position: absolute;
  right: calc(var(--u, 8px) * 1);
  top: calc(var(--u, 8px) * 1);
  padding: calc(var(--u, 8px) * 0.35) calc(var(--u, 8px) * 0.9);
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.85);
  color: #06281e;
  font-size: calc(var(--u, 8px) * 1.3);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hs-vac-tile__bat-badge--low {
  background: rgba(239, 68, 68, 0.88);
  color: #fff;
}
.hs-vac-tile__pills {
  display: flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.8);
}
.hs-vac-tile--tall .hs-vac-tile__pills {
  flex: 1 1 auto;
}
.hs-vac-tile__pills button {
  flex: 1;
  min-width: calc(var(--u, 8px) * 4.4);
  height: calc(var(--u, 8px) * 4.2);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.hs-vac-tile__pills button.hs-vac-tile__pill-main {
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
}
.hs-vac-tile__pills button:hover {
  filter: brightness(1.1);
}
.hs-vac-tile__stats {
  display: grid;
  gap: calc(var(--u, 8px) * 0.8);
  cursor: pointer;
}
.hs-vac-tile__stats--wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  flex: 1;
  align-content: end;
}
.hs-vac-tile__stats--tall {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.hs-vac-stat {
  padding: calc(var(--u, 8px) * 0.9) calc(var(--u, 8px) * 1.1);
  border-radius: calc(var(--u, 8px) * 1.4 * var(--hd-r, 1));
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: calc(var(--u, 8px) * 0.3);
  min-width: 0;
}
.hs-vac-stat small {
  font-size: calc(var(--u, 8px) * 1.25);
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-vac-stat strong {
  font-size: calc(var(--u, 8px) * 1.65);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Full Dreame Vacuum Studio Tab (Image 2 style, scaled cleanly to --u) ─── */
.hs-vac-screen {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 2.2);
}
.hs-vac-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 2);
  flex-wrap: wrap;
}
.hs-vac-header h1 {
  margin: calc(var(--u, 8px) * 0.4) 0 0;
  font: 500 calc(var(--u, 8px) * 3.8) / 1.1 var(--f-display);
  color: var(--ink);
}
.hs-vac-dot {
  display: inline-block;
  width: calc(var(--u, 8px) * 1.05);
  height: calc(var(--u, 8px) * 1.05);
  border-radius: 50%;
  background: #34d399;
  margin-right: calc(var(--u, 8px) * 0.8);
  vertical-align: middle;
}
.hs-vac-dot--clean {
  background: #fbbf24;
  box-shadow: 0 0 10px #fbbf24;
}
.hs-vac-header__right {
  display: flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 1.6);
}
.hs-vac-bat-ring {
  position: relative;
  width: calc(var(--u, 8px) * 6.8);
  height: calc(var(--u, 8px) * 6.8);
  display: grid;
  place-items: center;
}
.hs-vac-bat-ring svg {
  width: 100%;
  height: 100%;
}
.hs-vac-bat-ring__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.16);
  stroke-width: 4.2;
}
.hs-vac-bat-ring__arc {
  fill: none;
  stroke: #34d399;
  stroke-width: 4.2;
  stroke-linecap: round;
}
.hs-vac-bat-ring span {
  position: absolute;
  font-size: calc(var(--u, 8px) * 1.55);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hs-vac-bat-ring__bolt {
  position: absolute;
  right: -2px;
  bottom: -2px;
  font-size: calc(var(--u, 8px) * 1.6);
  font-style: normal;
}
.hs-vac-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
  gap: calc(var(--u, 8px) * 2.4);
  align-items: stretch;
}
.hs-vac-col {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 2.2);
}
.hs-vac-panel {
  padding: calc(var(--u, 8px) * 2.4);
  border-radius: calc(var(--u, 8px) * 3 * var(--hd-r, 1));
  background: var(--glass, rgba(255, 255, 255, 0.14));
  border: 1px solid var(--hd-frame, var(--line, rgba(255, 255, 255, 0.2)));
  backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1.8);
}
.hs-vac-dock-split {
  display: grid;
  grid-template-columns: minmax(0, calc(var(--u, 8px) * 19)) minmax(0, 1fr);
  gap: calc(var(--u, 8px) * 2.2);
  align-items: center;
}
.hs-vac-dock-art {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u, 8px) * 1.2);
}
.hs-vac-name-badge {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.7);
  padding: calc(var(--u, 8px) * 0.65) calc(var(--u, 8px) * 1.4);
  border-radius: 999px;
  border: 0;
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  font-size: calc(var(--u, 8px) * 1.55);
  font-weight: 700;
  cursor: pointer;
  max-width: 100%;
}
.hs-vac-name-badge span:nth-child(2) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-vac-dock-art svg {
  width: 100%;
  max-width: calc(var(--u, 8px) * 17);
  height: auto;
  display: block;
}
.hs-vac-dock-info {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1.1);
  min-width: 0;
}
.hs-vac-pills {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--u, 8px) * 0.9);
}
.hs-vac-pill {
  padding: calc(var(--u, 8px) * 0.75) calc(var(--u, 8px) * 1.4);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: calc(var(--u, 8px) * 1.5);
  font-weight: 600;
}
.hs-vac-pill--ok {
  border-color: rgba(52, 211, 153, 0.45);
  background: rgba(52, 211, 153, 0.16);
}
.hs-vac-care-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1.1);
  padding-top: calc(var(--u, 8px) * 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.hs-vac-care-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(var(--u, 8px) * 10.5), 1fr));
  gap: calc(var(--u, 8px) * 1.1);
}
.hs-vac-care-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  border-radius: calc(var(--u, 8px) * 1.8 * var(--hd-r, 1));
  padding: calc(var(--u, 8px) * 1.2) calc(var(--u, 8px) * 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u, 8px) * 0.6);
  color: inherit;
  cursor: pointer;
  text-align: center;
}
.hs-vac-care-item:hover {
  background: rgba(255, 255, 255, 0.12);
}
.hs-vac-care-item b {
  font-size: calc(var(--u, 8px) * 1.45);
  font-weight: 600;
  line-height: 1.25;
}
.hs-vac-care-item small {
  font-size: calc(var(--u, 8px) * 1.35);
  opacity: 0.78;
}
.hs-vac-care-ring {
  position: relative;
  width: calc(var(--u, 8px) * 5.8);
  height: calc(var(--u, 8px) * 5.8);
  display: grid;
  place-items: center;
}
.hs-vac-care-ring svg {
  width: 100%;
  height: 100%;
}
.hs-vac-care-ring__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 3.6;
}
.hs-vac-care-ring span {
  position: absolute;
  font-size: calc(var(--u, 8px) * 1.35);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hs-vac-map-panel {
  flex: 1;
}
.hs-vac-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1);
  flex-wrap: wrap;
}
.hs-vac-map-tools {
  display: flex;
  gap: calc(var(--u, 8px) * 1);
  flex-wrap: wrap;
}
.hs-vac-room-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--u, 8px) * 14), 1fr));
  gap: calc(var(--u, 8px) * 1);
}
.hs-vac-room-chip {
  padding: calc(var(--u, 8px) * 1.2) calc(var(--u, 8px) * 1.4);
  border-radius: calc(var(--u, 8px) * 1.6 * var(--hd-r, 1));
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: calc(var(--u, 8px) * 1.55);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u, 8px) * 0.8);
}
.hs-vac-room-chip--on {
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
}
.hs-vac-clean-rooms-bar {
  width: 100%;
  padding: calc(var(--u, 8px) * 1.4) calc(var(--u, 8px) * 1.8);
  border-radius: calc(var(--u, 8px) * 1.8 * var(--hd-r, 1));
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u, 8px) * 0.9);
  font-size: calc(var(--u, 8px) * 1.6);
  font-weight: 600;
  cursor: pointer;
}
.hs-vac-clean-rooms-bar:disabled {
  opacity: 0.65;
  cursor: default;
}
.hs-vac-clean-rooms-bar--ready {
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
}
.hs-vac-hint {
  margin: 0;
  font-size: calc(var(--u, 8px) * 1.55);
  opacity: 0.72;
}
.hs-vac-live-map {
  border-radius: calc(var(--u, 8px) * 2.2 * var(--hd-r, 1));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(12, 26, 52, 0.68);
  cursor: pointer;
  min-height: calc(var(--u, 8px) * 30);
  display: grid;
  place-items: center;
}
.hs-vac-live-map img {
  width: 100%;
  max-height: calc(var(--u, 8px) * 46);
  object-fit: contain;
  display: block;
}
.hs-vac-primary-actions {
  display: grid;
  grid-template-columns: 1.45fr 1fr 1fr;
  gap: calc(var(--u, 8px) * 1.2);
}
.hs-vac-action {
  min-height: calc(var(--u, 8px) * 6.4);
  padding: calc(var(--u, 8px) * 1.4) calc(var(--u, 8px) * 1.6);
  border-radius: calc(var(--u, 8px) * 2 * var(--hd-r, 1));
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u, 8px) * 1);
  font-size: calc(var(--u, 8px) * 1.75);
  font-weight: 600;
  cursor: pointer;
}
.hs-vac-action--primary {
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  border-color: transparent;
  font-weight: 700;
}
.hs-vac-dock-cmds {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--u, 8px) * 1);
}
.hs-vac-telemetry-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--u, 8px) * 1.2);
}
.hs-vac-tele-box {
  padding: calc(var(--u, 8px) * 1.5) calc(var(--u, 8px) * 1.6);
  border-radius: calc(var(--u, 8px) * 1.8 * var(--hd-r, 1));
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.11);
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 0.5);
}
.hs-vac-tele-box small {
  font-size: calc(var(--u, 8px) * 1.3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  opacity: 0.68;
}
.hs-vac-tele-box strong {
  font-size: calc(var(--u, 8px) * 2.3);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hs-vac-modes {
  gap: calc(var(--u, 8px) * 2);
}
.hs-vac-mode-block {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1);
}
.hs-vac-seg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(var(--u, 8px) * 10), 1fr));
  gap: calc(var(--u, 8px) * 0.8);
  padding: calc(var(--u, 8px) * 0.55);
  border-radius: calc(var(--u, 8px) * 2 * var(--hd-r, 1));
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.hs-vac-seg-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u, 8px) * 0.65);
  padding: calc(var(--u, 8px) * 1.2) calc(var(--u, 8px) * 0.8);
  border-radius: calc(var(--u, 8px) * 1.5 * var(--hd-r, 1));
  border: 0;
  background: transparent;
  color: inherit;
  opacity: 0.8;
  font-size: calc(var(--u, 8px) * 1.45);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.hs-vac-seg-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}
.hs-vac-seg-btn--on {
  opacity: 1;
  background: var(--paper, #f4edd9);
  color: var(--paper-ink, #2b2418);
  font-weight: 700;
}
.hs-vac-schedules {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1);
}
.hs-vac-schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u, 8px) * 1.2);
  padding: calc(var(--u, 8px) * 1.25) calc(var(--u, 8px) * 1.6);
  border-radius: calc(var(--u, 8px) * 1.6 * var(--hd-r, 1));
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.09);
  font-size: calc(var(--u, 8px) * 1.6);
  font-weight: 500;
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

@media (max-width: 960px) {
  .hs-vac-columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 720px) {
  .hs-vac-tile--wide {
    grid-template-columns: 1fr;
  }
  .hs-vac-tile__map {
    min-height: calc(var(--u, 8px) * 18);
  }
  .hs-vac-dock-split {
    grid-template-columns: 1fr;
  }
  .hs-vac-dock-art {
    max-width: calc(var(--u, 8px) * 20);
    margin: 0 auto;
  }
  .hs-vac-tile__stats--tall,
  .hs-vac-tile__stats--wide {
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
