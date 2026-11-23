import { useMemo, useRef, useState } from "react";
import { ContextHeader } from "../components/ContextHeader";
import { EntityCard } from "../components/EntityCard";
import { EntityModal } from "../components/EntityModal";
import { HDIcon } from "../components/HDIcon";
import { Sparkline } from "../components/HistoryChart";
import { useHistory } from "../history";
import type { TranslationKey } from "../i18n";
import { arrange, entityKey, getLayout, keyId, setHidden, showItem } from "../layout";
import type { DiscoveredEntity } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";
import { useSwipeGesture } from "../useSwipeGesture";
import { entityIndex, type ScreenProps } from "./types";

interface SystemMetric {
  entityId: string;
  name: string;
  value: number;
  unit: string;
  formatted: string;
  subtitle?: string;
  stateObj: any;
}

export function SystemMonitorScreen(props: ScreenProps & { embedded?: boolean }) {
  const { config, editing, hass, language, onLayout, onSettings, t } = props;
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const screen = useRef<HTMLElement>(null);

  useSwipeGesture(screen, {
    disabled: editing || Boolean(props.embedded),
    onSwipeRight: () => {
      // Swiping right takes the user back to Home/Rooms
      window.dispatchEvent(new CustomEvent("homesmart-navigate", { detail: "home" }));
    },
  });

  // Extract vitals and detect all system-related sensors
  const { cpu, memory, disk, temp, netIn, netOut, uptime, load1m, load5m, load15m, allSystemEntities } = useMemo(() => {
    return parseSystemVitals(hass);
  }, [hass.states]);

  // Sparkline history for the 3 main vitals
  const cpuHistory = useHistory(hass, cpu?.entityId, 24);
  const memHistory = useHistory(hass, memory?.entityId, 24);
  const tempHistory = useHistory(hass, temp?.entityId, 24);

  // Layout arrangement for system sensor cards
  const layout = getLayout(config, "system");
  const nativeIds = allSystemEntities.map((e) => e.entity_id);
  const nativeSet = new Set(nativeIds);
  const added = (layout.added ?? []).filter((id) => !nativeSet.has(id));
  const { visible } = arrange([...nativeIds, ...added].map(entityKey), layout, true);
  const shownIds = new Set(visible.map(keyId));

  const toggleSensor = (id: string) => {
    const key = entityKey(id);
    if (nativeSet.has(id)) {
      onLayout("system", shownIds.has(id) ? setHidden(layout, key, true) : showItem(layout, key, visible));
    }
  };

  const everywhere = useMemo(() => entityIndex(props.catalogRooms), [props.catalogRooms]);

  // Overall system health indicator
  const isHighLoad = (cpu && cpu.value > 85) || (memory && memory.value > 90) || (temp && temp.value > 80);
  const isWarm = (cpu && cpu.value > 65) || (memory && memory.value > 80) || (temp && temp.value > 70);
  const healthBadge = isHighLoad
    ? { color: "#ef4444", bg: "rgba(239, 68, 68, 0.16)", text: t("systemWarning") }
    : isWarm
    ? { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.16)", text: t("systemWarning") }
    : { color: "#10b981", bg: "rgba(16, 185, 129, 0.16)", text: t("systemHealthy") };

  const hasAnyVitals = Boolean(cpu || memory || disk || temp || allSystemEntities.length > 0);

  return (
    <main className={`screen collection-screen sys-screen ${editing ? "screen--editing" : ""}`} ref={screen}>
      {!props.embedded && <ContextHeader config={config} hass={hass} language={language} onSettings={onSettings} t={t} />}

      <header className="collection-header sys-header">
        <div className="sys-header__titles">
          <div className="sys-header__top-row">
            <span className="eyebrow">{t("systemMonitor")}</span>
            <div className="sys-health-pill" style={{ color: healthBadge.color, background: healthBadge.bg }}>
              <span className="sys-health-pill__dot" style={{ background: healthBadge.color }} />
              <span>{healthBadge.text}</span>
            </div>
          </div>
          <h1>{t("systemMonitor")}</h1>
        </div>
      </header>

      {editing && <p className="edit-hint">{t("editHint")}</p>}

      {!hasAnyVitals ? (
        <section className="empty-state sys-empty-state">
          <span className="empty-state__icon"><HDIcon name="monitor" size={32} /></span>
          <h2>{t("systemMonitor")}</h2>
          <p>{t("noSystemSensors")}</p>
        </section>
      ) : (
        <>
          {/* Top 4 Circular Gauges */}
          <section className="sys-gauges-grid" aria-label={t("systemStatus")}>
            <CircularGauge
              icon="monitor"
              label={t("cpuUsage")}
              max={100}
              statusColor={gaugeColor(cpu?.value ?? 0, 65, 85)}
              subtext={cpu?.subtitle || (load1m ? `Load: ${load1m.value.toFixed(2)}` : undefined)}
              unit="%"
              value={cpu?.value}
            />
            <CircularGauge
              icon="grid"
              label={t("ramUsage")}
              max={100}
              statusColor={gaugeColor(memory?.value ?? 0, 75, 90)}
              subtext={memory?.subtitle}
              unit="%"
              value={memory?.value}
            />
            <CircularGauge
              icon="server"
              label={t("diskUsage")}
              max={100}
              statusColor={gaugeColor(disk?.value ?? 0, 80, 92)}
              subtext={disk?.subtitle}
              unit="%"
              value={disk?.value}
            />
            <CircularGauge
              icon="flame"
              label={t("cpuTemp")}
              max={100}
              statusColor={gaugeColor(temp?.value ?? 0, 65, 80)}
              subtext={temp?.subtitle || (temp?.value ? (temp.value < 60 ? "Mát" : temp.value < 75 ? "Bình thường" : "Nóng") : undefined)}
              unit="°C"
              value={temp?.value}
            />
          </section>

          {/* Network & Uptime / Load Cards */}
          <section className="sys-cards-grid">
            {/* Network Throughput Card */}
            <div className="sys-card sys-network-card">
              <div className="sys-card__head">
                <span className="sys-card__icon"><HDIcon name="wifi" size={18} /></span>
                <span className="sys-card__title">{t("networkIo")}</span>
              </div>
              <div className="sys-network-metrics">
                <div className="sys-net-stat">
                  <div className="sys-net-stat__label">
                    <span className="sys-net-arrow sys-net-arrow--down">↓</span>
                    <span>{t("networkIn")}</span>
                  </div>
                  <strong className="sys-net-stat__value">{netIn?.formatted || "0 kB/s"}</strong>
                </div>
                <div className="sys-net-stat">
                  <div className="sys-net-stat__label">
                    <span className="sys-net-arrow sys-net-arrow--up">↑</span>
                    <span>{t("networkOut")}</span>
                  </div>
                  <strong className="sys-net-stat__value">{netOut?.formatted || "0 kB/s"}</strong>
                </div>
              </div>
            </div>

            {/* System Load & Uptime Card */}
            <div className="sys-card sys-host-card">
              <div className="sys-card__head">
                <span className="sys-card__icon"><HDIcon name="clock" size={18} /></span>
                <span className="sys-card__title">{t("systemUptime")}</span>
              </div>
              <div className="sys-host-metrics">
                <div className="sys-host-uptime">
                  <span className="sys-host-uptime__label">{t("systemUptime")}:</span>
                  <strong className="sys-host-uptime__value">{uptime?.formatted || "Đang hoạt động"}</strong>
                </div>
                {(load1m || load5m || load15m) && (
                  <div className="sys-load-bars">
                    <span className="sys-load-title">{t("systemLoad")} (1m · 5m · 15m)</span>
                    <div className="sys-load-row">
                      <div className="sys-load-item">
                        <span>1m:</span>
                        <strong>{load1m?.value.toFixed(2) ?? "--"}</strong>
                      </div>
                      <div className="sys-load-item">
                        <span>5m:</span>
                        <strong>{load5m?.value.toFixed(2) ?? "--"}</strong>
                      </div>
                      <div className="sys-load-item">
                        <span>15m:</span>
                        <strong>{load15m?.value.toFixed(2) ?? "--"}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 24-Hour Trend History */}
          <section className="sys-trends-section">
            <h2 className="sys-section-title">{t("history")} (24h)</h2>
            <div className="sys-trends-grid">
              {cpuHistory && cpuHistory.length > 1 && (
                <div className="sys-trend-card">
                  <div className="sys-trend-card__header">
                    <span>{t("cpuUsage")} (%)</span>
                    <strong>{cpu?.value ? `${cpu.value.toFixed(1)}%` : ""}</strong>
                  </div>
                  <div className="sys-trend-chart">
                    <Sparkline compact hours={24} language={language} points={cpuHistory} unit="%" />
                  </div>
                </div>
              )}
              {memHistory && memHistory.length > 1 && (
                <div className="sys-trend-card">
                  <div className="sys-trend-card__header">
                    <span>{t("ramUsage")} (%)</span>
                    <strong>{memory?.value ? `${memory.value.toFixed(1)}%` : ""}</strong>
                  </div>
                  <div className="sys-trend-chart">
                    <Sparkline compact hours={24} language={language} points={memHistory} unit="%" />
                  </div>
                </div>
              )}
              {tempHistory && tempHistory.length > 1 && (
                <div className="sys-trend-card">
                  <div className="sys-trend-card__header">
                    <span>{t("cpuTemp")} (°C)</span>
                    <strong>{temp?.value ? `${temp.value.toFixed(1)}°C` : ""}</strong>
                  </div>
                  <div className="sys-trend-chart">
                    <Sparkline compact hours={24} language={language} points={tempHistory} unit="°C" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* All Detected System Sensors Grid */}
          {allSystemEntities.length > 0 && (
            <section className="sys-entities-section">
              <h2 className="sys-section-title">{t("systemSensors")} ({shownIds.size})</h2>
              <div className="device-grid collection-grid sys-entities-grid">
                {allSystemEntities
                  .filter((entity) => shownIds.has(entity.entity_id) || editing)
                  .map((entity) => {
                    const hidden = !shownIds.has(entity.entity_id);
                    return (
                      <div className={`sys-sensor-wrapper ${hidden ? "sys-sensor-wrapper--hidden" : ""}`} key={entity.entity_id}>
                        {editing && (
                          <button
                            aria-label={hidden ? "Show" : "Hide"}
                            className="sys-sensor-toggle"
                            onClick={() => toggleSensor(entity.entity_id)}
                            type="button"
                          >
                            {hidden ? "+" : "−"}
                          </button>
                        )}
                        <EntityCard
                          entity={entity}
                          hass={hass}
                          language={language}
                          onLongPress={setModalEntity}
                          t={t}
                        />
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </>
      )}

      {modalEntity && (
        <EntityModal
          entity={modalEntity}
          hass={hass}
          language={language}
          onClose={() => setModalEntity(null)}
          roomName={everywhere.roomName(modalEntity)}
          t={t}
        />
      )}
    </main>
  );
}

/** SVG Arc Circular Gauge */
function CircularGauge({
  icon,
  label,
  max = 100,
  statusColor = "#10b981",
  subtext,
  unit = "%",
  value,
}: {
  icon: any;
  label: string;
  max?: number;
  statusColor?: string;
  subtext?: string;
  unit?: string;
  value?: number;
}) {
  const radius = 40;
  const strokeWidth = 7;
  const normalized = value != null ? Math.min(Math.max(value, 0), max) : 0;
  // 260 degree arc gauge
  const totalAngle = 260;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (circumference * totalAngle) / 360;
  const strokeDashoffset = strokeDash - (strokeDash * (normalized / max));
  const rotation = 140; // start angle

  return (
    <div className="sys-gauge-card">
      <div className="sys-gauge-card__ring">
        <svg className="sys-gauge-svg" height="110" viewBox="0 0 100 100" width="110">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            transform={`rotate(${rotation} 50 50)`}
          />
          {/* Active Progress */}
          {value != null && (
            <circle
              cx="50"
              cy="50"
              fill="none"
              r={radius}
              stroke={statusColor}
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth={strokeWidth}
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s" }}
              transform={`rotate(${rotation} 50 50)`}
            />
          )}
        </svg>
        <div className="sys-gauge-center">
          <span className="sys-gauge-value">
            {value != null ? `${Math.round(value)}` : "--"}
            <small className="sys-gauge-unit">{unit}</small>
          </span>
        </div>
      </div>
      <div className="sys-gauge-info">
        <div className="sys-gauge-head">
          <span className="sys-gauge-icon"><HDIcon name={icon} size={15} /></span>
          <strong className="sys-gauge-label">{label}</strong>
        </div>
        {subtext && <span className="sys-gauge-sub">{subtext}</span>}
      </div>
    </div>
  );
}

function gaugeColor(value: number, warn: number, crit: number): string {
  if (value >= crit) return "#ef4444"; // Coral red
  if (value >= warn) return "#f59e0b"; // Warm amber
  return "#10b981"; // Vibrant emerald
}

/** Parses sensors from Home Assistant into vitals */
function parseSystemVitals(hass: HomeAssistant) {
  const states = Object.values(hass.states);

  let cpu: SystemMetric | undefined;
  let memory: SystemMetric | undefined;
  let disk: SystemMetric | undefined;
  let temp: SystemMetric | undefined;
  let netIn: SystemMetric | undefined;
  let netOut: SystemMetric | undefined;
  let uptime: SystemMetric | undefined;
  let load1m: SystemMetric | undefined;
  let load5m: SystemMetric | undefined;
  let load15m: SystemMetric | undefined;

  const allSystemEntities: DiscoveredEntity[] = [];

  for (const s of states) {
    if (!s.entity_id.startsWith("sensor.")) continue;

    const id = s.entity_id.toLowerCase();
    const friendly = String(s.attributes.friendly_name ?? "").toLowerCase();
    const val = Number.parseFloat(s.state);
    const hasNum = Number.isFinite(val);
    const unit = String(s.attributes.unit_of_measurement ?? "");

    const isSystemRelated =
      id.includes("processor") ||
      id.includes("cpu") ||
      id.includes("memory") ||
      id.includes("ram") ||
      id.includes("disk") ||
      id.includes("storage") ||
      id.includes("network_in") ||
      id.includes("network_out") ||
      id.includes("throughput") ||
      id.includes("last_boot") ||
      id.includes("uptime") ||
      id.includes("load_") ||
      id.includes("glances") ||
      id.includes("systemmonitor") ||
      id.includes("proxmox") ||
      id.includes("swap") ||
      friendly.includes("processor") ||
      friendly.includes("cpu") ||
      friendly.includes("memory") ||
      friendly.includes("ram") ||
      friendly.includes("disk");

    if (isSystemRelated) {
      allSystemEntities.push({
        area_id: "",
        device_class: s.attributes.device_class ?? null,
        device_id: null,
        domain: "sensor",
        entity_id: s.entity_id,
        icon: typeof s.attributes.icon === "string" ? s.attributes.icon : null,
        name: s.attributes.friendly_name ?? s.entity_id,
      });
    }

    // CPU Usage
    if (!cpu && hasNum && (id.endsWith("processor_use") || id.endsWith("processor_use_percent") || id.endsWith("cpu_percent") || (friendly.includes("processor use") && unit === "%") || (friendly.includes("cpu usage") && unit === "%"))) {
      cpu = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "CPU",
        stateObj: s,
        unit: "%",
        value: val,
      };
    }

    // Memory Usage %
    if (!memory && hasNum && (id.endsWith("memory_use_percent") || id.endsWith("ram_percent") || (friendly.includes("memory use") && unit === "%") || (friendly.includes("ram usage") && unit === "%"))) {
      memory = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "RAM",
        stateObj: s,
        unit: "%",
        value: val,
      };
    }

    // Disk Usage %
    if (!disk && hasNum && (id.endsWith("disk_use_percent") || id.endsWith("disk_use_percent_home") || (friendly.includes("disk use") && unit === "%"))) {
      disk = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "Disk",
        stateObj: s,
        unit: "%",
        value: val,
      };
    }

    // CPU Temperature
    if (!temp && hasNum && (s.attributes.device_class === "temperature" || unit === "°C" || unit === "°F") && (id.includes("cpu") || id.includes("processor") || id.includes("soc") || id.includes("core_temp") || friendly.includes("processor temp") || friendly.includes("cpu temp"))) {
      temp = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}°C`,
        name: s.attributes.friendly_name ?? "CPU Temp",
        stateObj: s,
        unit: "°C",
        value: val,
      };
    }

    // Network In
    if (!netIn && (id.includes("network_in") || id.includes("throughput_in") || id.includes("rx_") || friendly.includes("network in"))) {
      netIn = {
        entityId: s.entity_id,
        formatted: hasNum ? `${val.toFixed(1)} ${unit}` : s.state,
        name: s.attributes.friendly_name ?? "Network In",
        stateObj: s,
        unit,
        value: hasNum ? val : 0,
      };
    }

    // Network Out
    if (!netOut && (id.includes("network_out") || id.includes("throughput_out") || id.includes("tx_") || friendly.includes("network out"))) {
      netOut = {
        entityId: s.entity_id,
        formatted: hasNum ? `${val.toFixed(1)} ${unit}` : s.state,
        name: s.attributes.friendly_name ?? "Network Out",
        stateObj: s,
        unit,
        value: hasNum ? val : 0,
      };
    }

    // Uptime / Last boot
    if (!uptime && (id.endsWith("last_boot") || id.endsWith("uptime") || friendly.includes("last boot") || friendly.includes("uptime"))) {
      let uptimeText = s.state;
      if (s.attributes.device_class === "timestamp" || !Number.isNaN(Date.parse(s.state))) {
        const bootTime = Date.parse(s.state);
        const diffMs = Date.now() - bootTime;
        if (diffMs > 0) {
          const days = Math.floor(diffMs / (24 * 3600 * 1000));
          const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
          const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
          uptimeText = days > 0 ? `${days} ngày ${hours} giờ` : `${hours} giờ ${mins} phút`;
        }
      }
      uptime = {
        entityId: s.entity_id,
        formatted: uptimeText,
        name: s.attributes.friendly_name ?? "Uptime",
        stateObj: s,
        unit: "",
        value: 0,
      };
    }

    // Load 1m, 5m, 15m
    if (hasNum) {
      if (!load1m && (id.endsWith("load_1m") || id.endsWith("load_15m_1m") || friendly.endsWith("1m"))) {
        load1m = { entityId: s.entity_id, formatted: val.toFixed(2), name: "1m", stateObj: s, unit: "", value: val };
      }
      if (!load5m && (id.endsWith("load_5m") || friendly.endsWith("5m"))) {
        load5m = { entityId: s.entity_id, formatted: val.toFixed(2), name: "5m", stateObj: s, unit: "", value: val };
      }
      if (!load15m && (id.endsWith("load_15m") || friendly.endsWith("15m"))) {
        load15m = { entityId: s.entity_id, formatted: val.toFixed(2), name: "15m", stateObj: s, unit: "", value: val };
      }
    }
  }

  // Look for free / used memory in GB to add nice subtitles
  for (const s of states) {
    const id = s.entity_id.toLowerCase();
    const val = Number.parseFloat(s.state);
    if (!Number.isFinite(val)) continue;
    if (memory && !memory.subtitle) {
      if (id.endsWith("memory_use") && String(s.attributes.unit_of_measurement ?? "").includes("MiB")) {
        const gb = (val / 1024).toFixed(1);
        memory.subtitle = `Đang dùng: ${gb} GB`;
      } else if (id.endsWith("memory_free") && String(s.attributes.unit_of_measurement ?? "").includes("MiB")) {
        const gb = (val / 1024).toFixed(1);
        memory.subtitle = `Còn trống: ${gb} GB`;
      }
    }
    if (disk && !disk.subtitle) {
      if (id.endsWith("disk_free") || id.includes("disk_free_")) {
        const unit = s.attributes.unit_of_measurement ?? "GB";
        disk.subtitle = `Còn trống: ${val.toFixed(1)} ${unit}`;
      }
    }
  }

  return { cpu, memory, disk, temp, netIn, netOut, uptime, load1m, load5m, load15m, allSystemEntities };
}
