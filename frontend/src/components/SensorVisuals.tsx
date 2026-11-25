import { useId, type CSSProperties, type ReactNode } from "react";
import { useHistory, type HistoryPoint } from "../history";
import type { TranslationKey } from "../i18n";
import type { SensorDisplayOptions, SensorStyleMode } from "../types/config";
import type { HomeAssistant } from "../types/home-assistant";
import { useWideTile } from "./EditableGrid";
import { HDIcon } from "./HDIcon";
import { Sparkline } from "./HistoryChart";

export const SENSOR_PALETTE: Array<{ id: string; color: string; stop2: string }> = [
  { id: "ice", color: "#38bdf8", stop2: "#0ea5e9" },
  { id: "emerald", color: "#10b981", stop2: "#06b6d4" },
  { id: "amber", color: "#f59e0b", stop2: "#f97316" },
  { id: "rose", color: "#f43f5e", stop2: "#ef4444" },
  { id: "violet", color: "#a78bfa", stop2: "#6366f1" },
  { id: "cyan", color: "#2dd4bf", stop2: "#0d9488" },
];

export const SENSOR_STYLE_OPTIONS: Array<{ id: SensorStyleMode; labelKey: TranslationKey }> = [
  { id: "default", labelKey: "sensorStyleDefault" },
  { id: "gauge", labelKey: "sensorStyleGauge" },
  { id: "line", labelKey: "sensorStyleLine" },
  { id: "bar", labelKey: "sensorStyleBar" },
  { id: "gradient", labelKey: "sensorStyleGradient" },
];

export function resolveSensorGradient(unit?: string, customColor?: string, value?: number | null): [string, string] {
  if (customColor) {
    const preset = SENSOR_PALETTE.find((p) => p.color.toLowerCase() === customColor.toLowerCase());
    return [customColor, preset?.stop2 ?? customColor];
  }
  const u = (unit ?? "").toLowerCase();
  if (u.includes("°") || u === "c" || u === "f") {
    if (value != null && value >= 80) return ["#ef4444", "#f43f5e"];
    if (value != null && value >= 65) return ["#f59e0b", "#fbbf24"];
    if (value != null && value >= 30) return ["#10b981", "#34d399"];
    return ["#38bdf8", "#0ea5e9"];
  }
  if (u === "%" || u.includes("pct")) return ["#38bdf8", "#4facfe"];
  if (u === "w" || u === "kw" || u === "kwh" || u === "wh" || u === "v" || u === "a") return ["#f59e0b", "#f97316"];
  if (u.includes("b/s") || u.includes("bps") || u.includes("gb") || u.includes("mb") || u.includes("mib")) return ["#10b981", "#06b6d4"];
  if (u === "lx" || u === "lm") return ["#facc15", "#f59e0b"];
  return ["#38bdf8", "#0ea5e9"];
}

export interface ClimateModeColors {
  accent: string;
  bg: string;
  border: string;
  inkOnAccent: string;
}

export const CLIMATE_MODE_PALETTE: Record<string, ClimateModeColors> = {
  cool: { accent: "#38bdf8", bg: "rgba(56, 189, 248, 0.20)", border: "rgba(56, 189, 248, 0.44)", inkOnAccent: "#082032" },
  heat: { accent: "#fb923c", bg: "rgba(251, 146, 60, 0.22)", border: "rgba(251, 146, 60, 0.46)", inkOnAccent: "#2b1204" },
  auto: { accent: "#facc15", bg: "rgba(250, 204, 21, 0.19)", border: "rgba(250, 204, 21, 0.42)", inkOnAccent: "#2a2004" },
  heat_cool: { accent: "#facc15", bg: "rgba(250, 204, 21, 0.19)", border: "rgba(250, 204, 21, 0.42)", inkOnAccent: "#2a2004" },
  dry: { accent: "#2dd4bf", bg: "rgba(45, 212, 191, 0.19)", border: "rgba(45, 212, 191, 0.42)", inkOnAccent: "#042824" },
  fan_only: { accent: "#60a5fa", bg: "rgba(96, 165, 250, 0.19)", border: "rgba(96, 165, 250, 0.42)", inkOnAccent: "#081c3a" },
};

export function climateModeStyle(mode: string): ClimateModeColors | undefined {
  return CLIMATE_MODE_PALETTE[mode];
}

export function SensorStylePicker({
  onChange,
  showDefault = true,
  t,
  value,
}: {
  onChange: (next: SensorDisplayOptions) => void;
  showDefault?: boolean;
  t: (key: TranslationKey) => string;
  value: SensorDisplayOptions;
}) {
  const style = value.style ?? "default";
  const options = showDefault ? SENSOR_STYLE_OPTIONS : SENSOR_STYLE_OPTIONS.filter((o) => o.id !== "default");

  return (
    <div className="hs-sensor-style-picker">
      <div className="room-options__row">
        <span className="eyebrow">{t("sensorStyle")}</span>
        <div className="hs-style-chips" role="radiogroup" aria-label={t("sensorStyle")}>
          {options.map((opt) => (
            <button
              aria-checked={style === opt.id}
              className={`hs-style-chip${style === opt.id ? " hs-style-chip--on" : ""}`}
              key={opt.id}
              onClick={() => onChange({ ...value, style: opt.id === "default" && showDefault ? undefined : opt.id })}
              role="radio"
              type="button"
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="room-options__row">
        <span className="eyebrow">{t("sensorColor")}</span>
        <div className="hs-color-swatches" role="radiogroup" aria-label={t("sensorColor")}>
          <button
            aria-checked={!value.color}
            aria-label={t("sensorColorAuto")}
            className={`hs-color-swatch hs-color-swatch--auto${!value.color ? " hs-color-swatch--on" : ""}`}
            onClick={() => onChange({ ...value, color: undefined })}
            role="radio"
            title={t("sensorColorAuto")}
            type="button"
          >
            <HDIcon name="palette" size={13} />
          </button>
          {SENSOR_PALETTE.map((swatch) => (
            <button
              aria-checked={value.color === swatch.color}
              aria-label={swatch.id}
              className={`hs-color-swatch${value.color === swatch.color ? " hs-color-swatch--on" : ""}`}
              key={swatch.id}
              onClick={() => onChange({ ...value, color: swatch.color })}
              role="radio"
              style={{ background: `linear-gradient(135deg, ${swatch.color}, ${swatch.stop2})` }}
              type="button"
            />
          ))}
        </div>
      </div>

      {style === "gauge" && (
        <div className="room-options__row">
          <span className="eyebrow">{t("sensorRange")}</span>
          <div className="hs-range-inputs">
            <label>
              <span>{t("sensorMin")}</span>
              <input
                className="st-input st-input--framed"
                onChange={(e) => {
                  const n = Number.parseFloat(e.target.value);
                  onChange({ ...value, min: Number.isFinite(n) ? n : undefined });
                }}
                placeholder="0"
                type="number"
                value={value.min ?? ""}
              />
            </label>
            <label>
              <span>{t("sensorMax")}</span>
              <input
                className="st-input st-input--framed"
                onChange={(e) => {
                  const n = Number.parseFloat(e.target.value);
                  onChange({ ...value, max: Number.isFinite(n) ? n : undefined });
                }}
                placeholder="100"
                type="number"
                value={value.max ?? ""}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

/** Unified styled sensor card: renders Cyber Gauge, Smooth Line, Bar Chart, or Trend Area. */
export function SensorStyledCard({
  color,
  detail,
  entityId,
  externalHistory,
  formattedValue,
  hass,
  icon,
  label,
  language,
  max = 100,
  min = 0,
  onClick,
  onConfigure,
  styleMode,
  subtitle,
  t,
  unit = "",
  value,
}: {
  color?: string;
  detail?: string;
  entityId?: string;
  externalHistory?: HistoryPoint[] | null;
  formattedValue: string;
  hass: HomeAssistant;
  icon: ReactNode;
  label: string;
  language?: string;
  max?: number;
  min?: number;
  onClick?: () => void;
  onConfigure?: () => void;
  styleMode: Exclude<SensorStyleMode, "default">;
  subtitle?: string;
  t: (key: TranslationKey) => string;
  unit?: string;
  value: number | null;
}) {
  if (styleMode === "gauge") {
    return (
      <CyberGaugeView
        color={color}
        detail={detail}
        icon={icon}
        label={label}
        max={max}
        min={min}
        onClick={onClick}
        onConfigure={onConfigure}
        subtext={subtitle}
        t={t}
        unit={unit}
        value={value ?? undefined}
      />
    );
  }

  return (
    <SensorHistoryGraphView
      color={color}
      entityId={entityId}
      externalHistory={externalHistory}
      formattedValue={formattedValue}
      hass={hass}
      icon={icon}
      label={label}
      language={language}
      onClick={onClick}
      onConfigure={onConfigure}
      styleMode={styleMode}
      subtitle={subtitle}
      t={t}
      unit={unit}
      value={value}
    />
  );
}

function CyberGaugeView({
  color,
  detail,
  icon,
  label,
  max = 100,
  min = 0,
  onClick,
  onConfigure,
  subtext,
  t,
  unit = "%",
  value,
}: {
  color?: string;
  detail?: string;
  icon: ReactNode;
  label: string;
  max?: number;
  min?: number;
  onClick?: () => void;
  onConfigure?: () => void;
  subtext?: string;
  t: (key: TranslationKey) => string;
  unit?: string;
  value?: number;
}) {
  const gradId = useId();
  const wide = useWideTile();
  const radius = 38;
  const strokeWidth = 7;
  const span = Math.max(1e-6, max - min);
  const ratio = value != null ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const totalAngle = 260;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (circumference * totalAngle) / 360;
  const strokeDashoffset = strokeDash - strokeDash * ratio;
  const rotation = 140;

  const [stop1, stop2] = resolveSensorGradient(unit, color, value);

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
        padding: wide ? "calc(var(--u) * 1.8) calc(var(--u) * 2.2)" : "calc(var(--u) * 1.8) calc(var(--u) * 1.4)",
        gap: wide ? "calc(var(--u) * 2)" : "calc(var(--u) * 1.0)",
        width: "100%",
        height: "100%",
        minHeight: "calc(var(--u) * 16)",
        position: "relative",
      }}
      tabIndex={0}
    >
      {onConfigure && (
        <button
          aria-label={t("selectSensor")}
          className="sys-gauge-cfg-btn"
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

      <div className="sys-gauge-card__ring">
        <svg className="sys-gauge-svg" style={{ overflow: "visible" }} viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradId} x1="0%" x2="100%" y1="100%" y2="0%">
              <stop offset="0%" stopColor={stop1} />
              <stop offset="100%" stopColor={stop2} />
            </linearGradient>
            <filter id={`${gradId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={stop1} floodOpacity="0.45" />
            </filter>
          </defs>
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
          {value != null && (
            <circle
              className="sys-gauge-svg__arc"
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
        <div className="sys-gauge-center">
          {value != null ? (
            <span className="sys-gauge-value">
              {Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(1))}
              {unit && <small className="sys-gauge-unit">{unit}</small>}
            </span>
          ) : (
            onConfigure && (
              <button
                className="hd-pill hd-pill--primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure();
                }}
                style={{ fontSize: "0.75em", padding: "4px 8px" }}
                type="button"
              >
                <HDIcon name="settings" size={12} />
                <span>{t("selectSensor")}</span>
              </button>
            )
          )}
        </div>
      </div>

      <div
        className="sys-gauge-info"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: wide ? "flex-start" : "center",
          textAlign: wide ? "left" : "center",
          flex: 1,
          minWidth: 0,
          width: wide ? "auto" : "100%",
        }}
      >
        <div className="sys-gauge-head" style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
          <span className="sys-gauge-icon" style={{ color: stop1, display: "flex", flexShrink: 0 }}>
            {icon}
          </span>
          <strong className="sys-gauge-label">{label}</strong>
        </div>
        {detail && (
          <div style={{ marginTop: 6, width: "100%" }}>
            <div style={{ fontSize: "0.82em", opacity: 0.85, fontWeight: 500 }}>{detail}</div>
            <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(ratio * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${stop1}, ${stop2})`, borderRadius: 2 }} />
            </div>
          </div>
        )}
        {subtext && <span className="sys-gauge-sub">{subtext}</span>}
      </div>
    </div>
  );
}

function SensorHistoryGraphView({
  color,
  entityId,
  externalHistory,
  formattedValue,
  hass,
  icon,
  label,
  language,
  onClick,
  onConfigure,
  styleMode,
  subtitle,
  t,
  unit = "",
  value,
}: {
  color?: string;
  entityId?: string;
  externalHistory?: HistoryPoint[] | null;
  formattedValue: string;
  hass: HomeAssistant;
  icon: ReactNode;
  label: string;
  language?: string;
  onClick?: () => void;
  onConfigure?: () => void;
  styleMode: "line" | "bar" | "gradient";
  subtitle?: string;
  t: (key: TranslationKey) => string;
  unit?: string;
  value: number | null;
}) {
  const fetched = useHistory(hass, externalHistory === undefined ? entityId : undefined, 24);
  const history = externalHistory !== undefined ? externalHistory : fetched;
  const [accent, accent2] = resolveSensorGradient(unit, color, value);
  const isGradient = styleMode === "gradient";
  const variant = styleMode === "bar" ? "bar" : "smooth";

  return (
    <div
      className={`hs-sensor-graph hs-sensor-graph--${styleMode}`}
      onClick={onClick}
      role="button"
      style={{
        "--sg-accent": accent,
        ...(isGradient
          ? {
              background: `linear-gradient(155deg, ${accent}22 0%, rgba(12, 18, 30, 0.45) 100%)`,
              borderColor: `${accent}44`,
            }
          : {}),
      } as CSSProperties}
      tabIndex={0}
    >
      <div className="hs-sensor-graph__head">
        <div className="hs-sensor-graph__title">
          {isGradient && <span className="hs-sensor-graph__dot" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />}
          <span>{label}</span>
        </div>
        <div className="hs-sensor-graph__actions">
          {isGradient ? (
            <strong className="hs-sensor-graph__val-top" style={{ color: accent }}>
              {formattedValue}
            </strong>
          ) : (
            <span className="hs-sensor-graph__icon" style={{ color: accent }}>
              {icon}
            </span>
          )}
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

      {!isGradient && (
        <div className="hs-sensor-graph__reading">
          <strong>{value != null ? (Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(1))) : formattedValue}</strong>
          {value != null && unit && <small>{unit}</small>}
          {subtitle && <span className="hs-sensor-graph__sub">{subtitle}</span>}
        </div>
      )}

      {isGradient && subtitle && <div className="hs-sensor-graph__sub hs-sensor-graph__sub--grad">{subtitle}</div>}

      <div className="hs-sensor-graph__chart">
        {history && history.length > 1 ? (
          <Sparkline
            color={accent}
            compact
            hours={24}
            language={language}
            points={history}
            showBounds={variant !== "bar"}
            unit={unit}
            variant={variant}
          />
        ) : history === null ? (
          <div className="hs-sensor-graph__empty">{t("sysLoadingHistory")}</div>
        ) : (
          <div className="hs-sensor-graph__flat" style={{ background: `linear-gradient(90deg, ${accent}33, ${accent2}11)` }} />
        )}
      </div>
    </div>
  );
}
