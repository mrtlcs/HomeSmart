import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { nextDirectionalItem } from "../dashboardNavigation";
import { hourOptions } from "../clock";
import { isQuietHour, type AdaptiveProfile, type DashboardTab, type ScreenOptions } from "../screenProfiles";
import { hvacLabel, safeIntlLocale } from "../i18n";
import { isSecurityAlert, isSecurityEntity } from "../security";
import type { ScreenProps } from "../screens/types";
import type { DiscoveredEntity } from "../types/discovery";
import { HDIcon, type IconName } from "./HDIcon";

const ICONS: Record<DashboardTab, IconName> = { home: "home", rooms: "grid", favorites: "star", alerts: "shield", more: "settings" };
const CONTROLS = new Set(["light", "switch", "climate", "scene", "media_player"]);
const HISTORY_KEY = "homeSmartDashboard";
type Route = { tab: DashboardTab; room?: string; detail?: string };
type Operation = { id: string; status: "pending" | "accepted" | "failed" };
const unavailable = (state?: string, domain?: string) => !state || state === "unavailable" || (state === "unknown" && domain !== "scene");

interface AdaptiveProps extends ScreenProps {
  profile: AdaptiveProfile;
  options: ScreenOptions;
  connection: "online" | "offline" | "reconnecting";
  syncedAt: number;
  presenceDetected: boolean;
  onReconnect: () => void;
  onClassic: () => void;
  onLegacyPage: (page: string) => void;
}

export function AdaptiveDashboard({ profile, options, data, config, hass, connection, syncedAt, presenceDetected, onReconnect, onSettings, onClassic, onLegacyPage, onConfig, t }: AdaptiveProps) {
  const allowedTabs = options.tabs;
  const initial = allowedTabs.includes(options.start) ? options.start : "home";
  const [route, setRoute] = useState<Route>({ tab: initial });
  const [query, setQuery] = useState("");
  const [operation, setOperation] = useState<Operation>();
  const pending = useRef(new Set<string>());
  const [asleep, setAsleep] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const idleSince = useRef(Date.now());
  const shell = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const scroll = useRef(0);
  const session = useRef(Math.random().toString(36).slice(2));
  const tv = profile === "tv";
  const kiosk = profile === "wall" || tv;
  const formatClock = (date: Date) => date.toLocaleTimeString(safeIntlLocale(hass.locale?.language ?? hass.language), { hour: "2-digit", minute: "2-digit", ...hourOptions() });
  const quiet = kiosk && isQuietHour(now.getHours(), options.quiet_start, options.quiet_end);

  useEffect(() => {
    const current = session.current;
    const onBack = (event: PopStateEvent) => {
      const entry = event.state?.[HISTORY_KEY];
      setRoute(entry?.session === current ? entry.route : { tab: initial });
      setAsleep(false);
    };
    const old = window.history.state ?? {};
    window.history.replaceState({ ...old, [HISTORY_KEY]: { session: current, route: { tab: initial } } }, "");
    setRoute({ tab: initial });
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [initial]);

  useEffect(() => {
    const update = () => {
      setNow(new Date());
      if (kiosk && !presenceDetected && options.idle && !route.detail && Date.now() - idleSince.current >= options.idle * 1000) setAsleep(true);
    };
    const timer = window.setInterval(update, options.idle && kiosk ? 1000 : 15_000);
    return () => window.clearInterval(timer);
  }, [options.idle, kiosk, route.detail, presenceDetected]);

  useEffect(() => {
    if (kiosk && presenceDetected) { idleSince.current = Date.now(); setAsleep(false); }
  }, [kiosk, presenceDetected]);

  useEffect(() => {
    if (asleep) shell.current?.querySelector<HTMLElement>(".hs-adaptive-idle")?.focus();
    else if (route.detail) dialog.current?.querySelector<HTMLElement>("button")?.focus();
    else if (opener.current) { opener.current.focus({ preventScroll: true }); opener.current = null; }
    else if (tv) shell.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    if (content.current && !route.detail) content.current.scrollTop = scroll.current;
  }, [route.tab, route.room, route.detail, tv, asleep]);

  const rooms = useMemo(() => new Map(data.rooms.map((room) => [room.id, room])), [data.rooms]);
  const entities = useMemo(() => [...new Map(data.rooms.flatMap((room) => room.entities.map((item) => [item.entity_id, item]))).values()].filter((entity) => !entity.hidden), [data.rooms]);
  const favorites = entities.filter((item) => config.favorites.includes(item.entity_id));
  const alerts = entities.filter((item) => isSecurityEntity(item, hass.states[item.entity_id]) && isSecurityAlert(hass.states[item.entity_id], item));
  const offline = entities.filter((item) => unavailable(hass.states[item.entity_id]?.state, item.domain));
  const quick = [...favorites, ...entities.filter((item) => ["light", "climate"].includes(item.domain) && !config.favorites.includes(item.entity_id))].filter((item) => CONTROLS.has(item.domain)).slice(0, tv ? 6 : 12);
  const detail = entities.find((item) => item.entity_id === route.detail);
  const wake = () => { idleSince.current = Date.now(); if (asleep) setAsleep(false); };
  const tabName = (tab: DashboardTab) => tab === "rooms" ? t("roomsPage") : tab === "alerts" ? t("alerts") : tab === "more" ? t("adaptiveMore") : t(tab);

  const go = (next: Route) => {
    if (next.tab === route.tab && next.room === route.room && next.detail === route.detail) return;
    scroll.current = next.detail ? (content.current?.scrollTop ?? 0) : 0;
    const history = { ...window.history.state, [HISTORY_KEY]: { session: session.current, route: next } };
    if (route.detail) window.history.replaceState(history, "");
    else window.history.pushState(history, "");
    setRoute(next);
  };

  const close = () => {
    if (route.detail || route.room || route.tab !== initial) window.history.back();
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    wake();
    if (event.key === "Escape" || (tv && ["Backspace", "BrowserBack", "GoBack"].includes(event.key) && !(event.target instanceof HTMLInputElement))) {
      if (!asleep && (route.detail || route.room || route.tab !== initial)) { event.preventDefault(); event.stopPropagation(); close(); }
      return;
    }
    const scope = route.detail ? dialog.current : shell.current;
    if (!scope) return;
    const focusables = Array.from(scope.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')).filter((node) => node.getClientRects().length > 0);
    if (event.key === "Tab" && route.detail && focusables.length) {
      const index = focusables.indexOf(event.target as HTMLElement);
      if (event.shiftKey ? index <= 0 : index === focusables.length - 1) {
        event.preventDefault();
        (event.shiftKey ? focusables.at(-1) : focusables[0])?.focus();
      }
      return;
    }
    if (!tv || !event.key.startsWith("Arrow") || event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    const active = event.target as HTMLElement;
    const center = (node: HTMLElement) => { const rect = node.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; };
    const next = nextDirectionalItem(center(active), focusables.map(center), event.key);
    if (next >= 0) focusables[next].focus();
  };

  const act = async (entity: DiscoveredEntity, domain: string, service: string, payload?: Record<string, unknown>) => {
    const id = entity.entity_id;
    if (connection !== "online" || pending.current.has(id) || unavailable(hass.states[id]?.state, entity.domain)) return;
    pending.current.add(id);
    setOperation({ id, status: "pending" });
    let timeout: number | undefined;
    try {
      const deadline = new Promise<never>((_, reject) => {
        timeout = window.setTimeout(() => reject(new Error("Service confirmation timed out")), 8000);
      });
      await Promise.race([deadline, hass.callService(domain, service, { entity_id: id, ...payload })]);
      setOperation((prev) => prev?.id === id ? { id, status: "accepted" } : prev);
    } catch {
      setOperation((prev) => prev?.id === id ? { id, status: "failed" } : prev);
    } finally { window.clearTimeout(timeout); pending.current.delete(id); }
  };

  const status = (entity: DiscoveredEntity) => {
    const state = hass.states[entity.entity_id];
    if (!state || unavailable(state.state, entity.domain)) return t("unavailable");
    if (entity.domain === "scene") return t("scenes");
    if (entity.domain === "climate" && typeof state.attributes.current_temperature === "number") {
      return `${state.attributes.current_temperature}° · ${hass.formatEntityState?.(state) ?? state.state}`;
    }
    if (state.state === "on") return t("stateOn");
    if (state.state === "off") return t("stateOff");
    return hass.formatEntityState?.(state) ?? state.state;
  };

  const control = (entity: DiscoveredEntity, expanded = false) => {
    const id = entity.entity_id;
    const state = hass.states[id];
    const disabled = connection !== "online" || unavailable(state?.state, entity.domain) || (operation?.id === id && operation.status === "pending");
    if (entity.domain === "light" || entity.domain === "switch") return <button disabled={disabled} onClick={() => void act(entity, entity.domain, state.state === "on" ? "turn_off" : "turn_on")} type="button">{state?.state === "on" ? t("turnOff") : t("turnOn")}</button>;
    if (entity.domain === "scene") return <button disabled={disabled} onClick={() => void act(entity, "scene", "turn_on")} type="button">{t("activate")}</button>;
    if (entity.domain === "media_player") return <button disabled={disabled} onClick={() => void act(entity, "media_player", state.state === "playing" ? "media_pause" : "media_play")} type="button">{state?.state === "playing" ? t("adaptivePause") : t("adaptivePlay")}</button>;
    if (entity.domain !== "climate" || !state) return null;
    const step = state.attributes.target_temp_step || 1;
    const min = state.attributes.min_temp ?? 7;
    const max = state.attributes.max_temp ?? 35;
    const range = typeof state.attributes.target_temp_low === "number" && typeof state.attributes.target_temp_high === "number"
      ? [state.attributes.target_temp_low, state.attributes.target_temp_high] as const : null;
    const targets = range ? [
      { value: range[0], lower: min, upper: range[1], field: "target_temp_low", label: t("adaptiveMinimum") },
      { value: range[1], lower: range[0], upper: max, field: "target_temp_high", label: t("adaptiveMaximum") },
    ] : typeof state.attributes.temperature === "number" ? [
      { value: state.attributes.temperature, lower: min, upper: max, field: "temperature", label: t("temperature") },
    ] : [];
    const modes = Array.isArray(state.attributes.hvac_modes) ? state.attributes.hvac_modes : [];
    return <>
      {targets.map(({ value, lower, upper, field, label }) => {
        const update = (next: number) => {
          const target = Math.max(lower, Math.min(upper, Number(next.toFixed(3))));
          const payload = range ? { target_temp_low: range[0], target_temp_high: range[1], [field]: target } : { temperature: target };
          void act(entity, "climate", "set_temperature", payload);
        };
        return <div aria-label={label} className="hs-adaptive-temp" key={field} role="group">
          <button aria-label={`${t("adaptiveCooler")} · ${label}: ${entity.name}`} disabled={disabled || value <= lower} onClick={() => update(value - step)} type="button">−</button>
          <span>{value}°</span>
          <button aria-label={`${t("adaptiveWarmer")} · ${label}: ${entity.name}`} disabled={disabled || value >= upper} onClick={() => update(value + step)} type="button">+</button>
        </div>;
      })}
      {expanded && modes.length > 0 && <div className="hs-adaptive-links">{modes.map((mode) => <button aria-pressed={mode === state.state} disabled={disabled} key={mode} onClick={() => void act(entity, "climate", "set_hvac_mode", { hvac_mode: mode })} type="button">{hvacLabel(mode, hass.locale?.language)}</button>)}</div>}
    </>;
  };

  const cards = (items: DiscoveredEntity[]) => <div className="hs-adaptive-grid">{items.map((item) => <article className="hs-adaptive-card" key={item.entity_id}>
    <button className="hs-adaptive-card-label" onClick={(event) => { opener.current = event.currentTarget; go({ ...route, detail: item.entity_id }); }} type="button">
      <b>{item.name}</b><span>{status(item)}</span>
    </button>
    {control(item)}
    {operation?.id === item.entity_id && <span role={operation.status === "failed" ? "alert" : "status"}>{t(operation.status === "pending" ? "adaptiveSending" : operation.status === "accepted" ? "adaptiveAccepted" : "adaptiveFailed")}</span>}
  </article>)}</div>;

  const search = query.trim().toLocaleLowerCase();
  const found = search ? entities.filter((item) => `${item.name} ${rooms.get(item.area_id)?.name ?? ""}`.toLocaleLowerCase().includes(search)).slice(0, 24) : [];
  return <div className={`hs-adaptive hs-adaptive--${profile} hs-adaptive--${options.density}${quiet ? " hs-adaptive--quiet" : ""}`} onKeyDown={handleKeys} onPointerDown={wake} ref={shell}>
    {asleep ? <button className="hs-adaptive-idle" onClick={wake} type="button"><strong>{formatClock(now)}</strong><span>{alerts.length ? `${alerts.length} ${t("alerts")}` : t("adaptiveWake")}</span></button> : <>
      <nav aria-label={t("navigation")} className="hs-adaptive-nav" inert={Boolean(detail)}>
        {allowedTabs.map((tab) => <button aria-current={route.tab === tab ? "page" : undefined} key={tab} onClick={() => go({ tab })} type="button"><HDIcon name={ICONS[tab]} size={22} />{tabName(tab)}</button>)}
      </nav>
      <main className="hs-adaptive-content" inert={Boolean(detail)} ref={content}>
        <header className="hs-adaptive-header"><div><h1>{route.tab === "home" ? t("appName") : rooms.get(route.room ?? "")?.name ?? tabName(route.tab)}</h1>{kiosk && <p>{formatClock(now)}</p>}</div>
          <button onClick={onSettings} type="button"><HDIcon name="settings" size={20} />{t("settings")}</button>
        </header>
        {connection !== "online" && <p className="hs-adaptive-connection" role="status">{t(connection === "offline" ? "adaptiveOffline" : "adaptiveReconnecting")} <button onClick={onReconnect} type="button">{t("refresh")}</button></p>}
        {route.tab === "home" && <>
          <div className="hs-adaptive-summary">
            <span>{data.counts.rooms} {t("roomsPage")}</span>
            <button disabled={!allowedTabs.includes("alerts")} onClick={() => go({ tab: "alerts" })} type="button">{alerts.length} {t("alerts")} · {offline.length} {t("unavailable")}</button>
          </div>
          {quick.length ? cards(quick) : <p>{t("noVisibleEntities")}</p>}
        </>}
        {route.tab === "rooms" && (route.room
          ? <><button onClick={close} type="button">{t("back")}</button>{cards(entities.filter((item) => item.area_id === route.room && (!tv || CONTROLS.has(item.domain))))}</>
          : <div className="hs-adaptive-grid">{data.rooms.map((room) => <button className="hs-adaptive-card" key={room.id} onClick={() => go({ tab: "rooms", room: room.id })} type="button">{room.name}</button>)}</div>)}
        {route.tab === "favorites" && (favorites.length ? cards(favorites.filter((item) => !tv || CONTROLS.has(item.domain))) : <p>{t("noVisibleEntities")}</p>)}
        {route.tab === "alerts" && <>
          {alerts.length ? cards(alerts) : <p>{t("allSecure")}</p>}
          <h2>{t("unavailable")}</h2>{offline.length ? cards(offline) : <p>0</p>}
        </>}
        {route.tab === "more" && <>
          {!tv && <label className="hs-adaptive-search">{t("adaptiveSearch")}<input onChange={(event) => setQuery(event.target.value)} type="search" value={query} /></label>}
          {search && (found.length ? cards(found) : <p>{t("noVisibleEntities")}</p>)}
          {!tv && <div className="hs-adaptive-links">
            {config.navigation.cameras && <button onClick={() => onLegacyPage("cameras")} type="button">{t("camerasTitle")}</button>}
            {config.navigation.media && <button onClick={() => onLegacyPage("media")} type="button">{t("media")}</button>}
            {config.navigation.plan && <button onClick={() => onLegacyPage("plan")} type="button">{t("profileFloorplan")}</button>}
            {config.navigation.system !== false && <button onClick={() => onLegacyPage("system")} type="button">{t("systemMonitor")}</button>}
            {config.navigation.vacuum !== false && entities.some((item) => item.domain === "vacuum") && <button onClick={() => onLegacyPage("vacuum")} type="button">{t("vacuumTabTitle")}</button>}
            {config.pages.map((page) => <button key={page.id} onClick={() => onLegacyPage(page.id)} type="button">{page.title}</button>)}
          </div>}
          <h2>{t("adaptiveDiagnostics")}</h2><p>{t(connection === "online" ? "adaptiveConnected" : connection === "offline" ? "adaptiveOffline" : "adaptiveReconnecting")}</p>
          {syncedAt > 0 && <p>{t("adaptiveLastSync")} {new Date(syncedAt).toLocaleTimeString()}</p>}
          <p>{offline.length} {t("unavailable")}</p>
          <button onClick={onReconnect} type="button">{t("refresh")}</button>
          <button onClick={onClassic} type="button">{t("adaptiveClassic")}</button>
        </>}
      </main>
      {detail && <div className="hs-adaptive-overlay" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div aria-labelledby="hs-adaptive-detail" aria-modal="true" className="hs-adaptive-detail" ref={dialog} role="dialog">
          <header><h2 id="hs-adaptive-detail">{detail.name}</h2><button onClick={close} type="button">{t("close")}</button></header>
          <p>{status(detail)}</p>{control(detail, true)}
          {!tv && hass.user?.is_admin && <button aria-pressed={config.favorites.includes(detail.entity_id)} onClick={() => onConfig((current) => ({
            ...current,
            favorites: current.favorites.includes(detail.entity_id) ? current.favorites.filter((id) => id !== detail.entity_id) : [...current.favorites, detail.entity_id],
          }))} type="button"><HDIcon name="star" size={20} />{t("favorites")}</button>}
          {operation?.id === detail.entity_id && <p role="status">{t(operation.status === "pending" ? "adaptiveSending" : operation.status === "accepted" ? "adaptiveAccepted" : "adaptiveFailed")}</p>}
        </div>
      </div>}
    </>}
  </div>;
}
