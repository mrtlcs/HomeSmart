import { RecentMediaCard } from "./RecentMedia";
import { BinsCard } from "./BinsCard";
import type { TranslationKey } from "../i18n";
import { hvacLabel } from "../i18n";
import type { WidgetKey } from "../layout";
import { isSecurityAlert, isSecurityEntity } from "../security";
import { AlarmButtons } from "./AlarmButtons";
import type { DiscoveredEntity, DiscoveryResponse } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";
import { useWideTile } from "./EditableGrid";
import { displayState } from "./EntityCard";
import { EntityIcon, HDIcon } from "./HDIcon";
import { useRef, useState } from "react";
import { useEscape } from "../useEscape";
import { createPortal } from "react-dom";
import { WideControls } from "./WideControls";
import { MediaIdle, SpotifyCard } from "./SpotifyCard";
import { usePlan } from "../plan";
import { isSpotify, mediaActive, usePlayers } from "../spotify";
import { mediaArt } from "../devices";
import type { HomeSmartConfig } from "../types/config";
import { TodayCard } from "./Agenda";
import { EnergyWidget, SunWidget, WeatherWidget } from "./ExtraWidgets";
import { PlanWidget } from "./FloorPlan";

function uniqueEntities(data: DiscoveryResponse): DiscoveredEntity[] {
  const seen = new Set<string>();
  return data.rooms.flatMap((room) => room.entities).filter((entity) => !seen.has(entity.entity_id) && Boolean(seen.add(entity.entity_id)));
}

/** Widgets only exist when the house has something to show in them; Today only when turned on in Settings. */
export function availableWidgets(data: DiscoveryResponse, today = false, extra: WidgetKey[] = []): WidgetKey[] {
  const entities = uniqueEntities(data);
  const keys: WidgetKey[] = [];
  if (entities.some((entity) => isSecurityEntity(entity))) keys.push("widget:security");
  if (entities.some((entity) => entity.domain === "climate")) keys.push("widget:climate");
  if (entities.some((entity) => entity.domain === "media_player")) keys.push("widget:media");
  if (today) keys.push("widget:today");
  return [...keys, ...extra];
}

export const WIDGET_LABELS: Record<WidgetKey, TranslationKey> = {
  "widget:security": "security",
  "widget:climate": "climate",
  "widget:media": "media",
  "widget:today": "today",
  "widget:weather": "weatherNow",
  "widget:sun": "sunCard",
  "widget:energy": "energy",
  "widget:bins": "binsCard",
  "widget:plan": "floorplan",
  "widget:recent": "recentMedia",
};

interface HomeWidgetProps {
  config: HomeSmartConfig;
  data: DiscoveryResponse;
  hass: HomeAssistant;
  kind: WidgetKey;
  language?: string;
  onOpen: (entity: DiscoveredEntity) => void;
  t: (key: TranslationKey) => string;
}

export function HomeWidget(props: HomeWidgetProps) {
  if (props.kind === "widget:today") return <TodayCard config={props.config} hass={props.hass} language={props.language} t={props.t} />;
  if (props.kind === "widget:weather") return <WeatherWidget config={props.config} hass={props.hass} language={props.language} t={props.t} />;
  if (props.kind === "widget:sun") return <SunWidget hass={props.hass} language={props.language} onOpen={props.onOpen} t={props.t} />;
  if (props.kind === "widget:bins") return <BinsCard config={props.config} hass={props.hass} language={props.language} onOpen={props.onOpen} t={props.t} />;
  if (props.kind === "widget:recent") return <RecentMediaCard config={props.config} hass={props.hass} onOpen={props.onOpen} t={props.t} />;
  if (props.kind === "widget:plan") return <PlanWidget config={props.config} data={props.data} hass={props.hass} t={props.t} />;
  if (props.kind === "widget:energy") return <EnergyWidget config={props.config} hass={props.hass} language={props.language} onOpen={props.onOpen} t={props.t} />;
  return <DeviceWidget {...props} />;
}

function DeviceWidget({ data, hass, kind, language, onOpen, t }: HomeWidgetProps) {
  const { pro } = usePlan();
  const everyPlayer = usePlayers();
  const wide = useWideTile();
  const entities = uniqueEntities(data);

  if (kind === "widget:security") {
    const monitored = entities.filter((entity) => isSecurityEntity(entity, hass.states[entity.entity_id]));
    const alerts = monitored.filter((entity) => isSecurityAlert(hass.states[entity.entity_id], entity));
    const target = alerts[0] ?? monitored[0];
    // An alarm panel with its buttons on: they show on this card too, at double size and up.
    const alarm = entities.find((entity) => entity.domain === "alarm_control_panel" && entity.alarm_buttons);
    if (wide) {
      // Double size lists what is being watched, alerts first.
      const listed = [...alerts, ...monitored.filter((entity) => !alerts.includes(entity))].slice(0, 4);
      return <div className={`widget-card widget-card--wide ${alerts.length > 0 ? "widget-card--alert" : ""}`}>
        <span className="widget-card__icon"><HDIcon name="shield" size={22} /></span>
        <span className="widget-card__label">{t("security")}</span>
        <strong>{alerts.length > 0 ? t("attentionRequired") : t("allSecure")}</strong>
        {alarm && <AlarmButtons entity={alarm} hass={hass} onOpen={onOpen} t={t} />}
        <ul className="widget-list">{listed.map((entity) => <li key={entity.entity_id}><button className={isSecurityAlert(hass.states[entity.entity_id], entity) ? "widget-list--alert" : undefined} onClick={() => onOpen(entity)} type="button"><span>{entity.name}</span><small>{displayState(hass.states[entity.entity_id], entity, t, language)}</small></button></li>)}</ul>
      </div>;
    }
    return <SecuritySmall alerts={alerts} hass={hass} language={language} monitored={monitored} onOpen={onOpen} t={t} />;
  }

  if (kind === "widget:climate") {
    const climates = entities.filter((entity) => entity.domain === "climate");
    const climate = climates.find((entity) => !["off", "unavailable"].includes(hass.states[entity.entity_id]?.state ?? "unavailable")) ?? climates[0];
    const state = climate ? hass.states[climate.entity_id] : undefined;
    const running = Boolean(state && !["off", "unavailable", "unknown"].includes(state.state));
    const current = state?.attributes.current_temperature;
    if (wide && climate && state && !["unavailable", "unknown"].includes(state.state)) {
      return <div className={`widget-card widget-card--wide widget-card--climate ${running ? "widget-card--playing" : ""}`} onClick={(event) => { if (!(event.target as HTMLElement).closest("button")) onOpen(climate); }} role="button" tabIndex={0}>
        <span className="widget-card__label">{t("climate")}</span>
        <p>{climate.name}{typeof current === "number" ? ` · ${current}°` : ""} · {hvacLabel(String(state.attributes.hvac_action ?? state.state), language)}</p>
        <div className="tile-wide"><WideControls entity={climate} hass={hass} language={language} state={state} t={t} /></div>
      </div>;
    }
    return <button className={`widget-card widget-card--interactive ${running ? "widget-card--playing" : ""}`} onClick={() => climate && onOpen(climate)} type="button">
      <span className="widget-card__icon"><HDIcon name="climate" size={22} /></span>
      <span className="widget-card__label">{t("climate")}</span>
      <strong>{typeof current === "number" ? `${current}°` : state ? hvacLabel(state.state, language) : "—"}</strong>
      <p>{climate?.name}{state ? ` · ${hvacLabel(String(state.attributes.hvac_action ?? state.state), language)}` : ""}</p>
    </button>;
  }

  const players = entities.filter((entity) => entity.domain === "media_player");
  const spotify = players.find((entity) => isSpotify(entity) && hass.states[entity.entity_id]?.state !== "unavailable") ?? players.find(isSpotify);
  // With the player card on every player, the one playing comes first (Spotify among them).
  const playingNow = everyPlayer ? players.filter((entity) => hass.states[entity.entity_id]?.state === "playing").sort((a, b) => Number(isSpotify(b)) - Number(isSpotify(a)))[0] : undefined;
  const featured = playingNow ?? spotify;
  if (featured && pro) return <SpotifyCard entity={featured} hass={hass} onOpen={onOpen} t={t} />;
  const media = players.find((entity) => hass.states[entity.entity_id]?.state === "playing")
    ?? players.find((entity) => !["off", "unavailable", "standby"].includes(hass.states[entity.entity_id]?.state ?? "unavailable"))
    ?? players[0];
  const state = media ? hass.states[media.entity_id] : undefined;
  const playing = state?.state === "playing";
  const art = mediaArt(state);
  const icon = art ? <span className="widget-card__icon widget-card__icon--art" style={{ backgroundImage: art }} /> : <span className="widget-card__icon"><HDIcon name="media" size={22} /></span>;
  if (media && !mediaActive(state)) return <MediaIdle entity={media} hass={hass} onOpen={onOpen} t={t} />;
  if (wide && media && state && state.state !== "unavailable") {
    return <div className={`widget-card widget-card--wide widget-card--media ${playing ? "widget-card--playing" : ""}`} onClick={(event) => { if (!(event.target as HTMLElement).closest("button, input, label")) onOpen(media); }} role="button" tabIndex={0}>
      {icon}
      <span className="widget-card__label">{t("media")}</span>
      <strong>{String(state.attributes.media_title ?? media.name)}</strong>
      <p>{String(state.attributes.media_artist ?? media.name)}</p>
      <div className="tile-wide"><WideControls entity={media} hass={hass} language={language} state={state} t={t} /></div>
    </div>;
  }
  return <div className={`widget-card widget-card--media widget-card--interactive ${playing ? "widget-card--playing" : ""}`} onClick={() => media && onOpen(media)} role="button" tabIndex={0}>
    {icon}
    <span className="widget-card__label">{t("media")}</span>
    <strong>{String(state?.attributes.media_title ?? media?.name ?? t("nothingPlaying"))}</strong>
    <p>{String(state?.attributes.media_artist ?? (state ? (playing ? t("on") : t("nothingPlaying")) : ""))}</p>
    {media && <button aria-label={t("playPause")} onClick={(event) => { event.stopPropagation(); void hass.callService("media_player", "media_play_pause", { entity_id: media.entity_id }); }} type="button"><HDIcon name={playing ? "volume" : "media"} size={18} /></button>}
  </div>;
}

/** An alert's state as Home Assistant words it ("Unlocked", "Open"), else the card's own text. */
function alertState(hass: HomeAssistant, entity: DiscoveredEntity, t: (key: TranslationKey) => string, language?: string): string {
  const state = hass.states[entity.entity_id];
  const format = (hass as unknown as { formatEntityState?: (value: NonNullable<typeof state>) => string }).formatEntityState;
  if (state && typeof format === "function") { try { return format.call(hass, state); } catch { /* falls back below */ } }
  return displayState(state, entity, t, language);
}

/** The normal-size Security card: one alert opens it; with several, a tap lists them all, each one
 * opening its details (the card used to open only the first one). */
function SecuritySmall({ alerts, hass, language, monitored, onOpen, t }: { alerts: DiscoveredEntity[]; hass: HomeAssistant; language?: string; monitored: DiscoveredEntity[]; onOpen: (entity: DiscoveredEntity) => void; t: (key: TranslationKey) => string }) {
  const [listing, setListing] = useState(false);
  useEscape(() => setListing(false), listing);
  const ref = useRef<HTMLButtonElement>(null);
  const target = alerts[0] ?? monitored[0];
  const shell = ref.current?.closest(".app-shell");
  return <>
    <button className={`widget-card widget-card--interactive ${alerts.length > 0 ? "widget-card--alert" : ""}`} onClick={() => { if (alerts.length > 1) setListing(true); else if (target) onOpen(target); }} ref={ref} type="button">
      <span className="widget-card__icon"><HDIcon name="shield" size={22} /></span>
      <span className="widget-card__label">{t("security")}</span>
      <strong>{alerts.length > 0 ? t("attentionRequired") : t("allSecure")}</strong>
      <p>{alerts.length === 0 ? `${monitored.length} ${t("monitored")}` : alerts.length === 1 ? alerts[0].name : `${alerts.length} ${t("alerts")}`}</p>
    </button>
    {listing && shell && createPortal(<div aria-label={t("attentionRequired")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setListing(false); }} role="dialog">
      <section className="hd-sheet hd-picker hd-alerts">
        <header className="hd-sheet__header">
          <div><span className="eyebrow">{t("security")}</span><h2>{t("attentionRequired")}</h2></div>
          <button className="hd-sheet__close" onClick={() => setListing(false)} type="button">{t("close")}</button>
        </header>
        <div className="hd-picker__list"><section><div className="hd-picker__rows">
          {alerts.map((entity) => <button className="hd-picker__row hd-alerts__row" key={entity.entity_id} onClick={() => { setListing(false); onOpen(entity); }} type="button">
            <span className="hd-picker__icon"><EntityIcon entity={entity} size={18} /></span>
            <span className="hd-picker__copy"><strong>{entity.name}</strong><small>{alertState(hass, entity, t, language)}</small></span>
            <HDIcon name="chevron" size={16} />
          </button>)}
        </div></section></div>
      </section>
    </div>, shell)}
  </>;
}
