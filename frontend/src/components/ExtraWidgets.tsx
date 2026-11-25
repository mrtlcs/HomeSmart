import { hourOptions } from "../clock";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { safeIntlLocale, weatherConditionLabel, type TranslationKey } from "../i18n";
import { useHistory } from "../history";
import type { WidgetKey } from "../layout";
import type { EnergyTariffConfig, EnergyTier, HomeSmartConfig } from "../types/config";
import { DEFAULT_ENERGY_TARIFF } from "../api/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { numeric, useWeather } from "../weather";
import { conditionIcon, ForecastSheet } from "./ContextHeader";
import { useTallTile, useWideTile } from "./EditableGrid";
import { HDIcon } from "./HDIcon";
import { Sparkline } from "./HistoryChart";
import { EnergyBreakdownModal } from "./EnergyTariffModal";
import { EnergyFlowCard } from "./EnergyFlowCard";

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
  if (config.widgets?.insights) keys.push("widget:insights");
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

export function getWeatherAtmosphere(condition?: string): {
  bg: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  glow: string;
} {
  const c = condition?.toLowerCase() ?? "";
  if (c.includes("sunny") || c.includes("clear")) {
    return {
      bg: "linear-gradient(135deg, rgba(255, 180, 50, 0.22) 0%, rgba(255, 140, 0, 0.08) 100%)",
      borderColor: "rgba(255, 193, 7, 0.38)",
      iconBg: "rgba(255, 201, 77, 0.25)",
      iconColor: "#ffc94d",
      glow: "0 0 16px rgba(255, 193, 7, 0.25)",
    };
  }
  if (c.includes("rain") || c.includes("pouring")) {
    return {
      bg: "linear-gradient(135deg, rgba(56, 189, 248, 0.24) 0%, rgba(37, 99, 235, 0.12) 100%)",
      borderColor: "rgba(56, 189, 248, 0.38)",
      iconBg: "rgba(56, 189, 248, 0.22)",
      iconColor: "#38bdf8",
      glow: "0 0 16px rgba(56, 189, 248, 0.25)",
    };
  }
  if (c.includes("lightning")) {
    return {
      bg: "linear-gradient(135deg, rgba(168, 85, 247, 0.26) 0%, rgba(99, 102, 241, 0.14) 100%)",
      borderColor: "rgba(192, 132, 252, 0.4)",
      iconBg: "rgba(192, 132, 252, 0.24)",
      iconColor: "#facc15",
      glow: "0 0 18px rgba(192, 132, 252, 0.3)",
    };
  }
  if (c.includes("snow")) {
    return {
      bg: "linear-gradient(135deg, rgba(224, 242, 254, 0.25) 0%, rgba(186, 230, 253, 0.12) 100%)",
      borderColor: "rgba(186, 230, 253, 0.42)",
      iconBg: "rgba(186, 230, 253, 0.22)",
      iconColor: "#7dd3fc",
      glow: "0 0 14px rgba(186, 230, 253, 0.25)",
    };
  }
  if (c.includes("wind") || c.includes("fog")) {
    return {
      bg: "linear-gradient(135deg, rgba(94, 234, 212, 0.22) 0%, rgba(13, 148, 136, 0.1) 100%)",
      borderColor: "rgba(94, 234, 212, 0.35)",
      iconBg: "rgba(94, 234, 212, 0.2)",
      iconColor: "#5eead4",
      glow: "0 0 14px rgba(94, 234, 212, 0.22)",
    };
  }
  return {
    bg: "linear-gradient(135deg, rgba(148, 163, 184, 0.22) 0%, rgba(71, 85, 105, 0.12) 100%)",
    borderColor: "rgba(148, 163, 184, 0.32)",
    iconBg: "rgba(203, 213, 225, 0.18)",
    iconColor: "#93c5fd",
    glow: "0 0 14px rgba(148, 163, 184, 0.2)",
  };
}

export function getWeatherConditionColor(condition?: string): string {
  const c = condition?.toLowerCase() ?? "";
  if (c.includes("sunny") || c.includes("clear")) return "#ffc94d";
  if (c.includes("rain") || c.includes("pouring")) return "#38bdf8";
  if (c.includes("lightning")) return "#facc15";
  if (c.includes("snow")) return "#7dd3fc";
  if (c.includes("wind") || c.includes("fog")) return "#5eead4";
  return "#93c5fd";
}

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
  const atmo = getWeatherAtmosphere(condition);

  return <>
    <button
      className={`widget-card widget-card--interactive widget-card--weather ${wide ? "widget-card--wide" : ""}`}
      onClick={() => setOpen(true)}
      ref={ref}
      style={{
        background: atmo.bg,
        borderColor: atmo.borderColor,
        boxShadow: atmo.glow,
      }}
      type="button"
    >
      <span
        className="widget-card__icon"
        style={{
          background: atmo.iconBg,
          color: atmo.iconColor,
          boxShadow: `0 0 10px ${atmo.iconBg}`,
        }}
      >
        <HDIcon name={conditionIcon(condition)} size={22} />
      </span>
      <span className="widget-card__label" style={{ color: "var(--ink-2)", fontWeight: 600 }}>
        {t("weatherNow")}
      </span>
      <strong style={{ fontSize: "calc(var(--u) * 4)", letterSpacing: "-0.03em" }}>
        {now?.temperature != null ? `${Math.round(now.temperature)}°` : "—"}
      </strong>
      <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: "0.9em", fontWeight: 600, color: "var(--ink)" }}>
          {condition ? weatherConditionLabel(condition, language) : t("unavailable")}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82em", opacity: 0.9 }}>
          {high != null && low != null && (
            <span>
              <span style={{ color: "#ff9d4d", fontWeight: 600 }}>▲ {Math.round(high)}°</span>
              {" "}
              <span style={{ color: "#6cc4ff", fontWeight: 600 }}>▼ {Math.round(low)}°</span>
            </span>
          )}
          {now?.humidity != null && (
            <span>💧 {now.humidity}%</span>
          )}
        </div>
      </div>
      {wide && hourly.length > 0 && (
        <span className="widget-hours" style={{ gap: "calc(var(--u) * 0.8)" }}>
          {hourly.slice(1, 6).map((item) => {
            const hColor = getWeatherConditionColor(item.condition);
            const tempVal = numeric(item.temperature);
            return (
              <span
                key={item.datetime}
                style={{
                  background: "rgba(255, 255, 255, 0.07)",
                  backdropFilter: "blur(4px)",
                  borderRadius: "calc(var(--u) * 1.4)",
                  padding: "calc(var(--u) * 0.8) calc(var(--u) * 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <small style={{ opacity: 0.85, fontSize: "0.8em" }}>
                  {item.datetime ? hour.format(new Date(item.datetime)) : ""}
                </small>
                <span style={{ color: hColor, margin: "2px 0" }}>
                  <HDIcon name={conditionIcon(item.condition)} size={18} />
                </span>
                <b style={{ fontSize: "0.95em", fontWeight: 600 }}>
                  {tempVal != null ? `${Math.round(Number(tempVal))}°` : "—"}
                </b>
              </span>
            );
          })}
        </span>
      )}
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

export interface TariffBreakdownItem {
  name: string;
  kwhUsed: number;
  rate: number;
  cost: number;
}

export interface TariffCalculationResult {
  totalCost: number;
  subtotal: number;
  vatAmount: number;
  currentTier: number;
  currentRate: number;
  tierName: string;
  formattedTotal: string;
  currency: string;
  currencyPosition: "prefix" | "suffix";
  vatPercent: number;
  fixedMonthlyFee: number;
  breakdown: TariffBreakdownItem[];
}

export function formatCurrency(amount: number, currency: string, position: "prefix" | "suffix", language?: string): string {
  const loc = safeIntlLocale(language);
  const formattedNumber = new Intl.NumberFormat(loc, { maximumFractionDigits: amount >= 1000 ? 0 : 2 }).format(amount);
  return position === "prefix" ? `${currency}${formattedNumber}` : `${formattedNumber} ${currency}`;
}

/** Generalized electricity cost calculation engine (1 bậc hoặc nhiều bậc lũy tiến tùy biến). */
export function calculateElectricityCost(
  kwh: number,
  tariffConfig?: EnergyTariffConfig,
  language?: string,
  translate?: (key: TranslationKey) => string,
): TariffCalculationResult {
  const cfg: EnergyTariffConfig = tariffConfig ?? DEFAULT_ENERGY_TARIFF;
  const currency = cfg.currency || "đ";
  const position = cfg.currency_position || "suffix";
  const vatPercent = Number(cfg.vat_percent ?? 0);
  const includeVat = cfg.include_vat !== false;
  const fixedFee = Number(cfg.fixed_monthly_fee ?? 0);
  const flatLabel = translate ? translate("tariffFlatName") : "Flat Rate";
  const tierFallback = (n: number) => (translate ? translate("tariffTierFallback").replace("{n}", String(n)) : `Tier ${n}`);

  if (kwh <= 0) {
    const subtotal = fixedFee;
    const vatAmount = includeVat ? (subtotal * vatPercent) / 100 : 0;
    const totalCost = Math.round(subtotal + vatAmount);
    return {
      totalCost,
      subtotal,
      vatAmount,
      currentTier: 1,
      currentRate: cfg.mode === "flat" ? (cfg.flat_rate ?? 0) : (cfg.tiers[0]?.rate ?? 0),
      tierName: cfg.mode === "flat" ? flatLabel : (cfg.tiers[0]?.name ?? tierFallback(1)),
      formattedTotal: formatCurrency(totalCost, currency, position, language),
      currency,
      currencyPosition: position,
      vatPercent,
      fixedMonthlyFee: fixedFee,
      breakdown: [],
    };
  }

  // Flat mode (1 bậc cố định)
  if (cfg.mode === "flat") {
    const rate = Number(cfg.flat_rate ?? 0);
    const subtotal = kwh * rate + fixedFee;
    const vatAmount = includeVat ? (subtotal * vatPercent) / 100 : 0;
    const totalCost = Math.round(subtotal + vatAmount);
    return {
      totalCost,
      subtotal,
      vatAmount,
      currentTier: 1,
      currentRate: rate,
      tierName: flatLabel,
      formattedTotal: formatCurrency(totalCost, currency, position, language),
      currency,
      currencyPosition: position,
      vatPercent,
      fixedMonthlyFee: fixedFee,
      breakdown: [
        {
          name: translate ? translate("tariffKwhUsed") : "Energy usage",
          kwhUsed: Number(kwh.toFixed(1)),
          rate,
          cost: Math.round(kwh * rate),
        },
      ],
    };
  }

  // Tiered mode (Lũy tiến nhiều bậc)
  const tiers = cfg.tiers && cfg.tiers.length > 0 ? cfg.tiers : DEFAULT_ENERGY_TARIFF.tiers;
  let remaining = kwh;
  let subtotal = fixedFee;
  let currentTier = 1;
  let currentRate = tiers[0]?.rate ?? 0;
  let currentTierName = tiers[0]?.name ?? tierFallback(1);
  let prevMax = 0;
  const breakdown: TariffBreakdownItem[] = [];

  for (let i = 0; i < tiers.length; i++) {
    const tierItem = tiers[i];
    const max = tierItem.max != null && Number.isFinite(tierItem.max) ? tierItem.max : Infinity;
    const span = max - prevMax;

    if (remaining > 0) {
      currentTier = i + 1;
      currentRate = tierItem.rate;
      currentTierName = tierItem.name ?? tierFallback(i + 1);
      const usedInTier = Math.min(remaining, span);
      const tierCost = Math.round(usedInTier * tierItem.rate);
      subtotal += tierCost;
      remaining -= usedInTier;

      breakdown.push({
        name: tierItem.name ?? tierFallback(i + 1),
        kwhUsed: Number(usedInTier.toFixed(1)),
        rate: tierItem.rate,
        cost: tierCost,
      });
    }
    prevMax = max;
  }

  const vatAmount = includeVat ? Math.round((subtotal * vatPercent) / 100) : 0;
  const totalCost = Math.round(subtotal + vatAmount);

  return {
    totalCost,
    subtotal,
    vatAmount,
    currentTier,
    currentRate,
    tierName: currentTierName,
    formattedTotal: formatCurrency(totalCost, currency, position, language),
    currency,
    currencyPosition: position,
    vatPercent,
    fixedMonthlyFee: fixedFee,
    breakdown,
  };
}

/** Backward-compatible alias */
export function calcEvnCost(kwh: number) {
  const res = calculateElectricityCost(kwh);
  return { tier: res.currentTier, totalCost: res.totalCost, rate: res.currentRate };
}

/** Energy at home now: consumption, solar, the grid (importing or exporting), the battery and
 * today's production. Each line opens its sensor with its history. */
export function EnergyWidget({ config, hass, language, onOpen, t }: { config: HomeSmartConfig; hass: HomeAssistant; language?: string; onOpen: Open; t: T }) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
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

  // Electricity tariff estimation
  const todayKwh = Number.parseFloat(today?.state ?? "0") || 0;
  const estDailyKwh = todayKwh > 0 ? todayKwh : (home != null ? (home * 24) / 1000 : 0);
  const estMonthlyKwh = estDailyKwh * 30;
  const tariffRes = calculateElectricityCost(estMonthlyKwh, e.tariff, language, t);

  if (wide) {
    return <div className={`widget-card widget-card--wide widget-card--energy ${surplus ? "widget-card--playing" : ""}`}>
      <span className="widget-card__icon"><HDIcon name="bolt" size={22} /></span>
      <span className="widget-card__label">{t("energy")}</span>
      <strong>{main != null ? formatPower(main, language) : "—"}</strong>
      <p>{home != null ? t("energyHome") : t("energySolar")}</p>
      {estMonthlyKwh > 0 && (
        <div style={{ marginTop: 4 }}>
          <button
            className="energy-tariff-badge"
            onClick={(ev) => {
              ev.stopPropagation();
              setBreakdownOpen(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 170, 0, 0.14)",
              border: "1px solid rgba(255, 170, 0, 0.28)",
              borderRadius: "999px",
              padding: "3px 10px",
              fontSize: "0.8em",
              color: "#ffb43a",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title={t("tariffReceipt")}
            type="button"
          >
            <span>{tariffRes.tierName} ({formatCurrency(tariffRes.currentRate, tariffRes.currency, tariffRes.currencyPosition, language)}/kWh)</span>
            <span>·</span>
            <span>~{tariffRes.formattedTotal}</span>
            <HDIcon name="chevron" size={11} />
          </button>
        </div>
      )}
      <EnergyFlowCard
        config={config}
        embedded
        hass={hass}
        onOpenEntity={(id) => {
          const entityState = st(id);
          if (entityState) onOpen(asEntity(entityState));
        }}
        t={t}
      />
      <ul className="widget-list">{lines.slice(home != null ? 1 : 0, 5).map((line) => <li key={line.key}><button onClick={() => line.state && onOpen(asEntity(line.state))} type="button"><span>{line.label}</span><small>{line.value}</small></button></li>)}</ul>
      {tall && points && points.length > 1 && <div className="widget-card__chart"><Sparkline compact hours={24} language={language} points={points} /></div>}
      {breakdownOpen && (
        <EnergyBreakdownModal
          estMonthlyKwh={estMonthlyKwh}
          language={language}
          onClose={() => setBreakdownOpen(false)}
          t={t}
          tariffConfig={e.tariff}
        />
      )}
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
