import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ContextHeader } from "../components/ContextHeader";
import { EditableGrid, type GridItem, useTallTile, useWideTile } from "../components/EditableGrid";
import { EntityCard } from "../components/EntityCard";
import { EntityModal } from "../components/EntityModal";
import { EntityPicker } from "../components/EntityPicker";
import { HDIcon, type IconName } from "../components/HDIcon";
import { Sparkline } from "../components/HistoryChart";
import { useHistory } from "../history";
import type { TranslationKey } from "../i18n";
import { arrange, entityKey, getLayout, keyId } from "../layout";
import { usePlan } from "../plan";
import type { HomeSmartConfig, ScreenLayout } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { useSwipeGesture } from "../useSwipeGesture";
import { entityIndex, type ScreenProps } from "./types";

interface SystemMetric {
  entityId: string;
  name: string;
  value: number;
  unit: string;
  formatted: string;
  subtitle?: string;
  stateObj: HassEntity;
}

function asEntity(state: HassEntity): DiscoveredEntity {
  return {
    area_id: "",
    device_class: (state.attributes.device_class as string | undefined) ?? null,
    device_id: null,
    domain: state.entity_id.split(".")[0],
    entity_id: state.entity_id,
    icon: typeof state.attributes.icon === "string" ? state.attributes.icon : null,
    name: String(state.attributes.friendly_name ?? state.entity_id),
  };
}

export function SystemMonitorScreen(props: ScreenProps & { embedded?: boolean }) {
  const { catalogRooms, config, editing, hass, language, onConfig, onLayout, onSettings, t } = props;
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const [configuringMetric, setConfiguringMetric] = useState<keyof NonNullable<HomeSmartConfig["system_monitor"]> | null>(null);
  const [picking, setPicking] = useState(false);
  const screen = useRef<HTMLElement>(null);
  const plan = usePlan();

  useSwipeGesture(screen, {
    disabled: editing || Boolean(props.embedded),
    onSwipeRight: () => {
      window.dispatchEvent(new CustomEvent("homesmart-navigate", { detail: "home" }));
    },
  });

  // Extract vitals and detect all system-related sensors
  const { cpu, memory, disk, temp, netIn, netOut, uptime, load1m, load5m, load15m, allSystemEntities } = useMemo(() => {
    return parseSystemVitals(hass, config.system_monitor);
  }, [hass.states, config.system_monitor]);

  // Sparkline history for the 3 main vitals
  const cpuHistory = useHistory(hass, cpu?.entityId, 24);
  const memHistory = useHistory(hass, memory?.entityId, 24);
  const tempHistory = useHistory(hass, temp?.entityId, 24);

  // Layout arrangement for system sensor cards
  const rawLayout = getLayout(config, "system");
  const everywhere = useMemo(() => entityIndex(catalogRooms), [catalogRooms]);

  // Candidates for the grid
  const primaryKeys = [
    "sys:cpu",
    "sys:ram",
    "sys:disk",
    "sys:temp",
    "sys:network",
    "sys:uptime",
    ...(cpuHistory && cpuHistory.length > 1 ? ["sys:chart_cpu"] : []),
    ...(tempHistory && tempHistory.length > 1 ? ["sys:chart_temp"] : []),
    ...(memHistory && memHistory.length > 1 ? ["sys:chart_ram"] : []),
  ];

  const addedEntityIds = rawLayout.added ?? [];
  const candidateKeys = [...primaryKeys, ...addedEntityIds.map(entityKey)];

  // Default layout setup if first time:
  const layout: ScreenLayout = useMemo(() => {
    const isFirstTime = rawLayout.order.length === 0 && rawLayout.wide.length === 0;
    if (isFirstTime) {
      return {
        ...rawLayout,
        order: candidateKeys,
        wide: ["sys:network", "sys:uptime", "sys:chart_cpu", "sys:chart_temp"],
      };
    }
    return rawLayout;
  }, [rawLayout, candidateKeys]);

  const { visible, hidden } = arrange(candidateKeys, layout);

  // Overall system health indicator
  const isHighLoad = (cpu && cpu.value > 85) || (memory && memory.value > 90) || (temp && temp.value > 80);
  const isWarm = (cpu && cpu.value > 65) || (memory && memory.value > 80) || (temp && temp.value > 70);
  const healthBadge = isHighLoad
    ? { color: "#ef4444", bg: "rgba(239, 68, 68, 0.16)", text: t("systemWarning") }
    : isWarm
    ? { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.16)", text: t("systemWarning") }
    : { color: "#10b981", bg: "rgba(16, 185, 129, 0.16)", text: t("systemHealthy") };

  const hasAnyVitals = Boolean(cpu || memory || disk || temp || allSystemEntities.length > 0);

  const labelForKey = (key: string): string => {
    if (key === "sys:cpu") return t("cpuUsage");
    if (key === "sys:ram") return t("ramUsage");
    if (key === "sys:disk") return t("diskUsage");
    if (key === "sys:temp") return t("cpuTemp");
    if (key === "sys:network") return t("networkIo");
    if (key === "sys:uptime") return t("systemUptime");
    if (key === "sys:chart_cpu") return `${t("cpuUsage")} (24h)`;
    if (key === "sys:chart_temp") return `${t("cpuTemp")} (24h)`;
    if (key === "sys:chart_ram") return `${t("ramUsage")} (24h)`;
    if (key.startsWith("entity:")) {
      const id = keyId(key);
      return everywhere.byId.get(id)?.name ?? hass.states[id]?.attributes.friendly_name ?? id;
    }
    return key;
  };

  const handleEntityToggle = (entityId: string) => {
    const key = entityKey(entityId);
    const isAdded = addedEntityIds.includes(entityId);
    let nextAdded: string[];
    let nextOrder: string[];
    let nextHidden: string[];

    if (isAdded) {
      nextAdded = addedEntityIds.filter((id) => id !== entityId);
      nextOrder = layout.order.filter((k: string) => k !== key);
      nextHidden = layout.hidden.filter((k: string) => k !== key);
    } else {
      nextAdded = [...addedEntityIds, entityId];
      nextOrder = [...layout.order.filter((k: string) => k !== key), key];
      nextHidden = layout.hidden.filter((k: string) => k !== key);
    }

    onLayout("system", {
      ...layout,
      added: nextAdded,
      hidden: nextHidden,
      order: nextOrder,
    });
  };

  const handleSetSensor = (metricKey: keyof NonNullable<HomeSmartConfig["system_monitor"]>, entityId: string) => {
    onConfig((cur) => ({
      ...cur,
      system_monitor: {
        ...(cur.system_monitor ?? {}),
        [metricKey]: entityId || undefined,
      },
    }));
  };

  const items: GridItem[] = visible.map((key) => {
    if (key === "sys:cpu") {
      return {
        key,
        label: t("cpuUsage"),
        node: (
          <CyberGlowGauge
            gradId="sys-grad-cpu"
            gradientStops={[{ offset: "0%", color: "#00f2fe" }, { offset: "100%", color: "#4facfe" }]}
            icon="monitor"
            label={t("cpuUsage")}
            onClick={() => (cpu?.stateObj ? setModalEntity(asEntity(cpu.stateObj)) : setConfiguringMetric("cpu"))}
            onConfigure={() => setConfiguringMetric("cpu")}
            subtext={cpu?.subtitle || (load1m ? `Load: ${load1m.value.toFixed(2)}` : undefined)}
            t={t}
            unit="%"
            value={cpu?.value}
          />
        ),
      };
    }
    if (key === "sys:ram") {
      return {
        key,
        label: t("ramUsage"),
        node: (
          <CyberGlowGauge
            detail={memory?.subtitle}
            gradId="sys-grad-ram"
            gradientStops={[{ offset: "0%", color: "#10b981" }, { offset: "100%", color: "#06b6d4" }]}
            icon="grid"
            label={t("ramUsage")}
            onClick={() => (memory?.stateObj ? setModalEntity(asEntity(memory.stateObj)) : setConfiguringMetric("memory"))}
            onConfigure={() => setConfiguringMetric("memory")}
            t={t}
            unit="%"
            value={memory?.value}
          />
        ),
      };
    }
    if (key === "sys:disk") {
      return {
        key,
        label: t("diskUsage"),
        node: (
          <CyberGlowGauge
            detail={disk?.subtitle}
            gradId="sys-grad-disk"
            gradientStops={[{ offset: "0%", color: "#f59e0b" }, { offset: "100%", color: "#f97316" }]}
            icon="server"
            label={t("diskUsage")}
            onClick={() => (disk?.stateObj ? setModalEntity(asEntity(disk.stateObj)) : setConfiguringMetric("disk"))}
            onConfigure={() => setConfiguringMetric("disk")}
            t={t}
            unit="%"
            value={disk?.value}
          />
        ),
      };
    }
    if (key === "sys:temp") {
      const tempStops = getTempGlowGradient(temp?.value);
      const tempStatus = temp?.value
        ? temp.value < 55
          ? "Mát mẻ"
          : temp.value < 72
          ? "Bình thường"
          : temp.value < 82
          ? "Ấm"
          : "Nóng"
        : undefined;
      return {
        key,
        label: t("cpuTemp"),
        node: (
          <CyberGlowGauge
            gradId="sys-grad-temp"
            gradientStops={tempStops}
            icon="flame"
            label={t("cpuTemp")}
            onClick={() => (temp?.stateObj ? setModalEntity(asEntity(temp.stateObj)) : setConfiguringMetric("temperature"))}
            onConfigure={() => setConfiguringMetric("temperature")}
            subtext={temp?.subtitle || tempStatus}
            t={t}
            unit="°C"
            value={temp?.value}
          />
        ),
      };
    }
    if (key === "sys:network") {
      return {
        key,
        label: t("networkIo"),
        node: (
          <CyberNetworkCard
            netIn={netIn}
            netOut={netOut}
            onClick={() => {
              const ent = netIn?.stateObj || netOut?.stateObj;
              if (ent) setModalEntity(asEntity(ent));
              else setConfiguringMetric("network_in");
            }}
            onConfigure={() => setConfiguringMetric("network_in")}
            t={t}
          />
        ),
      };
    }
    if (key === "sys:uptime") {
      return {
        key,
        label: t("systemUptime"),
        node: (
          <CyberUptimeCard
            load1m={load1m}
            load5m={load5m}
            load15m={load15m}
            onClick={() => (uptime?.stateObj ? setModalEntity(asEntity(uptime.stateObj)) : setConfiguringMetric("uptime"))}
            onConfigure={() => setConfiguringMetric("uptime")}
            t={t}
            uptime={uptime}
          />
        ),
      };
    }
    if (key === "sys:chart_cpu") {
      return {
        key,
        label: `${t("cpuUsage")} (24h)`,
        node: (
          <CyberTrendCard
            color="#38bdf8"
            history={cpuHistory}
            label={`${t("cpuUsage")} (%)`}
            onClick={() => cpu?.stateObj && setModalEntity(asEntity(cpu.stateObj))}
            unit="%"
            value={cpu?.formatted}
          />
        ),
      };
    }
    if (key === "sys:chart_temp") {
      return {
        key,
        label: `${t("cpuTemp")} (24h)`,
        node: (
          <CyberTrendCard
            color="#ef4444"
            history={tempHistory}
            label={`${t("cpuTemp")} (°C)`}
            onClick={() => temp?.stateObj && setModalEntity(asEntity(temp.stateObj))}
            unit="°C"
            value={temp?.formatted}
          />
        ),
      };
    }
    if (key === "sys:chart_ram") {
      return {
        key,
        label: `${t("ramUsage")} (24h)`,
        node: (
          <CyberTrendCard
            color="#10b981"
            history={memHistory}
            label={`${t("ramUsage")} (%)`}
            onClick={() => memory?.stateObj && setModalEntity(asEntity(memory.stateObj))}
            unit="%"
            value={memory?.formatted}
          />
        ),
      };
    }

    // Custom or added sensor entity
    const entityId = keyId(key);
    const entity = everywhere.byId.get(entityId) || asEntity(hass.states[entityId]);
    return {
      key,
      label: entity?.name || entityId,
      removal: "remove",
      node: (
        <EntityCard
          entity={entity}
          hass={hass}
          language={language}
          onLongPress={setModalEntity}
          t={t}
        />
      ),
    };
  });

  const configuringTitle = useMemo(() => {
    switch (configuringMetric) {
      case "cpu":
        return t("cpuUsage");
      case "memory":
        return t("ramUsage");
      case "disk":
        return t("diskUsage");
      case "temperature":
        return t("cpuTemp");
      case "network_in":
        return t("networkIn");
      case "network_out":
        return t("networkOut");
      case "uptime":
        return t("systemUptime");
      default:
        return "";
    }
  }, [configuringMetric, t]);

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
        <div className="sys-editable-container" style={{ width: "100%", marginTop: "calc(var(--u) * 1.5)" }}>
          <EditableGrid
            addLabel={t("addDevices")}
            className="sys-grid device-grid collection-grid"
            editing={editing}
            hass={hass}
            hiddenItems={hidden.map((k) => ({ key: k, label: labelForKey(k) }))}
            items={items}
            layout={layout}
            onAdd={() => setPicking(true)}
            onLayout={(next) => onLayout("system", next)}
            onRemove={(removeKey) => {
              if (removeKey.startsWith("entity:")) {
                handleEntityToggle(keyId(removeKey));
              }
            }}
            sections={false}
            sizable={true}
            t={t}
          />
        </div>
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

      {configuringMetric && (
        <SystemSensorModal
          currentId={config.system_monitor?.[configuringMetric]}
          hass={hass}
          metricKey={configuringMetric}
          metricTitle={configuringTitle}
          onClose={() => setConfiguringMetric(null)}
          onSelect={(id) => handleSetSensor(configuringMetric, id)}
          t={t}
        />
      )}

      {picking && (
        <EntityPicker
          language={language}
          onClose={() => setPicking(false)}
          onToggle={(id) => {
            if (addedEntityIds.includes(id)) {
              handleEntityToggle(id);
            } else if (plan.allow(id)) {
              handleEntityToggle(id);
            }
          }}
          rooms={catalogRooms}
          selected={addedEntityIds}
          t={t}
        />
      )}
    </main>
  );
}

/** Direct Sensor Selector Modal */
function SystemSensorModal({
  currentId,
  hass,
  metricKey,
  metricTitle,
  onClose,
  onSelect,
  t,
}: {
  currentId?: string;
  hass: HomeAssistant;
  metricKey: keyof NonNullable<HomeSmartConfig["system_monitor"]>;
  metricTitle: string;
  onClose: () => void;
  onSelect: (entityId: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [search, setSearch] = useState("");
  const candidates = useMemo(() => systemCandidates(hass)[metricKey] ?? [], [hass.states, metricKey]);
  const allSensors = useMemo(() => {
    return Object.values(hass.states).filter((s) => s.entity_id.startsWith("sensor."));
  }, [hass.states]);

  const filteredSensors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return candidates.slice(0, 35);
    }
    return allSensors
      .filter((s) => {
        const id = s.entity_id.toLowerCase();
        const friendly = String(s.attributes.friendly_name ?? "").toLowerCase();
        return id.includes(query) || friendly.includes(query);
      })
      .slice(0, 45);
  }, [search, candidates, allSensors]);

  return createPortal(
    <div
      aria-modal="true"
      className="hd-modal-backdrop"
      onClick={onClose}
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "grid",
        placeItems: "center",
        padding: "calc(var(--u) * 2)",
      }}
    >
      <div
        className="sys-sensor-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 540px)",
          maxHeight: "85vh",
          background: "var(--paper, #181d24)",
          borderRadius: "calc(var(--u) * 2.2)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.65)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "calc(var(--u) * 1.8) calc(var(--u) * 2.2)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "calc(var(--u) * 1.9)", fontWeight: 700 }}>
              {t("selectSensor")}: {metricTitle}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "calc(var(--u) * 1.3)", opacity: 0.7 }}>
              {t("systemMonitorSensorsDescription")}
            </p>
          </div>
          <button
            aria-label="Close"
            className="hd-close"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: 0,
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--ink)",
            }}
            type="button"
          >
            <HDIcon name="close" size={18} />
          </button>
        </header>

        <div style={{ padding: "calc(var(--u) * 1.4) calc(var(--u) * 2.2)" }}>
          <input
            className="st-input st-input--framed"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm cảm biến (VD: memory, ram, disk...)..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: "14px" }}
            type="text"
            value={search}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 calc(var(--u) * 2.2) calc(var(--u) * 2)" }}>
          {/* Default Auto-detect item */}
          <button
            className={`sys-sensor-opt ${!currentId ? "sys-sensor-opt--selected" : ""}`}
            onClick={() => {
              onSelect("");
              onClose();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: 10,
              background: !currentId ? "rgba(59, 130, 246, 0.22)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${!currentId ? "#3b82f6" : "rgba(255, 255, 255, 0.08)"}`,
              marginBottom: 8,
              cursor: "pointer",
              color: "var(--ink)",
              textAlign: "left",
            }}
            type="button"
          >
            <div>
              <div style={{ fontWeight: 600 }}>{t("autoDetect")}</div>
              <small style={{ opacity: 0.6 }}>Tự động tìm kiếm cảm biến tốt nhất trong Home Assistant</small>
            </div>
            {!currentId && <HDIcon name="check" size={18} />}
          </button>

          {/* Filtered list of candidate sensors */}
          {filteredSensors.map((s) => {
            const isSelected = currentId === s.entity_id;
            return (
              <button
                className={`sys-sensor-opt ${isSelected ? "sys-sensor-opt--selected" : ""}`}
                key={s.entity_id}
                onClick={() => {
                  onSelect(s.entity_id);
                  onClose();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: isSelected ? "rgba(59, 130, 246, 0.22)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${isSelected ? "#3b82f6" : "rgba(255, 255, 255, 0.08)"}`,
                  marginBottom: 8,
                  cursor: "pointer",
                  color: "var(--ink)",
                  textAlign: "left",
                }}
                type="button"
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {String(s.attributes.friendly_name ?? s.entity_id)}
                  </div>
                  <small style={{ opacity: 0.6, fontSize: "0.8em", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                    {s.entity_id}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95em", color: "#38bdf8" }}>
                    {s.state} {s.attributes.unit_of_measurement ?? ""}
                  </span>
                  {isSelected && <HDIcon name="check" size={18} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.querySelector(".app-shell") || document.body
  );
}

/** Cyber Bento Glow Gauge */
function CyberGlowGauge({
  detail,
  gradId,
  gradientStops,
  icon,
  label,
  max = 100,
  onClick,
  onConfigure,
  subtext,
  t,
  unit = "%",
  value,
}: {
  detail?: string;
  gradId: string;
  gradientStops: Array<{ offset: string; color: string }>;
  icon: IconName;
  label: string;
  max?: number;
  onClick?: () => void;
  onConfigure?: () => void;
  subtext?: string;
  t: (key: TranslationKey) => string;
  unit?: string;
  value?: number;
}) {
  const wide = useWideTile();
  const radius = 38;
  const strokeWidth = 7;
  const normalized = value != null ? Math.min(Math.max(value, 0), max) : 0;
  // 260 degree arc gauge
  const totalAngle = 260;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (circumference * totalAngle) / 360;
  const strokeDashoffset = strokeDash - (strokeDash * (normalized / max));
  const rotation = 140; // start angle

  const mainColor = gradientStops[0]?.color ?? "#38bdf8";

  return (
    <div
      className={`sys-gauge-card ${wide ? "sys-gauge-card--wide" : ""}`}
      onClick={onClick}
      role="button"
      style={{
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: wide ? "row" : "column",
        alignItems: "center",
        justifyContent: wide ? "flex-start" : "center",
        padding: wide ? "calc(var(--u) * 1.8) calc(var(--u) * 2.2)" : "calc(var(--u) * 2) calc(var(--u) * 1.6)",
        gap: wide ? "calc(var(--u) * 2)" : "calc(var(--u) * 1.2)",
        width: "100%",
        height: "100%",
        minHeight: "calc(var(--u) * 16)",
        position: "relative",
      }}
      tabIndex={0}
    >
      {/* Settings gear button */}
      {onConfigure && (
        <button
          aria-label={t("selectSensor")}
          className="sys-gauge-cfg-btn"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.25)",
            color: "var(--ink)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            opacity: 0.7,
            zIndex: 4,
          }}
          title={t("selectSensor")}
          type="button"
        >
          <HDIcon name="settings" size={13} />
        </button>
      )}

      <div className="sys-gauge-card__ring" style={{ width: 96, height: 96, flexShrink: 0, position: "relative", display: "grid", placeItems: "center" }}>
        <svg className="sys-gauge-svg" height="96" style={{ overflow: "visible" }} viewBox="0 0 100 100" width="96">
          <defs>
            <linearGradient id={gradId} x1="0%" x2="100%" y1="100%" y2="0%">
              {gradientStops.map((s, idx) => (
                <stop key={idx} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            <filter id={`${gradId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={mainColor} floodOpacity="0.45" />
            </filter>
          </defs>
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            transform={`rotate(${rotation} 50 50)`}
          />
          {/* Active Gradient Stroke */}
          {value != null && (
            <circle
              cx="50"
              cy="50"
              fill="none"
              filter={`url(#${gradId}-glow)`}
              r={radius}
              stroke={`url(#${gradId})`}
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth={strokeWidth}
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
              transform={`rotate(${rotation} 50 50)`}
            />
          )}
        </svg>
        <div className="sys-gauge-center" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {value != null ? (
            <span className="sys-gauge-value" style={{ font: "700 calc(var(--u) * 2.5)/1 var(--f-body)", display: "flex", alignItems: "baseline" }}>
              {Math.round(value)}
              <small className="sys-gauge-unit" style={{ fontSize: "0.55em", opacity: 0.8, marginLeft: 2 }}>{unit}</small>
            </span>
          ) : (
            <button
              className="hd-pill hd-pill--primary"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure?.();
              }}
              style={{ fontSize: "0.75em", padding: "4px 8px" }}
              type="button"
            >
              <HDIcon name="settings" size={12} />
              <span>{t("selectSensor")}</span>
            </button>
          )}
        </div>
      </div>

      <div className="sys-gauge-info" style={{ display: "flex", flexDirection: "column", alignItems: wide ? "flex-start" : "center", textAlign: wide ? "left" : "center", flex: 1, minWidth: 0, width: wide ? "auto" : "100%" }}>
        <div className="sys-gauge-head" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="sys-gauge-icon" style={{ color: mainColor, display: "flex" }}>
            <HDIcon name={icon} size={16} />
          </span>
          <strong className="sys-gauge-label" style={{ fontSize: "calc(var(--u) * 1.6)", fontWeight: 600 }}>{label}</strong>
        </div>
        {detail && (
          <div style={{ marginTop: 6, width: "100%" }}>
            <div style={{ fontSize: "0.85em", opacity: 0.85, fontWeight: 500 }}>{detail}</div>
            <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%`, height: "100%", background: `linear-gradient(90deg, ${mainColor}, ${gradientStops[1]?.color ?? mainColor})`, borderRadius: 2 }} />
            </div>
          </div>
        )}
        {subtext && <span className="sys-gauge-sub" style={{ fontSize: "0.8em", opacity: 0.7, marginTop: 4 }}>{subtext}</span>}
      </div>
    </div>
  );
}

function getTempGlowGradient(temp?: number): Array<{ offset: string; color: string }> {
  if (temp == null) return [{ offset: "0%", color: "#38bdf8" }, { offset: "100%", color: "#0ea5e9" }];
  if (temp < 55) {
    return [{ offset: "0%", color: "#38bdf8" }, { offset: "100%", color: "#0ea5e9" }]; // Ice Blue
  } else if (temp < 72) {
    return [{ offset: "0%", color: "#10b981" }, { offset: "100%", color: "#34d399" }]; // Emerald Green
  } else if (temp < 82) {
    return [{ offset: "0%", color: "#f59e0b" }, { offset: "100%", color: "#fbbf24" }]; // Amber Gold
  } else {
    return [{ offset: "0%", color: "#ef4444" }, { offset: "100%", color: "#f43f5e" }]; // Crimson Red
  }
}

/** Dual-Stream Cyber Network Card */
function CyberNetworkCard({ netIn, netOut, onClick, onConfigure, t }: { netIn?: SystemMetric; netOut?: SystemMetric; onClick: () => void; onConfigure?: () => void; t: (key: TranslationKey) => string }) {
  const wide = useWideTile();
  return (
    <div
      className={`sys-card sys-network-card ${wide ? "sys-network-card--wide" : ""}`}
      onClick={onClick}
      role="button"
      style={{
        boxSizing: "border-box",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        minHeight: "calc(var(--u) * 16)",
        position: "relative",
      }}
      tabIndex={0}
    >
      <div className="sys-card__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: wide ? 12 : 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "calc(var(--u) * 0.8)" }}>
          <span className="sys-card__icon" style={{ color: "#38bdf8", filter: "drop-shadow(0 0 6px rgba(56,189,248,0.5))" }}>
            <HDIcon name="wifi" size={18} />
          </span>
          <span className="sys-card__title" style={{ fontWeight: 600 }}>{t("networkIo")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.75em", opacity: 0.8, background: "rgba(56,189,248,0.15)", color: "#38bdf8", padding: "2px 8px", borderRadius: 999 }}>Realtime</span>
          {onConfigure && (
            <button
              aria-label={t("selectSensor")}
              className="sys-gauge-cfg-btn"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--ink)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                opacity: 0.7,
              }}
              title={t("selectSensor")}
              type="button"
            >
              <HDIcon name="settings" size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="sys-network-metrics" style={{ display: "flex", gap: "calc(var(--u) * 1.4)", flex: 1, alignItems: "center" }}>
        {/* Download Capsule */}
        <div
          className="sys-net-stat"
          style={{
            flex: 1,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.03))",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "calc(var(--u) * 1.4)",
            padding: "calc(var(--u) * 1.2) calc(var(--u) * 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div className="sys-net-stat__label" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "calc(var(--u) * 1.2)", color: "#10b981", fontWeight: 600 }}>
            <span style={{ fontSize: "1.1em", filter: "drop-shadow(0 0 4px #10b981)" }}>↓</span>
            <span>{t("networkIn")}</span>
          </div>
          <strong className="sys-net-stat__value" style={{ font: "700 calc(var(--u) * 2)/1.1 var(--f-body)", color: "var(--ink)" }}>
            {netIn?.formatted || "0 kB/s"}
          </strong>
        </div>

        {/* Upload Capsule */}
        <div
          className="sys-net-stat"
          style={{
            flex: 1,
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.03))",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            borderRadius: "calc(var(--u) * 1.4)",
            padding: "calc(var(--u) * 1.2) calc(var(--u) * 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div className="sys-net-stat__label" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "calc(var(--u) * 1.2)", color: "#60a5fa", fontWeight: 600 }}>
            <span style={{ fontSize: "1.1em", filter: "drop-shadow(0 0 4px #3b82f6)" }}>↑</span>
            <span>{t("networkOut")}</span>
          </div>
          <strong className="sys-net-stat__value" style={{ font: "700 calc(var(--u) * 2)/1.1 var(--f-body)", color: "var(--ink)" }}>
            {netOut?.formatted || "0 kB/s"}
          </strong>
        </div>
      </div>
    </div>
  );
}

/** Uptime & Host Status Card */
function CyberUptimeCard({ load1m, load5m, load15m, onClick, onConfigure, t, uptime }: { load1m?: SystemMetric; load5m?: SystemMetric; load15m?: SystemMetric; onClick: () => void; onConfigure?: () => void; t: (key: TranslationKey) => string; uptime?: SystemMetric }) {
  const wide = useWideTile();
  return (
    <div
      className={`sys-card sys-host-card ${wide ? "sys-host-card--wide" : ""}`}
      onClick={onClick}
      role="button"
      style={{
        boxSizing: "border-box",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        minHeight: "calc(var(--u) * 16)",
        position: "relative",
      }}
      tabIndex={0}
    >
      <div className="sys-card__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: wide ? 12 : 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "calc(var(--u) * 0.8)" }}>
          <span className="sys-card__icon" style={{ color: "#10b981", filter: "drop-shadow(0 0 6px rgba(16,185,129,0.5))" }}>
            <HDIcon name="clock" size={18} />
          </span>
          <span className="sys-card__title" style={{ fontWeight: 600 }}>{t("systemUptime")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="sys-live-dot" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75em", color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "sys-pulse 2s infinite ease-in-out" }} />
            <span>Active</span>
          </div>
          {onConfigure && (
            <button
              aria-label={t("selectSensor")}
              className="sys-gauge-cfg-btn"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--ink)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                opacity: 0.7,
              }}
              title={t("selectSensor")}
              type="button"
            >
              <HDIcon name="settings" size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: wide ? "row" : "column", justifyContent: "space-between", alignItems: wide ? "center" : "stretch", gap: 12 }}>
        <div className="sys-host-uptime">
          <strong className="sys-host-uptime__value" style={{ font: "700 calc(var(--u) * 2.2)/1.1 var(--f-body)", color: "var(--ink)" }}>
            {uptime?.formatted || "Đang hoạt động"}
          </strong>
        </div>

        {(load1m || load5m || load15m) && (
          <div className="sys-load-pills" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75em", opacity: 0.7 }}>Load:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {load1m && (
                <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 6, fontSize: "0.8em", fontWeight: 600 }}>
                  <small style={{ opacity: 0.6 }}>1m </small>{load1m.value.toFixed(2)}
                </span>
              )}
              {load5m && (
                <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 6, fontSize: "0.8em", fontWeight: 600 }}>
                  <small style={{ opacity: 0.6 }}>5m </small>{load5m.value.toFixed(2)}
                </span>
              )}
              {load15m && (
                <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 6, fontSize: "0.8em", fontWeight: 600 }}>
                  <small style={{ opacity: 0.6 }}>15m </small>{load15m.value.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 24h Area Trend Chart Card */
function CyberTrendCard({ color = "#3b82f6", history, label, onClick, unit = "%", value }: { color?: string; history?: any[] | null; label: string; onClick?: () => void; unit?: string; value?: string | number }) {
  return (
    <div
      className="sys-trend-card"
      onClick={onClick}
      role="button"
      style={{
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        minHeight: "calc(var(--u) * 16)",
      }}
      tabIndex={0}
    >
      <div className="sys-trend-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, filter: `drop-shadow(0 0 4px ${color})` }} />
          <span style={{ fontWeight: 600 }}>{label}</span>
        </div>
        <strong style={{ color, font: "700 calc(var(--u) * 1.8)/1 var(--f-body)" }}>{value != null ? `${value}` : ""}</strong>
      </div>
      <div className="sys-trend-chart" style={{ flex: 1, minHeight: 48, display: "flex", alignItems: "flex-end" }}>
        {history && history.length > 1 ? (
          <Sparkline compact hours={24} points={history} unit={unit} />
        ) : (
          <div style={{ width: "100%", textAlign: "center", opacity: 0.5, fontSize: "0.85em" }}>Đang tải lịch sử...</div>
        )}
      </div>
    </div>
  );
}

/** Candidate sensors helper for pickers & auto-detection */
export function systemCandidates(hass: HomeAssistant) {
  const sensors = Object.values(hass.states).filter((s) => s.entity_id.startsWith("sensor."));
  const byUnit = (unit: string) => sensors.filter((s) => s.attributes.unit_of_measurement === unit);
  const byClass = (cls: string) => sensors.filter((s) => s.attributes.device_class === cls);
  const rank = (list: HassEntity[], words: RegExp) =>
    [...list].sort((a, b) => {
      const aScore = Number(words.test(a.entity_id + " " + String(a.attributes.friendly_name ?? "")));
      const bScore = Number(words.test(b.entity_id + " " + String(b.attributes.friendly_name ?? "")));
      return bScore - aScore;
    });

  return {
    cpu: rank(byUnit("%"), /processor|cpu|tải|load/i),
    memory: rank([...byUnit("%"), ...sensors.filter((s) => String(s.attributes.unit_of_measurement ?? "").includes("B"))], /memory|ram|bộ nhớ/i),
    disk: rank([...byUnit("%"), ...sensors.filter((s) => String(s.attributes.unit_of_measurement ?? "").includes("B"))], /disk|storage|ổ đĩa|dung lượng/i),
    temperature: rank([...byClass("temperature"), ...byUnit("°C"), ...byUnit("°F")], /cpu|processor|soc|nhiệt|temp/i),
    network_in: rank(sensors, /network.*in|throughput.*in|rx|download|tải xuống/i),
    network_out: rank(sensors, /network.*out|throughput.*out|tx|upload|tải lên/i),
    uptime: rank([...byClass("timestamp"), ...sensors], /uptime|last.*boot|khởi động/i),
  };
}

/** Parses sensors from Home Assistant into vitals, prioritizing custom selections */
function parseSystemVitals(hass: HomeAssistant, customSensors?: HomeSmartConfig["system_monitor"]) {
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

  // 1. If custom sensors are configured in config.system_monitor, load them first!
  if (customSensors?.cpu && hass.states[customSensors.cpu]) {
    const s = hass.states[customSensors.cpu];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    if (Number.isFinite(val)) {
      cpu = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "CPU",
        stateObj: s,
        unit: "%",
        value: val,
      };
    }
  }

  if (customSensors?.memory && hass.states[customSensors.memory]) {
    const s = hass.states[customSensors.memory];
    const rawVal = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const u = String(s.attributes.unit_of_measurement ?? "%");
    if (Number.isFinite(rawVal)) {
      let gaugeVal = rawVal;
      if (rawVal > 100 || u.includes("B")) {
        const pctSensor = Object.values(hass.states).find(
          (st) =>
            st.attributes.unit_of_measurement === "%" &&
            (st.entity_id.includes("memory") || st.entity_id.includes("ram") || String(st.attributes.friendly_name ?? "").toLowerCase().includes("memory")) &&
            Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
        );
        if (pctSensor) {
          gaugeVal = Number.parseFloat(String(pctSensor.state).replace(",", "."));
        } else {
          const freeSensor = Object.values(hass.states).find(
            (st) =>
              (st.entity_id.includes("memory_free") || st.entity_id.includes("ram_free")) &&
              Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
          );
          if (freeSensor) {
            const freeVal = Number.parseFloat(String(freeSensor.state).replace(",", "."));
            if (rawVal + freeVal > 0) gaugeVal = (rawVal / (rawVal + freeVal)) * 100;
          }
        }
      }
      memory = {
        entityId: s.entity_id,
        formatted: `${gaugeVal.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "RAM",
        stateObj: s,
        subtitle: rawVal > 100 ? `Đang dùng: ${(rawVal / 1024).toFixed(1)} GB` : undefined,
        unit: "%",
        value: gaugeVal,
      };
    }
  }

  if (customSensors?.disk && hass.states[customSensors.disk]) {
    const s = hass.states[customSensors.disk];
    const rawVal = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const u = String(s.attributes.unit_of_measurement ?? "%");
    if (Number.isFinite(rawVal)) {
      let gaugeVal = rawVal;
      if (rawVal > 100 || u.includes("B")) {
        const pctSensor = Object.values(hass.states).find(
          (st) =>
            st.attributes.unit_of_measurement === "%" &&
            (st.entity_id.includes("disk") || st.entity_id.includes("storage")) &&
            Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
        );
        if (pctSensor) {
          gaugeVal = Number.parseFloat(String(pctSensor.state).replace(",", "."));
        }
      }
      disk = {
        entityId: s.entity_id,
        formatted: `${gaugeVal.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "Disk",
        stateObj: s,
        unit: "%",
        value: gaugeVal,
      };
    }
  }

  if (customSensors?.temperature && hass.states[customSensors.temperature]) {
    const s = hass.states[customSensors.temperature];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    if (Number.isFinite(val)) {
      temp = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}°C`,
        name: s.attributes.friendly_name ?? "CPU Temp",
        stateObj: s,
        unit: "°C",
        value: val,
      };
    }
  }

  if (customSensors?.network_in && hass.states[customSensors.network_in]) {
    const s = hass.states[customSensors.network_in];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const unit = String(s.attributes.unit_of_measurement ?? "");
    netIn = {
      entityId: s.entity_id,
      formatted: Number.isFinite(val) ? `${val.toFixed(1)} ${unit}` : s.state,
      name: s.attributes.friendly_name ?? "Network In",
      stateObj: s,
      unit,
      value: Number.isFinite(val) ? val : 0,
    };
  }

  if (customSensors?.network_out && hass.states[customSensors.network_out]) {
    const s = hass.states[customSensors.network_out];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const unit = String(s.attributes.unit_of_measurement ?? "");
    netOut = {
      entityId: s.entity_id,
      formatted: Number.isFinite(val) ? `${val.toFixed(1)} ${unit}` : s.state,
      name: s.attributes.friendly_name ?? "Network Out",
      stateObj: s,
      unit,
      value: Number.isFinite(val) ? val : 0,
    };
  }

  if (customSensors?.uptime && hass.states[customSensors.uptime]) {
    const s = hass.states[customSensors.uptime];
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

  const allSystemEntities: DiscoveredEntity[] = [];

  for (const s of states) {
    if (!s.entity_id.startsWith("sensor.")) continue;

    const id = s.entity_id.toLowerCase();
    const friendly = String(s.attributes.friendly_name ?? "").toLowerCase();
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
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
        device_class: (s.attributes.device_class as string | undefined) ?? null,
        device_id: null,
        domain: "sensor",
        entity_id: s.entity_id,
        icon: typeof s.attributes.icon === "string" ? s.attributes.icon : null,
        name: s.attributes.friendly_name ?? s.entity_id,
      });
    }

    // CPU Usage
    if (
      !cpu &&
      hasNum &&
      (id.includes("processor_use") ||
        id.includes("cpu_percent") ||
        id.includes("cpu_usage") ||
        id.includes("processor_percent") ||
        ((friendly.includes("processor") || friendly.includes("cpu")) && (unit === "%" || friendly.includes("use") || friendly.includes("usage"))))
    ) {
      cpu = {
        entityId: s.entity_id,
        formatted: `${val.toFixed(1)}%`,
        name: s.attributes.friendly_name ?? "CPU",
        stateObj: s,
        unit: "%",
        value: val,
      };
    }

    // Memory / RAM Usage %
    const isMemCandidate =
      hasNum &&
      (id.includes("memory_use_percent") ||
        id.includes("memory_usage") ||
        id.includes("ram_percent") ||
        id.includes("ram_usage") ||
        id.includes("memory_percent") ||
        ((id.includes("memory") || id.includes("ram")) && (unit === "%" || friendly.includes("usage") || friendly.includes("use"))) ||
        ((friendly.includes("memory") || friendly.includes("ram")) && (unit === "%" || friendly.includes("usage") || friendly.includes("use"))));

    if (isMemCandidate) {
      const isPercent = unit === "%" || (val <= 100 && !unit.includes("B"));
      if (!memory || (isPercent && memory.value > 100)) {
        let gaugeVal = val;
        if (gaugeVal > 100) {
          const freeSensor = states.find(
            (st) =>
              (st.entity_id.includes("memory_free") || st.entity_id.includes("ram_free")) &&
              Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
          );
          if (freeSensor) {
            const freeVal = Number.parseFloat(String(freeSensor.state).replace(",", "."));
            if (gaugeVal + freeVal > 0) gaugeVal = (gaugeVal / (gaugeVal + freeVal)) * 100;
          }
        }
        if (isPercent || gaugeVal <= 100 || !memory) {
          memory = {
            entityId: s.entity_id,
            formatted: `${gaugeVal.toFixed(1)}%`,
            name: s.attributes.friendly_name ?? "RAM",
            stateObj: s,
            unit: "%",
            value: gaugeVal,
          };
        }
      }
    }

    // Disk Usage %
    const isDiskCandidate =
      hasNum &&
      (id.includes("disk_use_percent") ||
        id.includes("disk_usage") ||
        id.includes("storage_usage") ||
        id.includes("disk_use") ||
        id.includes("storage_use") ||
        ((friendly.includes("disk") || friendly.includes("storage") || friendly.includes("ổ đĩa")) && (unit === "%" || friendly.includes("use") || friendly.includes("usage"))));

    if (isDiskCandidate) {
      const isPercent = unit === "%" || (val <= 100 && !unit.includes("B"));
      if (!disk || (isPercent && disk.value > 100)) {
        disk = {
          entityId: s.entity_id,
          formatted: `${val.toFixed(1)}%`,
          name: s.attributes.friendly_name ?? "Disk",
          stateObj: s,
          unit: "%",
          value: val,
        };
      }
    }

    // CPU Temperature
    if (
      !temp &&
      hasNum &&
      (s.attributes.device_class === "temperature" || unit === "°C" || unit === "°F") &&
      (id.includes("cpu") ||
        id.includes("processor") ||
        id.includes("soc") ||
        id.includes("core_temp") ||
        friendly.includes("processor temp") ||
        friendly.includes("cpu temp"))
    ) {
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
    if (
      !netIn &&
      (id.includes("network_in") ||
        id.includes("throughput_in") ||
        id.includes("rx_") ||
        id.includes("download") ||
        friendly.includes("network in") ||
        friendly.includes("download"))
    ) {
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
    if (
      !netOut &&
      (id.includes("network_out") ||
        id.includes("throughput_out") ||
        id.includes("tx_") ||
        id.includes("upload") ||
        friendly.includes("network out") ||
        friendly.includes("upload"))
    ) {
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
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    if (!Number.isFinite(val)) continue;
    if (memory && !memory.subtitle) {
      if ((id.includes("memory_use") || id.includes("ram_use")) && String(s.attributes.unit_of_measurement ?? "").includes("MiB")) {
        const gb = (val / 1024).toFixed(1);
        memory.subtitle = `Đang dùng: ${gb} GB`;
      } else if ((id.includes("memory_free") || id.includes("ram_free")) && String(s.attributes.unit_of_measurement ?? "").includes("MiB")) {
        const gb = (val / 1024).toFixed(1);
        memory.subtitle = `Còn trống: ${gb} GB`;
      }
    }
    if (disk && !disk.subtitle) {
      if (id.includes("disk_free") || id.includes("storage_free")) {
        const unit = s.attributes.unit_of_measurement ?? "GB";
        disk.subtitle = `Còn trống: ${val.toFixed(1)} ${unit}`;
      }
    }
  }

  return { cpu, memory, disk, temp, netIn, netOut, uptime, load1m, load5m, load15m, allSystemEntities };
}
