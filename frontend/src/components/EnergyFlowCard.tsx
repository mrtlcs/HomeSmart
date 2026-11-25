import { useMemo } from "react";
import type { HomeSmartConfig } from "../types/config";
import type { HomeAssistant } from "../types/home-assistant";

export interface EnergyFlowCardProps {
  config: HomeSmartConfig;
  embedded?: boolean;
  hass: HomeAssistant;
  onOpenEntity?: (entityId: string) => void;
  t: (k: string) => string;
}

type NodeId = "grid" | "solar" | "home" | "battery";

interface FlowNode {
  id: NodeId;
  entityId?: string;
  x: number;
  y: number;
  emoji: string;
  label: string;
  value: string;
  sublabel?: string;
  active: boolean;
  accent: string;
}

interface FlowPath {
  id: string;
  from: NodeId;
  to: NodeId;
  d: string;
  color: string;
  power: number;
  active: boolean;
  dur: number;
}

const NODE_COORDS: Record<NodeId, { x: number; y: number }> = {
  grid: { x: 150, y: 20 },
  solar: { x: 20, y: 150 },
  home: { x: 150, y: 280 },
  battery: { x: 280, y: 150 },
};

function parseEntityNumber(hass: HomeAssistant, entityId: string): number | null {
  if (!entityId) return null;
  const raw = hass.states[entityId]?.state;
  if (raw == null) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function readPowerWatts(hass: HomeAssistant, entityId: string): number | null {
  const value = parseEntityNumber(hass, entityId);
  if (value == null) return null;
  const unit = String(hass.states[entityId]?.attributes?.unit_of_measurement ?? "").trim().toLowerCase();
  if (unit === "kw") return value * 1000;
  if (unit === "mw") return value * 1_000_000;
  return value;
}

function formatPowerValue(watts: number | null): string {
  if (watts == null) return "—";
  const abs = Math.abs(watts);
  if (abs >= 1000) return `${(abs / 1000).toFixed(1)} kW`;
  return `${Math.round(abs)} W`;
}

function computeAnimDuration(powerWatts: number): number {
  return Math.max(1, 8 - Math.abs(powerWatts) / 500);
}

function buildQuadraticPath(from: NodeId, to: NodeId): string {
  const a = NODE_COORDS[from];
  const b = NODE_COORDS[to];
  if ((from === "grid" && to === "home") || (from === "home" && to === "grid")) {
    return `M ${a.x} ${a.y} Q 150 150 ${b.x} ${b.y}`;
  }
  if ((from === "solar" && to === "home") || (from === "home" && to === "solar")) {
    return `M ${a.x} ${a.y} Q 30 270 ${b.x} ${b.y}`;
  }
  if ((from === "battery" && to === "home") || (from === "home" && to === "battery")) {
    return `M ${a.x} ${a.y} Q 270 270 ${b.x} ${b.y}`;
  }
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function EnergyFlowCard({ config, embedded = false, hass, onOpenEntity, t }: EnergyFlowCardProps) {
  const energy = config.energy;

  const { nodes, flows, solarTodayText } = useMemo(() => {
    const hasGrid = Boolean(energy.grid_import || energy.grid_export);
    const hasSolar = Boolean(energy.solar);
    const hasHome = Boolean(energy.consumption);
    const hasBattery = Boolean(energy.battery);

    const homePower = readPowerWatts(hass, energy.consumption);
    const solarPower = readPowerWatts(hass, energy.solar);
    const rawGridImport = readPowerWatts(hass, energy.grid_import);
    const rawGridExport = readPowerWatts(hass, energy.grid_export);

    // Single signed grid sensor: positive imports, negative exports.
    let importPower = 0;
    let exportPower = 0;
    if (rawGridImport != null && rawGridImport < 0 && !energy.grid_export) {
      exportPower = Math.abs(rawGridImport);
    } else {
      if (rawGridImport != null && rawGridImport > 0) importPower = rawGridImport;
      if (rawGridExport != null && rawGridExport > 0) exportPower = rawGridExport;
    }

    const isExporting = exportPower > importPower && exportPower > 10;
    const isImporting = !isExporting && importPower > 10;
    const gridDisplayPower = isExporting ? exportPower : rawGridImport != null ? Math.abs(rawGridImport) : rawGridExport != null ? Math.abs(rawGridExport) : null;

    // Battery can be reported as % (state of charge) or as W/kW power.
    const batteryEntity = energy.battery ? hass.states[energy.battery] : undefined;
    const batteryRaw = parseEntityNumber(hass, energy.battery);
    const batteryUnit = String(batteryEntity?.attributes?.unit_of_measurement ?? "").trim().toLowerCase();
    const batteryDeviceClass = String(batteryEntity?.attributes?.device_class ?? "").trim().toLowerCase();
    const batteryIsPercent = batteryUnit === "%" || batteryDeviceClass === "battery" || (batteryUnit === "" && batteryRaw != null && batteryRaw >= 0 && batteryRaw <= 100);
    const batteryPowerAttr = batteryEntity?.attributes?.power != null ? Number(batteryEntity.attributes.power) : Number.NaN;

    let batteryFlowWatts = 0;
    let batteryCharging = false;
    let batteryDischarging = false;

    if (hasBattery && batteryRaw != null) {
      if (!batteryIsPercent) {
        const watts = readPowerWatts(hass, energy.battery) ?? 0;
        batteryFlowWatts = Math.abs(watts);
        if (watts > 10) batteryCharging = true;
        else if (watts < -10) batteryDischarging = true;
      } else if (Number.isFinite(batteryPowerAttr) && Math.abs(batteryPowerAttr) > 10) {
        batteryFlowWatts = Math.abs(batteryPowerAttr);
        batteryCharging = batteryPowerAttr > 0;
        batteryDischarging = batteryPowerAttr < 0;
      } else if (homePower != null) {
        const netSurplus = (solarPower ?? 0) + importPower - exportPower - homePower;
        batteryFlowWatts = Math.abs(netSurplus);
        if (netSurplus > 10) batteryCharging = true;
        else if (netSurplus < -10) batteryDischarging = true;
      }
    }

    const batteryValue =
      batteryRaw == null
        ? "—"
        : batteryIsPercent
          ? `${Math.round(batteryRaw)}%`
          : formatPowerValue(readPowerWatts(hass, energy.battery));

    const builtNodes: FlowNode[] = [];
    if (hasGrid) {
      builtNodes.push({
        id: "grid",
        entityId: isExporting ? (energy.grid_export || energy.grid_import) : (energy.grid_import || energy.grid_export),
        ...NODE_COORDS.grid,
        emoji: "⚡",
        label: t("energyFlowGrid"),
        value: formatPowerValue(gridDisplayPower),
        sublabel: isExporting ? t("energyFlowExporting") : isImporting ? t("energyFlowImporting") : undefined,
        active: isImporting || isExporting,
        accent: isExporting ? "#34d399" : "#60a5fa",
      });
    }
    if (hasSolar) {
      builtNodes.push({
        id: "solar",
        entityId: energy.solar,
        ...NODE_COORDS.solar,
        emoji: "☀️",
        label: t("energyFlowSolar"),
        value: formatPowerValue(solarPower),
        active: solarPower != null && solarPower > 10,
        accent: "#fbbf24",
      });
    }
    if (hasHome) {
      builtNodes.push({
        id: "home",
        entityId: energy.consumption,
        ...NODE_COORDS.home,
        emoji: "🏠",
        label: t("energyFlowHome"),
        value: formatPowerValue(homePower),
        active: homePower != null && homePower > 0,
        accent: "#f8fafc",
      });
    }
    if (hasBattery) {
      builtNodes.push({
        id: "battery",
        entityId: energy.battery,
        ...NODE_COORDS.battery,
        emoji: "🔋",
        label: t("energyFlowBattery"),
        value: batteryValue,
        active: batteryCharging || batteryDischarging,
        accent: "#a78bfa",
      });
    }

    const visibleIds = new Set(builtNodes.map((n) => n.id));
    const builtFlows: FlowPath[] = [];

    if (visibleIds.has("grid") && visibleIds.has("home")) {
      const from: NodeId = isExporting ? "home" : "grid";
      const to: NodeId = isExporting ? "grid" : "home";
      const activePower = isExporting ? exportPower : isImporting ? importPower : 0;
      builtFlows.push({
        id: "grid-home",
        from,
        to,
        d: buildQuadraticPath(from, to),
        color: isExporting ? "#34d399" : "#60a5fa",
        power: activePower,
        active: isExporting || isImporting,
        dur: computeAnimDuration(activePower),
      });
    }

    if (visibleIds.has("solar") && visibleIds.has("home")) {
      const activePower = solarPower != null && solarPower > 10 ? solarPower : 0;
      builtFlows.push({
        id: "solar-home",
        from: "solar",
        to: "home",
        d: buildQuadraticPath("solar", "home"),
        color: "#fbbf24",
        power: activePower,
        active: activePower > 0,
        dur: computeAnimDuration(activePower),
      });
    }

    if (visibleIds.has("battery") && visibleIds.has("home")) {
      const from: NodeId = batteryCharging ? "home" : "battery";
      const to: NodeId = batteryCharging ? "battery" : "home";
      const active = batteryCharging || batteryDischarging;
      builtFlows.push({
        id: "battery-home",
        from,
        to,
        d: buildQuadraticPath(from, to),
        color: "#a78bfa",
        power: batteryFlowWatts,
        active,
        dur: computeAnimDuration(batteryFlowWatts),
      });
    }

    const todayVal = parseEntityNumber(hass, energy.solar_today);
    const todayUnit = energy.solar_today
      ? String(hass.states[energy.solar_today]?.attributes?.unit_of_measurement ?? "kWh")
      : "";
    const solarToday = todayVal != null ? `${todayVal.toFixed(1)} ${todayUnit}`.trim() : null;

    return { nodes: builtNodes, flows: builtFlows, solarTodayText: solarToday };
  }, [energy, hass.states, t]);

  return (
    <section aria-label={t("energyFlowTitle")} className={`hs-energy-flow${embedded ? " hs-energy-flow--embedded" : ""}`}>
      {!embedded && (
        <header className="hs-energy-flow__header">
          <span className="hs-energy-flow__title">{t("energyFlowTitle")}</span>
          {solarTodayText && (
            <span className="hs-energy-flow__today">
              ☀️ {t("energyToday")}: <strong>{solarTodayText}</strong>
            </span>
          )}
        </header>
      )}

      {nodes.length === 0 ? (
        <div className="hs-energy-flow__empty">{t("energyCardDescription")}</div>
      ) : (
        <div className="hs-energy-flow__stage">
          <svg
            aria-hidden="true"
            className="hs-energy-flow__svg"
            viewBox="0 0 300 300"
          >
            {flows.map((flow) => (
              <g key={flow.id}>
                <path className="hs-energy-flow__track" d={flow.d} />
                {flow.active && (
                  <>
                    <path
                      className="hs-energy-flow__line"
                      d={flow.d}
                      stroke={flow.color}
                      strokeOpacity={0.55}
                    />
                    {[0, 0.5].map((offset) => (
                      <circle
                        className="hs-energy-flow__dot"
                        fill={flow.color}
                        key={offset}
                        r={4.2}
                      >
                        <animateMotion
                          begin={`${(flow.dur * offset).toFixed(2)}s`}
                          dur={`${flow.dur.toFixed(2)}s`}
                          path={flow.d}
                          repeatCount="indefinite"
                        />
                      </circle>
                    ))}
                  </>
                )}
              </g>
            ))}
          </svg>

          {nodes.map((node) => {
            const clickable = Boolean(onOpenEntity && node.entityId);
            const nodeStyle = {
              left: `${(node.x / 300) * 100}%`,
              top: `${(node.y / 300) * 100}%`,
              borderColor: node.active ? `${node.accent}88` : undefined,
              boxShadow: node.active ? `0 0 20px ${node.accent}33, inset 0 1px 0 rgba(255,255,255,0.28)` : undefined,
            };
            const inner = (
              <>
                <span aria-hidden="true" className="hs-energy-flow__icon">
                  {node.emoji}
                </span>
                <span className="hs-energy-flow__label">{node.label}</span>
                <strong className="hs-energy-flow__value">{node.value}</strong>
                {node.sublabel && <span className="hs-energy-flow__sub">{node.sublabel}</span>}
              </>
            );
            return clickable ? (
              <button
                className={`hs-energy-flow__node hs-energy-flow__node--btn hs-energy-flow__node--${node.id}${node.active ? " hs-energy-flow__node--active" : ""}`}
                key={node.id}
                onClick={() => node.entityId && onOpenEntity?.(node.entityId)}
                style={nodeStyle}
                type="button"
              >
                {inner}
              </button>
            ) : (
              <div
                className={`hs-energy-flow__node hs-energy-flow__node--${node.id}${node.active ? " hs-energy-flow__node--active" : ""}`}
                key={node.id}
                style={nodeStyle}
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export const ENERGY_FLOW_CSS: string = String.raw`
.hs-energy-flow {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1.6);
  padding: calc(var(--u, 8px) * 2.2) calc(var(--u, 8px) * 2.4) calc(var(--u, 8px) * 3.4);
  border-radius: calc(var(--u, 8px) * 3.4 * var(--hd-r, 1));
  background: var(--glass, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--hd-frame, var(--line, rgba(255, 255, 255, 0.14)));
  backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  color: var(--ink, #f4f7f5);
  font-family: var(--f-body, system-ui, sans-serif);
}
.hs-energy-flow--embedded {
  padding: calc(var(--u, 8px) * 0.8) 0;
  border: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.hs-energy-flow--embedded .hs-energy-flow__stage {
  max-width: 240px;
  margin: 18px auto;
}
.hs-energy-flow__node--btn {
  cursor: pointer;
  color: inherit;
}

.hs-energy-flow__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.hs-energy-flow__title {
  font-size: calc(var(--u, 8px) * 1.8);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink, #f4f7f5);
}

.hs-energy-flow__today {
  font-size: calc(var(--u, 8px) * 1.45);
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
  background: rgba(251, 191, 36, 0.14);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: 999px;
  padding: 3px 10px;
}

.hs-energy-flow__today strong {
  color: #fbbf24;
  font-variant-numeric: tabular-nums;
}

.hs-energy-flow__stage {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1 / 1;
  margin: 26px auto;
}

.hs-energy-flow__svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.hs-energy-flow__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 2;
  stroke-dasharray: 4 5;
}

.hs-energy-flow__line {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
}

.hs-energy-flow__dot {
  filter: drop-shadow(0 0 4px currentColor);
}

.hs-energy-flow__node {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 82px;
  height: 82px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(16px) saturate(1.35);
  -webkit-backdrop-filter: blur(16px) saturate(1.35);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.24);
  transition: transform 0.2s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  user-select: none;
}

.hs-energy-flow__node:hover {
  transform: translate(-50%, -50%) scale(1.05);
}

.hs-energy-flow__icon {
  font-size: 18px;
  line-height: 1.1;
}

.hs-energy-flow__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hs-energy-flow__value {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--ink, #ffffff);
}

.hs-energy-flow__sub {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.78;
  line-height: 1;
}

.hs-energy-flow__empty {
  text-align: center;
  padding: 24px 12px;
  font-size: 13px;
  color: var(--ink-2, rgba(255, 255, 255, 0.65));
}

@media (max-width: 720px) {
  .hs-energy-flow {
    --hd-blur: 10px;
    padding: calc(var(--u, 8px) * 1.8) calc(var(--u, 8px) * 1.8) calc(var(--u, 8px) * 2.8);
  }
  .hs-energy-flow__stage {
    max-width: 260px;
    margin: 24px auto;
  }
  .hs-energy-flow__node {
    width: 72px;
    height: 72px;
    backdrop-filter: blur(10px) saturate(1.2);
    -webkit-backdrop-filter: blur(10px) saturate(1.2);
  }
  .hs-energy-flow__icon {
    font-size: 16px;
  }
  .hs-energy-flow__value {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .hs-energy-flow__stage {
    max-width: 220px;
    margin: 22px auto;
  }
  .hs-energy-flow__node {
    width: 64px;
    height: 64px;
    padding: 4px;
  }
  .hs-energy-flow__icon {
    font-size: 14px;
  }
  .hs-energy-flow__label {
    font-size: 9px;
  }
  .hs-energy-flow__value {
    font-size: 10px;
  }
}
`;
