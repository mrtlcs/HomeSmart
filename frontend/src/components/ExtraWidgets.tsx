import { hourOptions } from "../clock";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { safeIntlLocale, weatherConditionLabel, type TranslationKey } from "../i18n";
import { useHistory } from "../history";
import type { WidgetKey } from "../layout";
import type { HomeSmartConfig } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { numeric, useWeather } from "../weather";
import { conditionIcon, ForecastSheet } from "./ContextHeader";
import { useTallTile, useWideTile } from "./EditableGrid";
import { HDIcon } from "./HDIcon";
import { Sparkline } from "./HistoryChart";

// Optional cards on Home, each turned on in Settings → Home: a bigger weather card, the sun and
// (Pro) energy. They follow the same sizes as every card: normal, double and large.

/** The optional cards that are on and have something to show. */
export function extraWidgets(config: HomeSmartConfig, hass: HomeAssistant): WidgetKey[] {
  const keys: WidgetKey[] = [];
  if (config.widgets?.weather) keys.push("widget:weather");
  if (config.widgets?.sun && hass.states["sun.sun"]) keys.push("widget:sun");
  if (config.widgets?.energy && Object.values(config.energy ?? {}).some((id) => id && hass.states[id])) keys.push("widget:energy");
  if (config.widgets?.bins && (config.bins ?? []).some((bin) => bin.entity && hass.states[bin.entity])) keys.push("widget:bins");
  if (config.widgets?.plan && config.navigation?.plan) keys.push("widget:plan");
  if (config.widgets?.recent && (config.recent_media ?? []).some((id) => hass.states[id])) keys.push("widget:recent");
  return keys;
}

type Open = (entity: DiscoveredEntity) => void;
type T = (key: TranslationKey) => string;

/** A sensor that is not in any room still opens its details (with its history). */
function asEntity(state: HassEntity): DiscoveredEntity {
  return { entity_id: state.entity_id, domain: state.entity_id.split(".")[0], name: String(state.attributes.friendly_name ?? state.entity_id), area_id: "", device_id: null, device_class: (state.attributes.device_class as string | undefined) ?? null, icon: null };
}

const time = (value: unknown, language?: string) => {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(safeIntlLocale(language), { ...hourOptions(), hour: "2-digit", minute: "2-digit" }).format(date) : "—";
};

export function WeatherWidget({ config, hass, language, t }: { config: HomeSmartConfig; hass: HomeAssistant; language?: string; t: T }) {
  const wide = useWideTile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const { now, daily, hourly, sunrise, sunset } = useWeather(hass, config, true);
  const today = daily[0];
  const high = numeric(today?.temperature);
  const low = numeric(today?.templow);
  const condition = now?.condition;
  const shell = ref.current?.closest(".app-shell") ?? null;
  const hour = new Intl.DateTimeFormat(safeIntlLocale(language), { ...hourOptions(), hour: "2-digit" });
  return <>
    <button className={`widget-card widget-card--interactive widget-card--weather ${wide ? "widget-card--wide" : ""}`} onClick={() => setOpen(true)} ref={ref} type="button">
      <span className="widget-card__icon"><HDIcon name={conditionIcon(condition)} size={22} /></span>
      <span className="widget-card__label">{t("weatherNow")}</span>
      <strong>{now?.temperature != null ? `${Math.round(now.temperature)}°` : "—"}</strong>
      <p>{condition ? weatherConditionLabel(condition, language) : t("unavailable")}{high != null ? ` · ${t("maxTemp")} ${Math.round(high)}°` : ""}{low != null ? ` · ${t("minTemp")} ${Math.round(low)}°` : ""}</p>
      {wide && hourly.length > 0 && <span className="widget-hours">{hourly.slice(1, 6).map((item) => <span key={item.datetime}><small>{item.datetime ? hour.format(new Date(item.datetime)) : ""}</small><HDIcon name={conditionIcon(item.condition)} size={18} /><b>{numeric(item.temperature) != null ? `${Math.round(Number(item.temperature))}°` : "—"}</b></span>)}</span>}
    </button>
    {open && shell && <ForecastSheet daily={daily} hourly={hourly} language={language} onClose={() => setOpen(false)} shell={shell} sunrise={sunrise} sunset={sunset} t={t} weather={now} />}
  </>;
}

/** Where the sun is: the next sunrise or sunset, its elevation and, in the bigger sizes, its path. */
export function SunWidget({ hass, language, onOpen, t }: { hass: HomeAssistant; language?: string; onOpen: Open; t: T }) {
  const wide = useWideTile();
  const sun = hass.states["sun.sun"];
  if (!sun) return null;
  const up = sun.state === "above_horizon";
  const elevation = numeric(sun.attributes.elevation);
  const rising = Date.parse(String(sun.attributes.next_rising ?? ""));
  const setting = Date.parse(String(sun.attributes.next_setting ?? ""));
  // Today's daylight: while the sun is up, it rose about a day before its next sunrise.
  const start = up ? rising - 86_400_000 : rising;
  const end = setting;
  const progress = up && end > start ? Math.min(1, Math.max(0, (Date.now() - start) / (end - start))) : 0;
  const daylight = end > start ? Math.round((end - start) / 60_000) : null;
  const next = up ? `${t("sunset")} ${time(sun.attributes.next_setting, language)}` : `${t("sunrise")} ${time(sun.attributes.next_rising, language)}`;
  const angle = Math.PI * (1 - progress);
  return <button className={`widget-card widget-card--interactive widget-card--sun ${up ? "widget-card--playing" : ""} ${wide ? "widget-card--wide" : ""}`} onClick={() => onOpen(asEntity(sun))} type="button">
    <span className="widget-card__icon"><HDIcon name={up ? "sun" : "moon"} size={22} /></span>
    <span className="widget-card__label">{t("sunCard")}</span>
    <strong>{next}</strong>
    <p>{elevation != null ? `${t("sunElevation")} ${Math.round(elevation)}°` : ""}{wide && daylight ? ` · ${t("daylight")} ${Math.floor(daylight / 60)} h ${daylight % 60} min` : ""}</p>
    {wide && <svg aria-hidden="true" className="sun-arc" viewBox="0 0 200 70">
      <path d="M10,64 A90,58 0 0 1 190,64" fill="none" stroke="currentColor" strokeDasharray="3 5" strokeOpacity=".35" />
      <line stroke="currentColor" strokeOpacity=".25" x1="4" x2="196" y1="64" y2="64" />
      {up && <circle cx={100 + 90 * Math.cos(angle)} cy={64 - 58 * Math.sin(angle)} fill="var(--on)" r="7" style={{ filter: "drop-shadow(0 0 6px var(--on))" } as CSSProperties} />}
      <text fill="currentColor" fillOpacity=".6" fontSize="10" x="6" y="58">{time(new Date(start).toISOString(), language)}</text>
      <text fill="currentColor" fillOpacity=".6" fontSize="10" textAnchor="end" x="194" y="58">{time(new Date(end).toISOString(), language)}</text>
    </svg>}
  </button>;
}

/** Power in W or kW, as the sensor reports it; null when the sensor has no number. */
export function power(state?: HassEntity): number | null {
  const value = state ? Number.parseFloat(state.state) : Number.NaN;
  if (!Number.isFinite(value)) return null;
  const unit = String(state?.attributes.unit_of_measurement ?? "W");
  return unit === "kW" ? value * 1000 : unit === "MW" ? value * 1_000_000 : value;
}

export function formatPower(watts: number, language?: string): string {
  const abs = Math.abs(watts);
  const loc = safeIntlLocale(language);
  return abs >= 1000 ? `${new Intl.NumberFormat(loc, { maximumFractionDigits: abs >= 10_000 ? 1 : 2 }).format(watts / 1000)} kW` : `${Math.round(watts)} W`;
}

/** Vietnam EVN 5-tier electricity cost calculation (Biểu giá điện sinh hoạt 5 bậc mới EVN). */
export function calcEvnCost(kwh: number) {
  if (kwh <= 0) return { tier: 1, totalCost: 0, rate: 1901 };
  const tiers = [
    { max: 100, rate: 1901 },
    { max: 200, rate: 2289 },
    { max: 400, rate: 2894 },
    { max: 700, rate: 3456 },
    { max: Infinity, rate: 3844 },
  ];
  let remaining = kwh;
  let cost = 0;
  let currentTier = 1;
  let prevMax = 0;
  for (let i = 0; i < tiers.length; i++) {
    const span = tiers[i].max - prevMax;
    if (remaining > 0) {
      currentTier = i + 1;
      const usedInTier = Math.min(remaining, span);
      cost += usedInTier * tiers[i].rate;
      remaining -= usedInTier;
    }
    prevMax = tiers[i].max;
  }
  return { tier: currentTier, totalCost: Math.round(cost), rate: tiers[currentTier - 1].rate };
}

function FlowLine({ active, color, reverse }: { active: boolean; color: string; reverse?: boolean }) {
  return (
    <div className="energy-flow-connector" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 28, margin: "0 4px" }}>
      <svg height="12" style={{ width: "100%", overflow: "visible" }} viewBox="0 0 40 12">
        <line stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" x1="2" x2="38" y1="6" y2="6" />
        {active && (
          <line
            className={`energy-flow-dash ${reverse ? "energy-flow-dash--rev" : ""}`}
            stroke={color}
            strokeDasharray="4 6"
            strokeLinecap="round"
            strokeWidth="3"
            x1="2"
            x2="38"
            y1="6"
            y2="6"
          />
        )}
      </svg>
    </div>
  );
}

/** Energy at home now: consumption, solar, the grid (importing or exporting), the battery and
 * today's production. Each line opens its sensor with its history. */
export function EnergyWidget({ config, hass, language, onOpen, t }: { config: HomeSmartConfig; hass: HomeAssistant; language?: string; onOpen: Open; t: T }) {
  const wide = useWideTile();
  const tall = useTallTile();
  const e = config.energy;
  const st = (id: string) => (id ? hass.states[id] : undefined);
  const home = power(st(e.consumption));
  const solar = power(st(e.solar));
  const imported = power(st(e.grid_import));
  const exported = power(st(e.grid_export));
  // One grid sensor: positive is importing, negative exporting.
  const grid = imported != null && exported != null ? imported - exported : imported ?? (exported != null ? -exported : null);
  const battery = st(e.battery);
  const today = st(e.solar_today);
  const chartId = e.consumption || e.solar;
  const points = useHistory(hass, tall ? chartId : undefined, 24);
  const unit = (state?: HassEntity) => (state?.attributes.unit_of_measurement ? ` ${String(state.attributes.unit_of_measurement)}` : "");
  const lines = [
    home != null && { key: "home", label: t("energyHome"), value: formatPower(home, language), state: st(e.consumption) },
    solar != null && { key: "solar", label: t("energySolar"), value: formatPower(solar, language), state: st(e.solar) },
    grid != null && { key: "grid", label: grid < 0 ? t("energyExporting") : t("energyImporting"), value: formatPower(Math.abs(grid), language), state: st(e.grid_import) ?? st(e.grid_export) },
    battery && Number.isFinite(Number.parseFloat(battery.state)) && { key: "battery", label: t("energyBattery"), value: `${Math.round(Number.parseFloat(battery.state))}%`, state: battery },
    today && Number.isFinite(Number.parseFloat(today.state)) && { key: "today", label: t("energyToday"), value: `${today.state}${unit(today)}`, state: today },
  ].filter(Boolean) as Array<{ key: string; label: string; value: string; state?: HassEntity }>;
  const surplus = solar != null && (grid != null ? grid < 0 : home != null && solar > home);
  const main = home ?? solar;
  const first = st(e.consumption) ?? st(e.solar) ?? lines[0]?.state;

  // EVN 6-tier estimation
  const todayKwh = Number.parseFloat(today?.state ?? "0") || 0;
  const estDailyKwh = todayKwh > 0 ? todayKwh : (home != null ? (home * 24) / 1000 : 0);
  const estMonthlyKwh = estDailyKwh * 30;
  const evn = calcEvnCost(estMonthlyKwh);

  if (wide) {
    return <div className={`widget-card widget-card--wide widget-card--energy ${surplus ? "widget-card--playing" : ""}`}>
      <style>{`
        @keyframes efDashFlow { to { stroke-dashoffset: -20; } }
        .energy-flow-dash { animation: efDashFlow 1s linear infinite; }
        .energy-flow-dash--rev { animation: efDashFlow 1s linear infinite reverse; }
      `}</style>
      <span className="widget-card__icon"><HDIcon name="bolt" size={22} /></span>
      <span className="widget-card__label">{t("energy")}</span>
      <strong>{main != null ? formatPower(main, language) : "—"}</strong>
      <p>{home != null ? t("energyHome") : t("energySolar")}</p>
      {estMonthlyKwh > 0 && (
        <div style={{ marginTop: 4 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 170, 0, 0.14)",
            border: "1px solid rgba(255, 170, 0, 0.28)",
            borderRadius: "999px",
            padding: "2px 8px",
            fontSize: "0.8em",
            color: "#ffb43a",
            fontWeight: 600,
          }}>
            <span>EVN {t("evnTier").replace("{tier}", String(evn.tier))} ({evn.rate.toLocaleString()} đ/kWh)</span>
            <span>·</span>
            <span>~{new Intl.NumberFormat(safeIntlLocale(language)).format(evn.totalCost)} đ</span>
          </span>
        </div>
      )}
      <div className="energy-flow-diagram" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 8px" }}>
        {solar != null && (
          <>
            <div className="energy-flow-node energy-flow-node--solar" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
              <span className="energy-flow-node__icon" style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255, 201, 77, 0.2)", color: "#ffc94d" }}>
                <HDIcon name="sun" size={18} />
              </span>
              <span style={{ fontSize: "0.85em", fontWeight: 600, marginTop: 4 }}>{formatPower(solar, language)}</span>
              <small style={{ opacity: 0.7, fontSize: "0.75em" }}>{t("energySolar")}</small>
            </div>
            <FlowLine active={solar > 10} color="#ffc94d" />
          </>
        )}
        <div className="energy-flow-node energy-flow-node--home" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
          <span className="energy-flow-node__icon" style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255, 255, 255, 0.15)", color: "var(--ink)" }}>
            <HDIcon name="home" size={18} />
          </span>
          <span style={{ fontSize: "0.85em", fontWeight: 600, marginTop: 4 }}>{home != null ? formatPower(home, language) : "—"}</span>
          <small style={{ opacity: 0.7, fontSize: "0.75em" }}>{t("energyHome")}</small>
        </div>
        {grid != null && (
          <>
            <FlowLine active={Math.abs(grid) > 10} color={grid < 0 ? "#1fd36b" : "#8cc4ec"} reverse={grid < 0} />
            <div className="energy-flow-node energy-flow-node--grid" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
              <span className="energy-flow-node__icon" style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: grid < 0 ? "rgba(31, 211, 107, 0.2)" : "rgba(140, 196, 236, 0.2)", color: grid < 0 ? "#1fd36b" : "#8cc4ec" }}>
                <HDIcon name="bolt" size={18} />
              </span>
              <span style={{ fontSize: "0.85em", fontWeight: 600, marginTop: 4 }}>{formatPower(Math.abs(grid), language)}</span>
              <small style={{ opacity: 0.7, fontSize: "0.75em" }}>{grid < 0 ? t("energyExporting") : t("energyImporting")}</small>
            </div>
          </>
        )}
        {battery && Number.isFinite(Number.parseFloat(battery.state)) && (
          <>
            <FlowLine active={true} color="#a78bfa" />
            <div className="energy-flow-node energy-flow-node--battery" style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
              <span className="energy-flow-node__icon" style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(167, 139, 250, 0.2)", color: "#a78bfa" }}>
                <HDIcon name="battery" size={18} />
              </span>
              <span style={{ fontSize: "0.85em", fontWeight: 600, marginTop: 4 }}>{Math.round(Number.parseFloat(battery.state))}%</span>
              <small style={{ opacity: 0.7, fontSize: "0.75em" }}>{t("energyBattery")}</small>
            </div>
          </>
        )}
      </div>
      <ul className="widget-list">{lines.slice(home != null ? 1 : 0, 5).map((line) => <li key={line.key}><button onClick={() => line.state && onOpen(asEntity(line.state))} type="button"><span>{line.label}</span><small>{line.value}</small></button></li>)}</ul>
      {tall && points && points.length > 1 && <div className="widget-card__chart"><Sparkline compact hours={24} language={language} points={points} /></div>}
    </div>;
  }
  return <button className={`widget-card widget-card--interactive widget-card--energy ${surplus ? "widget-card--playing" : ""}`} onClick={() => first && onOpen(asEntity(first))} type="button">
    <span className="widget-card__icon"><HDIcon name="bolt" size={22} /></span>
    <span className="widget-card__label">{t("energy")}</span>
    <strong>{main != null ? formatPower(main, language) : "—"}</strong>
    <p>{lines.filter((line) => line.key !== (home != null ? "home" : "solar")).slice(0, 2).map((line) => `${line.label} ${line.value}`).join(" · ")}</p>
  </button>;
}

/** Sensors that fit each energy field, best guesses first, for the pickers in Settings. */
export function energyCandidates(hass: HomeAssistant) {
  const sensors = Object.values(hass.states).filter((state) => state.entity_id.startsWith("sensor."));
  const byClass = (cls: string) => sensors.filter((state) => state.attributes.device_class === cls);
  const rank = (list: HassEntity[], words: RegExp) => [...list].sort((a, b) => Number(words.test(b.entity_id + String(b.attributes.friendly_name ?? ""))) - Number(words.test(a.entity_id + String(a.attributes.friendly_name ?? ""))));
  const powerSensors = byClass("power");
  return {
    consumption: rank(powerSensors, /consum|house|home|load|casa|verbrauch|haus|consumo/i),
    grid_import: rank(powerSensors, /grid|import|rede|netz|bezug|red/i),
    grid_export: rank(powerSensors, /export|feed|einspeis|inje/i),
    solar: rank(powerSensors, /solar|pv|inverter|inversor|wechselrichter/i),
    battery: rank(byClass("battery"), /home.?battery|storage|akku|speicher|bateria|batterie/i),
    solar_today: rank(byClass("energy"), /solar|pv|yield|produ|today|hoje|heute/i),
  };
}
