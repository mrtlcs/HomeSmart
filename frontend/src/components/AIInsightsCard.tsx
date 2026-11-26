import { useMemo, useState } from "react";
import type { TranslationKey } from "../i18n";
import type { DiscoveredEntity, DiscoveryResponse } from "../types/discovery";
import type { HomeSmartConfig } from "../types/config";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { HDIcon, type IconName } from "./HDIcon";
import { power, formatPower } from "./ExtraWidgets";

const DISMISS_KEY = "homesmart:dismissed_insights:v1";
const OPENINGS = new Set(["window", "door", "opening", "garage_door"]);

export interface HomeInsight {
  id: string;
  severity: "info" | "warn" | "alert";
  icon: IconName;
  title: string;
  subtitle: string;
  entity?: DiscoveredEntity;
  actionType?: "turn_off_light" | "open_entity";
}

function loadDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(ids.slice(-40)));
  } catch {
    // ignore storage errors
  }
}

export function computeHomeInsights(
  config: HomeSmartConfig,
  data: DiscoveryResponse,
  hass: HomeAssistant,
  language: string | undefined,
  t: (key: TranslationKey) => string,
): HomeInsight[] {
  const insights: HomeInsight[] = [];
  const nowMs = Date.now();

  for (const room of data.rooms) {
    // 1. Lights left on continuously >= 4 hours
    for (const entity of room.entities) {
      if (entity.hidden || entity.domain !== "light") continue;
      const state: HassEntity | undefined = hass.states[entity.entity_id];
      if (!state || state.state !== "on" || !state.last_changed) continue;
      const changedMs = Date.parse(state.last_changed);
      if (!Number.isFinite(changedMs)) continue;
      const hours = Math.floor((nowMs - changedMs) / 3_600_000);
      if (hours >= 4) {
        insights.push({
          id: `light-long:${entity.entity_id}`,
          severity: hours >= 8 ? "warn" : "info",
          icon: "light",
          title: entity.name,
          subtitle: `${room.name} · ${t("aiInsightLightOnLong").replace("{hours}", String(hours))}`,
          entity,
          actionType: "turn_off_light",
        });
      }
    }

    // 2. Climate active while window or door in same room is open
    const activeClimate = room.entities.find((entity) => {
      if (entity.hidden || entity.domain !== "climate") return false;
      const state = hass.states[entity.entity_id];
      if (!state || ["off", "unavailable", "unknown"].includes(state.state)) return false;
      return ["heating", "cooling", "drying"].includes(String(state.attributes.hvac_action));
    });
    if (activeClimate) {
      const openSensor = room.entities.find((entity) => {
        if (entity.hidden || entity.domain !== "binary_sensor") return false;
        const st = hass.states[entity.entity_id];
        const dc = String(st?.attributes.device_class ?? entity.device_class ?? "").toLowerCase();
        return OPENINGS.has(dc) && st?.state === "on";
      });
      if (openSensor) {
        insights.push({
          id: `climate-open:${room.id}:${openSensor.entity_id}`,
          severity: "warn",
          icon: "climate",
          title: `${room.name}: ${openSensor.name}`,
          subtitle: t("aiInsightWindowAc"),
          entity: activeClimate,
          actionType: "open_entity",
        });
      }
    }

    // 3. Elevated temperature readings
    for (const entity of room.entities) {
      if (entity.hidden || entity.domain !== "sensor") continue;
      const st = hass.states[entity.entity_id];
      if (!st) continue;
      const dc = String(st.attributes.device_class ?? entity.device_class ?? "").toLowerCase();
      if (dc !== "temperature") continue;
      const val = Number.parseFloat(st.state);
      const unit = String(st.attributes.unit_of_measurement ?? "°C");
      if (!Number.isFinite(val) || unit.includes("F")) continue;
      const isCpu = /cpu|processor|soc|chip/i.test(`${entity.entity_id} ${entity.name}`);
      if ((isCpu && val >= 74) || (!isCpu && val >= 36 && val < 95)) {
        insights.push({
          id: `high-temp:${entity.entity_id}`,
          severity: val >= (isCpu ? 84 : 40) ? "alert" : "warn",
          icon: "flame",
          title: entity.name,
          subtitle: t("aiInsightHighTemp").replace("{temp}", String(Math.round(val * 10) / 10)),
          entity,
          actionType: "open_entity",
        });
      }
    }
  }

  // 4. High household energy draw
  if (config.energy?.consumption) {
    const loadW = power(hass.states[config.energy.consumption]);
    if (loadW != null && loadW >= 3500) {
      insights.push({
        id: `power-spike:${config.energy.consumption}`,
        severity: loadW >= 5500 ? "alert" : "warn",
        icon: "bolt",
        title: t("energyHome"),
        subtitle: t("aiInsightPowerSpike").replace("{power}", formatPower(loadW, language)),
        actionType: "open_entity",
      });
    }
  }

  const order = { alert: 0, warn: 1, info: 2 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}

export function AIInsightsCard({
  config,
  data,
  hass,
  language,
  onOpen,
  t,
}: {
  config: HomeSmartConfig;
  data: DiscoveryResponse;
  hass: HomeAssistant;
  language?: string;
  onOpen: (entity: DiscoveredEntity) => void;
  t: (key: TranslationKey) => string;
}) {
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);

  const insights = useMemo(
    () => computeHomeInsights(config, data, hass, language, t),
    [config.energy?.consumption, data, hass.states, language, t],
  );
  const visible = insights.filter((item) => !dismissed.includes(item.id));

  const dismiss = (id: string) => {
    const next = [...new Set([...dismissed, id])];
    setDismissed(next);
    saveDismissed(next);
  };

  const resetDismissed = () => {
    setDismissed([]);
    saveDismissed([]);
  };

  const handleAction = (item: HomeInsight) => {
    if (item.actionType === "turn_off_light" && item.entity) {
      void hass.callService("light", "turn_off", { entity_id: item.entity.entity_id }).catch(() => undefined);
    } else if (item.entity) {
      onOpen(item.entity);
    }
  };

  return (
    <section aria-label={t("aiInsightTitle")} className="hs-insights-card">
      <header className="hs-insights-card__head">
        <span className="hs-insights-card__title">
          <HDIcon name="star" size={16} />
          {t("aiInsightTitle")}
        </span>
        {visible.length > 0 ? (
          <span className="hs-insights-card__count">{visible.length}</span>
        ) : dismissed.length > 0 ? (
          <button className="hs-insight-row__btn" onClick={resetDismissed} type="button">
            {t("aiInsightResetDismissed")}
          </button>
        ) : null}
      </header>

      {visible.length === 0 ? (
        <div className="hs-insights-calm">
          <HDIcon name="check" size={16} />
          <span>{t("aiInsightAllGood")}</span>
        </div>
      ) : (
        <div className="hs-insights-list">
          {visible.slice(0, 3).map((item) => (
            <div className={`hs-insight-row hs-insight-row--${item.severity}`} key={item.id}>
              <span className="hs-insight-row__icon">
                <HDIcon name={item.icon} size={16} />
              </span>
              <div className="hs-insight-row__copy">
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </div>
              <div className="hs-insight-row__actions">
                {item.actionType && item.entity && (
                  <button className="hs-insight-row__btn" onClick={() => handleAction(item)} type="button">
                    {item.actionType === "turn_off_light" ? t("aiInsightTurnOff") : t("aiInsightOpenDetails")}
                  </button>
                )}
                <button
                  aria-label={t("aiInsightDismiss")}
                  className="hs-insight-row__dismiss"
                  onClick={() => dismiss(item.id)}
                  title={t("aiInsightDismiss")}
                  type="button"
                >
                  <HDIcon name="close" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
