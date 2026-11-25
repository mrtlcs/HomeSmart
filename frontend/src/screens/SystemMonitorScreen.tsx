import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ContextHeader } from "../components/ContextHeader";
import { EditableGrid, type GridItem, useWideTile } from "../components/EditableGrid";
import { EntityCard } from "../components/EntityCard";
import { EntityModal } from "../components/EntityModal";
import { EntityPicker } from "../components/EntityPicker";
import { HDIcon, type IconName } from "../components/HDIcon";
import { SensorStyledCard, SensorStylePicker } from "../components/SensorVisuals";
import { useHistory } from "../history";
import type { TranslationKey } from "../i18n";
import { arrange, entityKey, getLayout, keyId } from "../layout";
import { usePlan } from "../plan";
import type { HomeSmartConfig, ScreenLayout, SensorDisplayOptions } from "../types/config";
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

type SystemSensorField = Exclude<keyof NonNullable<HomeSmartConfig["system_monitor"]>, "styles">;

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

function formatDuration(diffMs: number, language?: string): string {
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
  const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
  const isVi = (language ?? "").toLowerCase().startsWith("vi");
  if (isVi) return days > 0 ? `${days} ngày ${hours} giờ` : `${hours} giờ ${mins} phút`;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
}

export function SystemMonitorScreen(props: ScreenProps & { embedded?: boolean }) {
  const { catalogRooms, config, editing, hass, language, onConfig, onLayout, onSettings, t } = props;
  const [modalEntity, setModalEntity] = useState<DiscoveredEntity | null>(null);
  const [configuringMetric, setConfiguringMetric] = useState<{ field: SystemSensorField; sysKey: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const screen = useRef<HTMLElement>(null);
  const plan = usePlan();

  useSwipeGesture(screen, {
    disabled: editing || Boolean(props.embedded),
    onSwipeRight: () => {
      window.dispatchEvent(new CustomEvent("homesmart-navigate", { detail: "home" }));
    },
  });

  // Cache candidate system entity ids by total sensor count so frequent state ticks do not scan every HA entity.
  const entityCountKey = useMemo(() => Object.keys(hass.states).length, [hass.states]);
  const systemIdSet = useMemo(() => collectSystemEntityIds(hass), [entityCountKey]);

  const { cpu, memory, disk, temp, netIn, netOut, uptime, load1m, load5m, load15m, allSystemEntities } = useMemo(
    () => parseSystemVitals(hass, config.system_monitor, systemIdSet, t, language),
    [hass.states, config.system_monitor, systemIdSet, t, language],
  );

  // Sparkline history for the 3 main vitals
  const cpuHistory = useHistory(hass, cpu?.entityId, 24);
  const memHistory = useHistory(hass, memory?.entityId, 24);
  const tempHistory = useHistory(hass, temp?.entityId, 24);

  const rawLayout = getLayout(config, "system");
  const everywhere = useMemo(() => entityIndex(catalogRooms), [catalogRooms]);

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

  const layout: ScreenLayout = useMemo(() => {
    const isFirstTime =
      rawLayout.order.length === 0 &&
      rawLayout.wide.length === 0 &&
      Object.keys(rawLayout.sections ?? {}).length === 0 &&
      Object.keys(rawLayout.folders ?? {}).length === 0 &&
      Object.keys(rawLayout.lists ?? {}).length === 0;
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

  const handleSetSensor = (metricKey: SystemSensorField, entityId: string) => {
    onConfig((cur) => ({
      ...cur,
      system_monitor: {
        ...(cur.system_monitor ?? {}),
        [metricKey]: entityId || undefined,
      },
    }));
  };

  const handleSetStyle = (sysKey: string, nextStyle: SensorDisplayOptions) => {
    onConfig((cur) => {
      const prevStyles = cur.system_monitor?.styles ?? {};
      const clean: SensorDisplayOptions = {
        ...(nextStyle.style && nextStyle.style !== "default" ? { style: nextStyle.style } : {}),
        ...(nextStyle.color ? { color: nextStyle.color } : {}),
        ...(typeof nextStyle.min === "number" ? { min: nextStyle.min } : {}),
        ...(typeof nextStyle.max === "number" ? { max: nextStyle.max } : {}),
      };
      const updated = { ...prevStyles, [sysKey]: clean };
      if (Object.keys(clean).length === 0) delete updated[sysKey];
      return {
        ...cur,
        system_monitor: {
          ...(cur.system_monitor ?? {}),
          styles: updated,
        },
      };
    });
  };

  const metricStyles = config.system_monitor?.styles ?? {};

  const items: GridItem[] = visible.map((key) => {
    if (key === "sys:cpu") {
      const cfg = metricStyles["sys:cpu"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gauge";
      return {
        key,
        label: t("cpuUsage"),
        node: (
          <SensorStyledCard
            color={cfg?.color ?? "#38bdf8"}
            entityId={cpu?.entityId}
            externalHistory={mode === "gauge" ? undefined : cpuHistory}
            formattedValue={cpu?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="monitor" size={16} />}
            label={t("cpuUsage")}
            language={language}
            max={cfg?.max ?? 100}
            min={cfg?.min ?? 0}
            onClick={() => (cpu?.stateObj ? setModalEntity(asEntity(cpu.stateObj)) : setConfiguringMetric({ field: "cpu", sysKey: "sys:cpu" }))}
            onConfigure={() => setConfiguringMetric({ field: "cpu", sysKey: "sys:cpu" })}
            styleMode={mode}
            subtitle={cpu?.subtitle || (load1m ? `${t("sysLoadLabel")} ${load1m.value.toFixed(2)}` : undefined)}
            t={t}
            unit="%"
            value={cpu?.value ?? null}
          />
        ),
      };
    }
    if (key === "sys:ram") {
      const cfg = metricStyles["sys:ram"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gauge";
      return {
        key,
        label: t("ramUsage"),
        node: (
          <SensorStyledCard
            color={cfg?.color ?? "#10b981"}
            detail={memory?.subtitle}
            entityId={memory?.entityId}
            externalHistory={mode === "gauge" ? undefined : memHistory}
            formattedValue={memory?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="grid" size={16} />}
            label={t("ramUsage")}
            language={language}
            max={cfg?.max ?? 100}
            min={cfg?.min ?? 0}
            onClick={() => (memory?.stateObj ? setModalEntity(asEntity(memory.stateObj)) : setConfiguringMetric({ field: "memory", sysKey: "sys:ram" }))}
            onConfigure={() => setConfiguringMetric({ field: "memory", sysKey: "sys:ram" })}
            styleMode={mode}
            t={t}
            unit="%"
            value={memory?.value ?? null}
          />
        ),
      };
    }
    if (key === "sys:disk") {
      const cfg = metricStyles["sys:disk"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gauge";
      return {
        key,
        label: t("diskUsage"),
        node: (
          <SensorStyledCard
            color={cfg?.color ?? "#f59e0b"}
            detail={disk?.subtitle}
            entityId={disk?.entityId}
            formattedValue={disk?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="server" size={16} />}
            label={t("diskUsage")}
            language={language}
            max={cfg?.max ?? 100}
            min={cfg?.min ?? 0}
            onClick={() => (disk?.stateObj ? setModalEntity(asEntity(disk.stateObj)) : setConfiguringMetric({ field: "disk", sysKey: "sys:disk" }))}
            onConfigure={() => setConfiguringMetric({ field: "disk", sysKey: "sys:disk" })}
            styleMode={mode}
            t={t}
            unit="%"
            value={disk?.value ?? null}
          />
        ),
      };
    }
    if (key === "sys:temp") {
      const cfg = metricStyles["sys:temp"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gauge";
      const tempStatus = temp?.value != null
        ? temp.value < 55
          ? t("sysTempCool")
          : temp.value < 72
          ? t("sysTempNormal")
          : temp.value < 82
          ? t("sysTempWarm")
          : t("sysTempHot")
        : undefined;
      return {
        key,
        label: t("cpuTemp"),
        node: (
          <SensorStyledCard
            color={cfg?.color ?? getTempColor(temp?.value)}
            entityId={temp?.entityId}
            externalHistory={mode === "gauge" ? undefined : tempHistory}
            formattedValue={temp?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="flame" size={16} />}
            label={t("cpuTemp")}
            language={language}
            max={cfg?.max ?? 100}
            min={cfg?.min ?? 0}
            onClick={() => (temp?.stateObj ? setModalEntity(asEntity(temp.stateObj)) : setConfiguringMetric({ field: "temperature", sysKey: "sys:temp" }))}
            onConfigure={() => setConfiguringMetric({ field: "temperature", sysKey: "sys:temp" })}
            styleMode={mode}
            subtitle={temp?.subtitle || tempStatus}
            t={t}
            unit="°C"
            value={temp?.value ?? null}
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
              else setConfiguringMetric({ field: "network_in", sysKey: "sys:network" });
            }}
            onConfigure={() => setConfiguringMetric({ field: "network_in", sysKey: "sys:network" })}
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
            onClick={() => (uptime?.stateObj ? setModalEntity(asEntity(uptime.stateObj)) : setConfiguringMetric({ field: "uptime", sysKey: "sys:uptime" }))}
            onConfigure={() => setConfiguringMetric({ field: "uptime", sysKey: "sys:uptime" })}
            t={t}
            uptime={uptime}
          />
        ),
      };
    }
    if (key === "sys:chart_cpu") {
      const cfg = metricStyles["sys:chart_cpu"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gradient";
      return {
        key,
        label: `${t("cpuUsage")} (24h)`,
        node: (
          <SensorStyledCard
            color={cfg?.color ?? "#38bdf8"}
            entityId={cpu?.entityId}
            externalHistory={cpuHistory}
            formattedValue={cpu?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="monitor" size={16} />}
            label={`${t("cpuUsage")} (%)`}
            language={language}
            onClick={() => cpu?.stateObj && setModalEntity(asEntity(cpu.stateObj))}
            onConfigure={() => setConfiguringMetric({ field: "cpu", sysKey: "sys:chart_cpu" })}
            styleMode={mode}
            t={t}
            unit="%"
            value={cpu?.value ?? null}
          />
        ),
      };
    }
    if (key === "sys:chart_temp") {
      const cfg = metricStyles["sys:chart_temp"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gradient";
      return {
        key,
        label: `${t("cpuTemp")} (24h)`,
        node: (
          <SensorStyledCard
            color={cfg?.color ?? "#ef4444"}
            entityId={temp?.entityId}
            externalHistory={tempHistory}
            formattedValue={temp?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="flame" size={16} />}
            label={`${t("cpuTemp")} (°C)`}
            language={language}
            onClick={() => temp?.stateObj && setModalEntity(asEntity(temp.stateObj))}
            onConfigure={() => setConfiguringMetric({ field: "temperature", sysKey: "sys:chart_temp" })}
            styleMode={mode}
            t={t}
            unit="°C"
            value={temp?.value ?? null}
          />
        ),
      };
    }
    if (key === "sys:chart_ram") {
      const cfg = metricStyles["sys:chart_ram"];
      const mode = cfg?.style && cfg.style !== "default" ? cfg.style : "gradient";
      return {
        key,
        label: `${t("ramUsage")} (24h)`,
        node: (
          <SensorStyledCard
            color={cfg?.color ?? "#10b981"}
            entityId={memory?.entityId}
            externalHistory={memHistory}
            formattedValue={memory?.formatted ?? "—"}
            hass={hass}
            icon={<HDIcon name="grid" size={16} />}
            label={`${t("ramUsage")} (%)`}
            language={language}
            onClick={() => memory?.stateObj && setModalEntity(asEntity(memory.stateObj))}
            onConfigure={() => setConfiguringMetric({ field: "memory", sysKey: "sys:chart_ram" })}
            styleMode={mode}
            t={t}
            unit="%"
            value={memory?.value ?? null}
          />
        ),
      };
    }

    // Custom or added sensor entity (uses personalized entity options, e.g. gauge/line/bar/gradient)
    const entityId = keyId(key);
    const rawState = hass.states[entityId];
    const entity = everywhere.byId.get(entityId) || (rawState ? asEntity(rawState) : null);
    if (!entity) {
      return {
        key,
        label: entityId,
        removal: "remove",
        node: <div className="device-tile device-tile--unavailable"><div className="device-tile__copy"><strong>{entityId}</strong><span>{t("unavailable")}</span></div></div>,
      };
    }
    return {
      key,
      label: entity.name,
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
    switch (configuringMetric?.field) {
      case "cpu": return t("cpuUsage");
      case "memory": return t("ramUsage");
      case "disk": return t("diskUsage");
      case "temperature": return t("cpuTemp");
      case "network_in": return t("networkIn");
      case "network_out": return t("networkOut");
      case "uptime": return t("systemUptime");
      default: return "";
    }
  }, [configuringMetric, t]);

  const supportsStyleConfig = configuringMetric
    ? ["sys:cpu", "sys:ram", "sys:disk", "sys:temp", "sys:chart_cpu", "sys:chart_temp", "sys:chart_ram"].includes(configuringMetric.sysKey)
    : false;

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
            sections
            sizable
            t={t}
            vehicles={false}
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
          currentId={config.system_monitor?.[configuringMetric.field]}
          currentStyle={metricStyles[configuringMetric.sysKey]}
          hass={hass}
          metricKey={configuringMetric.field}
          metricTitle={configuringTitle}
          onChangeStyle={supportsStyleConfig ? (style) => handleSetStyle(configuringMetric.sysKey, style) : undefined}
          onClose={() => setConfiguringMetric(null)}
          onSelect={(id) => handleSetSensor(configuringMetric.field, id)}
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

/** Direct Sensor & Card Style Selector Modal */
function SystemSensorModal({
  currentId,
  currentStyle,
  hass,
  metricKey,
  metricTitle,
  onChangeStyle,
  onClose,
  onSelect,
  t,
}: {
  currentId?: string;
  currentStyle?: SensorDisplayOptions;
  hass: HomeAssistant;
  metricKey: SystemSensorField;
  metricTitle: string;
  onChangeStyle?: (style: SensorDisplayOptions) => void;
  onClose: () => void;
  onSelect: (entityId: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [search, setSearch] = useState("");
  const candidates = useMemo(() => systemCandidates(hass)[metricKey] ?? [], [hass.states, metricKey]);
  const allSensors = useMemo(
    () => Object.values(hass.states).filter((s) => s.entity_id.startsWith("sensor.")),
    [hass.states],
  );

  const filteredSensors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return candidates.slice(0, 35);
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
          maxHeight: "86vh",
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
            aria-label={t("close")}
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

        {onChangeStyle && (
          <div style={{ padding: "calc(var(--u) * 1.4) calc(var(--u) * 2.2)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <SensorStylePicker
              onChange={onChangeStyle}
              showDefault={false}
              t={t}
              value={{
                ...currentStyle,
                style: currentStyle?.style ?? "gauge",
              }}
            />
          </div>
        )}

        <div style={{ padding: "calc(var(--u) * 1.4) calc(var(--u) * 2.2)" }}>
          <input
            className="st-input st-input--framed"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("sysSearchSensorPlaceholder")}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: "14px" }}
            type="text"
            value={search}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 calc(var(--u) * 2.2) calc(var(--u) * 2)" }}>
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
              <small style={{ opacity: 0.6 }}>{t("sysAutoDetectDesc")}</small>
            </div>
            {!currentId && <HDIcon name="check" size={18} />}
          </button>

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
    document.querySelector(".app-shell") || document.body,
  );
}

function getTempColor(temp?: number): string {
  if (temp == null) return "#38bdf8";
  if (temp < 55) return "#38bdf8";
  if (temp < 72) return "#10b981";
  if (temp < 82) return "#f59e0b";
  return "#ef4444";
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
          <span style={{ fontSize: "0.75em", opacity: 0.8, background: "rgba(56,189,248,0.15)", color: "#38bdf8", padding: "2px 8px", borderRadius: 999 }}>{t("sysRealtime")}</span>
          {onConfigure && (
            <button
              aria-label={t("selectSensor")}
              className="sys-gauge-cfg-btn sys-gauge-cfg-btn--inline"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
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
            <span>{t("sysActive")}</span>
          </div>
          {onConfigure && (
            <button
              aria-label={t("selectSensor")}
              className="sys-gauge-cfg-btn sys-gauge-cfg-btn--inline"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
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
            {uptime?.formatted || t("sysOperating")}
          </strong>
        </div>

        {(load1m || load5m || load15m) && (
          <div className="sys-load-pills" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75em", opacity: 0.7 }}>{t("sysLoadLabel")}</span>
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

/** Collects candidate system entity ids once when entity count changes to avoid full scans on every tick. */
function collectSystemEntityIds(hass: HomeAssistant): string[] {
  const ids: string[] = [];
  for (const s of Object.values(hass.states)) {
    if (!s.entity_id.startsWith("sensor.")) continue;
    const id = s.entity_id.toLowerCase();
    const friendly = String(s.attributes.friendly_name ?? "").toLowerCase();
    const unit = String(s.attributes.unit_of_measurement ?? "");
    const devClass = String(s.attributes.device_class ?? "");
    if (
      id.includes("processor") ||
      id.includes("cpu") ||
      id.includes("memory") ||
      id.includes("ram") ||
      id.includes("disk") ||
      id.includes("storage") ||
      id.includes("network_in") ||
      id.includes("network_out") ||
      id.includes("throughput") ||
      id.includes("rx_") ||
      id.includes("tx_") ||
      id.includes("download") ||
      id.includes("upload") ||
      id.includes("last_boot") ||
      id.includes("uptime") ||
      id.includes("load_") ||
      id.includes("glances") ||
      id.includes("systemmonitor") ||
      id.includes("proxmox") ||
      id.includes("swap") ||
      id.includes("soc") ||
      id.includes("core_temp") ||
      friendly.includes("processor") ||
      friendly.includes("cpu") ||
      friendly.includes("memory") ||
      friendly.includes("ram") ||
      friendly.includes("disk") ||
      friendly.includes("storage") ||
      friendly.includes("ổ đĩa") ||
      friendly.includes("uptime") ||
      friendly.includes("last boot") ||
      devClass === "temperature" ||
      devClass === "timestamp" ||
      unit === "°C" ||
      unit === "°F"
    ) {
      ids.push(s.entity_id);
    }
  }
  return ids;
}

/** Parses cached system entities into vitals, prioritizing custom selections */
function parseSystemVitals(
  hass: HomeAssistant,
  customSensors: HomeSmartConfig["system_monitor"] | undefined,
  candidateIds: string[],
  t: (key: TranslationKey) => string,
  language?: string,
) {
  const states = candidateIds.map((id) => hass.states[id]).filter((s): s is HassEntity => Boolean(s));

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

  if (customSensors?.cpu && hass.states[customSensors.cpu]) {
    const s = hass.states[customSensors.cpu];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    if (Number.isFinite(val)) {
      cpu = { entityId: s.entity_id, formatted: `${val.toFixed(1)}%`, name: s.attributes.friendly_name ?? "CPU", stateObj: s, unit: "%", value: val };
    }
  }

  if (customSensors?.memory && hass.states[customSensors.memory]) {
    const s = hass.states[customSensors.memory];
    const rawVal = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const u = String(s.attributes.unit_of_measurement ?? "%");
    if (Number.isFinite(rawVal)) {
      let gaugeVal = rawVal;
      if (rawVal > 100 || u.includes("B")) {
        const pctSensor = states.find(
          (st) =>
            st.attributes.unit_of_measurement === "%" &&
            (st.entity_id.includes("memory") || st.entity_id.includes("ram") || String(st.attributes.friendly_name ?? "").toLowerCase().includes("memory")) &&
            Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
        );
        if (pctSensor) {
          gaugeVal = Number.parseFloat(String(pctSensor.state).replace(",", "."));
        } else {
          const freeSensor = states.find(
            (st) => (st.entity_id.includes("memory_free") || st.entity_id.includes("ram_free")) && Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
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
        subtitle: rawVal > 100 ? `${t("sysUsedLabel")} ${(rawVal / 1024).toFixed(1)} GB` : undefined,
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
        const pctSensor = states.find(
          (st) => st.attributes.unit_of_measurement === "%" && (st.entity_id.includes("disk") || st.entity_id.includes("storage")) && Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
        );
        if (pctSensor) gaugeVal = Number.parseFloat(String(pctSensor.state).replace(",", "."));
      }
      disk = { entityId: s.entity_id, formatted: `${gaugeVal.toFixed(1)}%`, name: s.attributes.friendly_name ?? "Disk", stateObj: s, unit: "%", value: gaugeVal };
    }
  }

  if (customSensors?.temperature && hass.states[customSensors.temperature]) {
    const s = hass.states[customSensors.temperature];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    if (Number.isFinite(val)) {
      temp = { entityId: s.entity_id, formatted: `${val.toFixed(1)}°C`, name: s.attributes.friendly_name ?? "CPU Temp", stateObj: s, unit: "°C", value: val };
    }
  }

  if (customSensors?.network_in && hass.states[customSensors.network_in]) {
    const s = hass.states[customSensors.network_in];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const unit = String(s.attributes.unit_of_measurement ?? "");
    netIn = { entityId: s.entity_id, formatted: Number.isFinite(val) ? `${val.toFixed(1)} ${unit}` : s.state, name: s.attributes.friendly_name ?? "Network In", stateObj: s, unit, value: Number.isFinite(val) ? val : 0 };
  }

  if (customSensors?.network_out && hass.states[customSensors.network_out]) {
    const s = hass.states[customSensors.network_out];
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    const unit = String(s.attributes.unit_of_measurement ?? "");
    netOut = { entityId: s.entity_id, formatted: Number.isFinite(val) ? `${val.toFixed(1)} ${unit}` : s.state, name: s.attributes.friendly_name ?? "Network Out", stateObj: s, unit, value: Number.isFinite(val) ? val : 0 };
  }

  if (customSensors?.uptime && hass.states[customSensors.uptime]) {
    const s = hass.states[customSensors.uptime];
    let uptimeText = s.state;
    if (s.attributes.device_class === "timestamp" || !Number.isNaN(Date.parse(s.state))) {
      const diffMs = Date.now() - Date.parse(s.state);
      if (diffMs > 0) uptimeText = formatDuration(diffMs, language);
    }
    uptime = { entityId: s.entity_id, formatted: uptimeText, name: s.attributes.friendly_name ?? "Uptime", stateObj: s, unit: "", value: 0 };
  }

  const allSystemEntities: DiscoveredEntity[] = [];

  for (const s of states) {
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
      allSystemEntities.push(asEntity(s));
    }

    if (
      !cpu &&
      hasNum &&
      (id.includes("processor_use") ||
        id.includes("cpu_percent") ||
        id.includes("cpu_usage") ||
        id.includes("processor_percent") ||
        ((friendly.includes("processor") || friendly.includes("cpu")) && (unit === "%" || friendly.includes("use") || friendly.includes("usage"))))
    ) {
      cpu = { entityId: s.entity_id, formatted: `${val.toFixed(1)}%`, name: s.attributes.friendly_name ?? "CPU", stateObj: s, unit: "%", value: val };
    }

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
            (st) => (st.entity_id.includes("memory_free") || st.entity_id.includes("ram_free")) && Number.isFinite(Number.parseFloat(String(st.state).replace(",", "."))),
          );
          if (freeSensor) {
            const freeVal = Number.parseFloat(String(freeSensor.state).replace(",", "."));
            if (gaugeVal + freeVal > 0) gaugeVal = (gaugeVal / (gaugeVal + freeVal)) * 100;
          }
        }
        if (isPercent || gaugeVal <= 100 || !memory) {
          memory = { entityId: s.entity_id, formatted: `${gaugeVal.toFixed(1)}%`, name: s.attributes.friendly_name ?? "RAM", stateObj: s, unit: "%", value: gaugeVal };
        }
      }
    }

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
        disk = { entityId: s.entity_id, formatted: `${val.toFixed(1)}%`, name: s.attributes.friendly_name ?? "Disk", stateObj: s, unit: "%", value: val };
      }
    }

    if (
      !temp &&
      hasNum &&
      (s.attributes.device_class === "temperature" || unit === "°C" || unit === "°F") &&
      (id.includes("cpu") || id.includes("processor") || id.includes("soc") || id.includes("core_temp") || friendly.includes("processor temp") || friendly.includes("cpu temp"))
    ) {
      temp = { entityId: s.entity_id, formatted: `${val.toFixed(1)}°C`, name: s.attributes.friendly_name ?? "CPU Temp", stateObj: s, unit: "°C", value: val };
    }

    if (!netIn && (id.includes("network_in") || id.includes("throughput_in") || id.includes("rx_") || id.includes("download") || friendly.includes("network in") || friendly.includes("download"))) {
      netIn = { entityId: s.entity_id, formatted: hasNum ? `${val.toFixed(1)} ${unit}` : s.state, name: s.attributes.friendly_name ?? "Network In", stateObj: s, unit, value: hasNum ? val : 0 };
    }

    if (!netOut && (id.includes("network_out") || id.includes("throughput_out") || id.includes("tx_") || id.includes("upload") || friendly.includes("network out") || friendly.includes("upload"))) {
      netOut = { entityId: s.entity_id, formatted: hasNum ? `${val.toFixed(1)} ${unit}` : s.state, name: s.attributes.friendly_name ?? "Network Out", stateObj: s, unit, value: hasNum ? val : 0 };
    }

    if (!uptime && (id.endsWith("last_boot") || id.endsWith("uptime") || friendly.includes("last boot") || friendly.includes("uptime"))) {
      let uptimeText = s.state;
      if (s.attributes.device_class === "timestamp" || !Number.isNaN(Date.parse(s.state))) {
        const diffMs = Date.now() - Date.parse(s.state);
        if (diffMs > 0) uptimeText = formatDuration(diffMs, language);
      }
      uptime = { entityId: s.entity_id, formatted: uptimeText, name: s.attributes.friendly_name ?? "Uptime", stateObj: s, unit: "", value: 0 };
    }

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

  for (const s of states) {
    const id = s.entity_id.toLowerCase();
    const val = Number.parseFloat(String(s.state ?? "").replace(",", "."));
    if (!Number.isFinite(val)) continue;
    if (memory && !memory.subtitle) {
      if ((id.includes("memory_use") || id.includes("ram_use")) && String(s.attributes.unit_of_measurement ?? "").includes("MiB")) {
        memory.subtitle = `${t("sysUsedLabel")} ${(val / 1024).toFixed(1)} GB`;
      } else if ((id.includes("memory_free") || id.includes("ram_free")) && String(s.attributes.unit_of_measurement ?? "").includes("MiB")) {
        memory.subtitle = `${t("sysFreeLabel")} ${(val / 1024).toFixed(1)} GB`;
      }
    }
    if (disk && !disk.subtitle) {
      if (id.includes("disk_free") || id.includes("storage_free")) {
        const unit = s.attributes.unit_of_measurement ?? "GB";
        disk.subtitle = `${t("sysFreeLabel")} ${val.toFixed(1)} ${unit}`;
      }
    }
  }

  return { cpu, memory, disk, temp, netIn, netOut, uptime, load1m, load5m, load15m, allSystemEntities };
}
