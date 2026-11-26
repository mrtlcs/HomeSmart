import { setClockFormat } from "./clock";
import { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getConfig, saveConfig as persistConfig } from "./api/config";
import { discoverRooms } from "./api/discovery";
import { activateLicense, claimCheckout, getLicense, type LicenseStatus } from "./api/license";
import { HDIcon } from "./components/HDIcon";
import { KeyBar } from "./components/KeyBar";
import { FloorPlan, planTitle } from "./components/FloorPlan";
import { DynamicShell } from "./components/DynamicShell";
import { pageIcon, NavigationDock, orderTabs, type HomeSmartPage } from "./components/NavigationDock";
import { ProSheet } from "./components/ProSheet";
import { FocusLayout } from "./screens/layouts/FocusLayout";
import { ListLayout } from "./screens/layouts/ListLayout";
import { SidebarLayout, type NavLink } from "./screens/layouts/SidebarLayout";
import { PhotoLayout } from "./screens/layouts/PhotoLayout";
import { Screensaver } from "./components/Screensaver";
import { pauseCameras } from "./cameraPause";
import { PinPadModal } from "./components/PinPadModal";
import { DoorbellPopup, useDoorbell } from "./components/Doorbell";
import { forgetCalendarColors, useOccasion } from "./components/Agenda";
import { devicePin, batteryGuard, childLocked, childLockNote, deviceBackground, deviceKidsScene, deviceLanguage, deviceViewMode, editingLocked, keepAwakeMode, presenceWakeSensor, useChildLockNote, useDevicePref } from "./devicePrefs";
import { guardHass, type ChildLockState } from "./childLock";
import { VIEW_MODES } from "./components/LayoutPicker";
import { KIDS_SCENES } from "./components/KidsScene";
import { keepAwakeWanted, startKeepAwake } from "./keepAwake";
import { setHapticsEnabled } from "./haptics";
import { createTranslator, normalizeLanguage } from "./i18n";
import { inDesktopApp, reportLicenseToDesktop, wantsProSheet } from "./desktop";
import { PageCreatorModal } from "./components/PageStudio";
import { entityKey, getLayout, migrateLayouts, pageScreen, roomScreen, setHidden, withLayout } from "./layout";
import { effectiveConfig, freeDevices, isControllable, overFreeLimits, panelRoomIds, PlanContext, restrictRooms, type PlanState, type UpsellReason } from "./plan";
import { availableSections } from "./security";
import { setStateText } from "./devices";
import { applyAudience, CustomizeContext, personalize, withNickname, withEntityOptions, withRoomOptions } from "./personalize";
import { PageScreen } from "./screens/PageScreen";
import { pageId, type PageRef } from "./screens/pages";
import { HomeScreen } from "./screens/HomeScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { PlanGateScreen } from "./screens/PlanGateScreen";
import { RoomScreen } from "./screens/RoomScreen";
import { resolveScreenProfile, screenOptions, setScreenProfile, useScreenProfile } from "./screenProfiles";
import { layoutChanged, useLayoutHistory } from "./layoutHistory";

import { VacuumScreen } from "./components/DreameVacuum";
import type { ScreenProps } from "./screens/types";
import type { HomeSmartEntityOptions, HomeSmartConfig, ScreenLayout } from "./types/config";
import type { DiscoveryResponse } from "./types/discovery";
import type { HomeAssistant } from "./types/home-assistant";

const SettingsScreen = lazy(() => import("./screens/SettingsScreen").then((module) => ({ default: module.SettingsScreen })));
const AdaptiveDashboard = lazy(() => import("./components/AdaptiveDashboard").then((module) => ({ default: module.AdaptiveDashboard })));
const SystemMonitorScreen = lazy(() => import("./screens/SystemMonitorScreen").then((module) => ({ default: module.SystemMonitorScreen })));

const DEFAULT_LIMITS = { rooms: 4, devices: 10 };
/** A minute without a touch brings the panel back to Home. */
const IDLE_HOME_MS = 60_000;

/** The panel's settings with this device's own layout, background and Kids scene, when it has them. */
function onThisDevice(config: HomeSmartConfig, view: string, background: string, kids: string): HomeSmartConfig {
  const mode = VIEW_MODES.find((item) => item.id === view)?.id;
  const scene = KIDS_SCENES.find(([id]) => id === kids)?.[0];
  const preset = /^(adaptive|fixed)_[a-z]+$/.test(background) ? (background as HomeSmartConfig["background"]["preset"]) : undefined;
  if (!mode && !scene && !preset) return config;
  return { ...config, ...(mode ? { view_mode: mode } : {}), ...(scene ? { kids_background: scene } : {}), ...(preset ? { background: { ...config.background, preset } } : {}) };
}

export function App({ hass: haHass, version, availableWidth }: { hass: HomeAssistant; version?: string; availableWidth?: number }) {
  // Every screen gets hass through the child lock, which drops calls to locked devices while it is on.
  const childLock = useRef<ChildLockState>({ locked: false, ids: new Set() });
  const unlockPending = useRef<((approved: boolean) => void) | null>(null);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockFailed, setUnlockFailed] = useState(false);
  const [saveError, setSaveError] = useState<"configConflict" | "settingsNotSaved" | null>(null);
  const canEdit = haHass.user?.is_admin === true;
  const approvalText = useRef("");
  const finishUnlock = useCallback((approved: boolean) => {
    const resolve = unlockPending.current;
    unlockPending.current = null;
    setUnlockPin("");
    resolve?.(approved);
  }, []);
  useEffect(() => {
    setUnlockPin("");
    return () => { unlockPending.current?.(false); unlockPending.current = null; };
  }, [haHass.connection]);
  const hass = useMemo<HomeAssistant>(() => {
    const guarded = guardHass(haHass, childLock);
    return {
      ...guarded,
      async callService(...args) {
        const [domain, service] = args;
        if (domain !== "lock" || (service !== "unlock" && service !== "open")) {
          return guarded.callService(...args);
        }
        if (unlockPending.current) return;
        setUnlockFailed(false);
        const pin = devicePin();
        const approved = pin
          ? await new Promise<boolean>((resolve) => { unlockPending.current = resolve; setUnlockPin(pin); })
          : window.confirm(approvalText.current);
        if (!approved) return;
        try {
          return await guarded.callService(...args);
        } catch {
          setUnlockFailed(true);
        }
      },
    };
  }, [haHass]);
  setStateText(hass);
  const [rawData, setData] = useState<DiscoveryResponse | null>(null);
  const [config, setConfig] = useState<HomeSmartConfig | null>(null);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  // An integration that predates licenses (not restarted after an update) has no license command.
  const [legacyBackend, setLegacyBackend] = useState(false);
  const [upsellReason, setUpsellReason] = useState<UpsellReason | null>(null);
  const [error, setError] = useState(false);
  const [connection, setConnection] = useState<"online" | "offline" | "reconnecting">(() => navigator.onLine ? "reconnecting" : "offline");
  const [syncedAt, setSyncedAt] = useState(0);
  const [legacyPage, setLegacyPage] = useState(false);
  const [conflictDraft, setConflictDraft] = useState<HomeSmartConfig>();
  const deviceProfile = useScreenProfile(hass.user?.id);
  const { versions, remember } = useLayoutHistory(hass.user?.id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<HomeSmartConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<HomeSmartPage>("home");
  const [creatingPage, setCreatingPage] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const configRef = useRef<HomeSmartConfig | null>(null);
  const persistedConfig = useRef<HomeSmartConfig | null>(null);
  const conflicting = useRef(false);
  const lastActivity = useRef(Date.now());
  const profile = resolveScreenProfile(deviceProfile, hass.user?.id, config?.screen_profiles, availableWidth ?? window.innerWidth, window.matchMedia("(pointer: coarse)").matches);
  const [saverOn, setSaverOn] = useState(false);
  const devLang = useDevicePref(deviceLanguage);
  const rawLang = devLang && devLang !== "auto" ? devLang : (hass.locale?.language ?? hass.language);
  const language = normalizeLanguage(rawLang);
  const t = useMemo(() => createTranslator(language), [language]);
  approvalText.current = t("unlockConfirmPrompt");
  const pro = license?.plan === "pro" || legacyBackend;
  // Nicknames and room options apply to every screen through the discovery data, and "Who can see" (Pro) too.
  const named = useMemo(() => (rawData ? personalize(rawData, config?.names, config?.rooms, config?.entity_options, config?.ha_icons, config?.layouts, config?.ha_room_icons) : null), [rawData, config?.names, config?.rooms, config?.entity_options, config?.ha_icons, config?.layouts, config?.ha_room_icons]);
  const hiddenFor = pro ? config?.hidden_for : undefined;
  const data = useMemo(() => (named ? applyAudience(named, hiddenFor, hass.user, editing) : null), [named, hiddenFor, hass.user?.id, hass.user?.is_admin, editing]);

  const load = useCallback(async () => {
    setError(false);
    setConnection(navigator.onLine ? "reconnecting" : "offline");
    let timeout: number | undefined;
    try {
      await saveQueue.current;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = window.setTimeout(() => reject(new Error("Timeout waiting for HomeSmart data")), 8000);
      });
      const [discovery, savedConfig] = await Promise.race([
        Promise.all([discoverRooms(hass), getConfig(hass)]),
        timeoutPromise,
      ]);
      setData(discovery);
      setSyncedAt(Date.now());
      setConnection(navigator.onLine && hass.connection.connected !== false ? "online" : "offline");
      persistedConfig.current = savedConfig;
      configRef.current = savedConfig;
      conflicting.current = false;
      setSaveError(null);
      setConfig(savedConfig);
    } catch (err) {
      console.error("[HomeSmart] Load error:", err);
      setConnection("offline");
      if (!configRef.current) setError(true);
      return;
    } finally {
      window.clearTimeout(timeout);
    }
    try {
      const status = await getLicense(hass);
      setLicense(status);
      setLegacyBackend(false);
      // A purchase paid while the panel was closed activates on the next load.
      if (status.pending) setLicense(await claimCheckout(hass));
    } catch (err) {
      setLegacyBackend((err as { code?: string })?.code === "unknown_command");
    }
  }, [hass.connection]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const socket = hass.connection;
    let active = true;
    let generation = 0;
    const offline = () => { generation += 1; setConnection("offline"); };
    const reconnect = () => {
      const attempt = ++generation;
      setConnection("reconnecting");
      if (socket.connected === false) return;
      if (!configRef.current) { void load(); return; }
      void discoverRooms(hass).then((next) => {
        if (!active || attempt !== generation) return;
        setData(next);
        setSyncedAt(Date.now());
        setConnection("online");
      }).catch(() => { if (active && attempt === generation) setConnection("offline"); });
    };
    socket.addEventListener?.("disconnected", offline);
    socket.addEventListener?.("ready", reconnect);
    window.addEventListener("offline", offline);
    window.addEventListener("online", reconnect);
    return () => {
      active = false;
      socket.removeEventListener?.("disconnected", offline);
      socket.removeEventListener?.("ready", reconnect);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", reconnect);
    };
  }, [hass.connection, load]);

  // Areas, devices and entities added or moved in Home Assistant show up without a manual refresh.
  useEffect(() => {
    const { connection } = hass;
    if (!connection.subscribeMessage) return;
    let cancelled = false;
    let timer: number | undefined;
    const unsubscribers: Array<() => void> = [];
    const rediscover = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void discoverRooms(hass).then((discovery) => { if (!cancelled) setData(discovery); }).catch(() => undefined);
      }, 1500);
    };
    for (const eventType of ["area_registry_updated", "device_registry_updated", "entity_registry_updated"]) {
      const handler = eventType === "entity_registry_updated" ? (event: unknown) => { const data = (event as { data?: { entity_id?: string } })?.data; if (data?.entity_id?.startsWith("calendar.")) forgetCalendarColors(); rediscover(); } : rediscover;
      void connection.subscribeMessage(handler, { type: "subscribe_events", event_type: eventType })
        .then((unsubscribe) => { if (cancelled) unsubscribe(); else unsubscribers.push(unsubscribe); })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [hass.connection]);

  // HOMESMART Desktop checks the license itself: tell it on load, after every change and twice a day.
  useEffect(() => {
    if (!inDesktopApp() || (!license && !legacyBackend)) return;
    void reportLicenseToDesktop(hass);
    const timer = window.setInterval(() => { void reportLicenseToDesktop(hass); }, 12 * 3600_000);
    return () => window.clearInterval(timer);
  }, [license, legacyBackend, hass.connection]);

  // The desktop app's "Get Pro" opens /HOMESMART?pro=1 in the browser, straight on the Pro sheet.
  const proLinkShown = useRef(false);
  useEffect(() => {
    if (proLinkShown.current || !license || license.plan === "pro" || !wantsProSheet()) return;
    proLinkShown.current = true;
    setUpsellReason("general");
  }, [license]);

  // The server checks revisions across clients. Within this tab, apply edits in order.
  const updateConfig = useCallback((update: (current: HomeSmartConfig) => HomeSmartConfig) => {
    const current = configRef.current;
    if (!current || !canEdit || conflicting.current) {
      const refused = Promise.reject(new Error("HomeSmart configuration cannot be edited"));
      void refused.catch(() => undefined);
      return refused;
    }
    const next = update(current);
    configRef.current = next;
    setConfig(next);
    const run = saveQueue.current.then(async () => {
      if (conflicting.current) throw new Error("HomeSmart configuration conflict");
      const before = persistedConfig.current;
      const saved = await persistConfig(hass, next, before?.revision ?? 0);
      if (before && layoutChanged(before, saved)) remember(before);
      persistedConfig.current = saved;
      setSaveError(null);
      if (configRef.current === next) {
        configRef.current = saved;
        setConfig(saved);
      }
    });
    saveQueue.current = run.catch((err) => {
      if ((err as { code?: string })?.code === "config_conflict") {
        conflicting.current = true;
        setConflictDraft(configRef.current ?? next);
      }
      setSaveError(conflicting.current ? "configConflict" : "settingsNotSaved");
      if (configRef.current === next && persistedConfig.current) {
        configRef.current = persistedConfig.current;
        setConfig(persistedConfig.current);
      }
    });
    return run;
  }, [hass.connection, canEdit, remember]);
  const saveConfig = useCallback((next: HomeSmartConfig) => updateConfig(() => next), [updateConfig]);

  // One-time move from the 0.3 visibility options to per-screen layouts.
  useEffect(() => {
    if (!canEdit || saveError || !config || !data || !config.onboarding_complete) return;
    const migrated = migrateLayouts(config, data);
    if (migrated) void saveConfig(migrated);
  }, [canEdit, config, data, saveConfig, saveError]);

  const limits = license?.limits ?? DEFAULT_LIMITS;
  const allowed = useMemo(() => (pro || !config || !data ? null : new Set(freeDevices(config, data.rooms))), [pro, config, data]);
  // This device's own layout and background (Settings → This device) go over the panel's, before the plan's
  // limits, so Pro layouts and backgrounds still need Pro.
  const devView = useDevicePref(deviceViewMode);
  const devBackground = useDevicePref(deviceBackground);
  const devKids = useDevicePref(deviceKidsScene);
  // Every clock, haptics and time follows the chosen format (or the Home Assistant profile's).
  setClockFormat(config?.preferences?.clock, hass.locale?.time_format);
  setHapticsEnabled(config?.cards?.haptics !== false);
  const view = useMemo(() => (config ? effectiveConfig(onThisDevice(config, devView, devBackground, devKids), pro) : null), [config, pro, devView, devBackground, devKids]);

  const plan = useMemo<PlanState>(() => ({
    pro,
    license,
    limits,
    allowed,
    upsell: (reason = "general") => setUpsellReason(reason),
    allow: (entityId) => {
      if (!allowed || !data) return true;
      const entity = data.rooms.flatMap((room) => room.entities).find((item) => item.entity_id === entityId);
      if (!entity || !isControllable(entity) || allowed.has(entityId)) return true;
      if (allowed.size >= limits.devices) { setUpsellReason("devices"); return false; }
      void updateConfig((current) => ({ ...current, free_devices: [...freeDevices(current, data.rooms), entityId] }));
      return true;
    },
  }), [pro, license, limits, allowed, data, updateConfig]);

  const customize = useMemo(() => {
    const byId = new Map((data?.rooms ?? []).flatMap((room) => room.entities).map((entity) => [entity.entity_id, entity]));
    return {
    lookup: (entityId: string) => byId.get(entityId),
    rename: (entityId: string, name: string, original: string) => void updateConfig((current) => withNickname(current, entityId, name, original)),
    setRoom: (roomId: string, change: { icon?: string; temperature?: string; humidity?: string; accent?: string }) => void updateConfig((current) => withRoomOptions(current, roomId, change)),
    setEntity: (entityId: string, change: HomeSmartEntityOptions) => void updateConfig((current) => withEntityOptions(current, entityId, change)),
    rooms: () => data?.rooms ?? [],
    restricted: (itemKey: string) => Boolean(hass.user && hiddenFor?.[itemKey]?.includes(hass.user.id)),
    hiddenFor: (itemKey: string) => config?.hidden_for?.[itemKey] ?? [],
    setHiddenFor: (itemKey: string, userId: string, hidden: boolean) => void updateConfig((current) => {
      const { [itemKey]: previous = [], ...rest } = current.hidden_for ?? {};
      const next = hidden ? [...new Set([...previous, userId])] : previous.filter((id) => id !== userId);
      return { ...current, hidden_for: next.length > 0 ? { ...rest, [itemKey]: next } : rest };
    }),
    linksFor: (itemKey: string) => config?.card_links?.[itemKey] ?? [],
    linkName: (itemKey: string, entityId: string) => config?.card_link_names?.[itemKey]?.[entityId] ?? "",
    setLinkName: (itemKey: string, entityId: string, name: string) => void updateConfig((current) => {
      const { [entityId]: _old, ...names } = current.card_link_names?.[itemKey] ?? {};
      const next = name.trim() ? { ...names, [entityId]: name.trim() } : names;
      const { [itemKey]: _card, ...others } = current.card_link_names ?? {};
      return { ...current, card_link_names: Object.keys(next).length > 0 ? { ...others, [itemKey]: next } : others };
    }),
    roomName: (screen: string, entityId: string) => config?.room_names?.[screen]?.[entityId] ?? "",
    // A device with no area, moved into a room inside HOMESMART: added to that room and hidden where it was.
    moveToRoom: (entityId: string, fromRoomId: string, toRoomId: string) => void updateConfig((current) => {
      const key = entityKey(entityId);
      const target = getLayout(current, roomScreen(toRoomId));
      const withTarget = withLayout(current, roomScreen(toRoomId), { ...setHidden(target, key, false), added: [...new Set([...(target.added ?? []), entityId])] });
      return withLayout(withTarget, roomScreen(fromRoomId), setHidden(getLayout(withTarget, roomScreen(fromRoomId)), key, true));
    }),
    setRoomName: (screen: string, entityId: string, name: string) => void updateConfig((current) => {
      const { [entityId]: _old, ...names } = current.room_names?.[screen] ?? {};
      const next = name.trim() ? { ...names, [entityId]: name.trim() } : names;
      const { [screen]: _room, ...others } = current.room_names ?? {};
      return { ...current, room_names: Object.keys(next).length > 0 ? { ...others, [screen]: next } : others };
    }),
    setLinks: (itemKey: string, ids: string[]) => void updateConfig((current) => {
      const { [itemKey]: _previous, ...rest } = current.card_links ?? {};
      return { ...current, card_links: ids.length > 0 ? { ...rest, [itemKey]: ids } : rest };
    }),
    };
  }, [data, updateConfig, config?.card_links, config?.card_link_names, config?.room_names, config?.hidden_for, hiddenFor, hass.user?.id]);

  useEffect(() => { pauseCameras("screensaver", saverOn); }, [saverOn]);

  const confirmingUnlock = unlockPin !== "";
  // Screensaver: any touch, click, scroll or key counts as activity.
  const saver = view?.screensaver;
  useEffect(() => {
    const touch = () => { lastActivity.current = Date.now(); };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((name) => window.addEventListener(name, touch, { capture: true, passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, touch, { capture: true }));
  }, []);
  useEffect(() => {
    if ((profile !== "classic" && !legacyPage) || !saver?.enabled || editing || settingsOpen || confirmingUnlock) { setSaverOn(false); return; }
    lastActivity.current = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= saver.delay * 1000) setSaverOn(true);
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [saver?.enabled, saver?.delay, editing, settingsOpen, confirmingUnlock, profile, legacyPage]);
  const dismissSaver = useCallback(() => { lastActivity.current = Date.now(); setSaverOn(false); }, []);

  // Doorbell (Pro): a ring wakes the panel and shows the camera above everything.
  const [ringing, setRinging] = useState(false);
  // A wall tablet can lock editing: no Edit button, and Edit mode closes if it was open.
  const childOn = useDevicePref(childLocked);
  // While the child lock is on, editing stays locked too, so the lock cannot be turned off from Settings.
  const locallyLocked = useDevicePref(editingLocked);
  const locked = !canEdit || locallyLocked || childOn || saveError === "configConflict";
  childLock.current = { locked: childOn, ids: new Set(Object.entries(config?.entity_options ?? {}).filter(([, options]) => options.child_lock).map(([id]) => id)) };
  const lockNote = useChildLockNote();
  // Echo Show and other wall screens: keep the browser open and the display on (per device).
  const awake = useDevicePref(keepAwakeMode);
  useEffect(() => (keepAwakeWanted(awake) ? startKeepAwake() : undefined), [awake]);
  useEffect(() => { if (locked) setEditing(false); }, [locked]);

  // Phase 2: Presence / Motion sensor auto wake-up
  const wakeSensor = useDevicePref(presenceWakeSensor);
  const wakeState = wakeSensor ? hass.states[wakeSensor]?.state : undefined;
  useEffect(() => {
    if (wakeSensor && wakeState === "on" && saverOn) {
      dismissSaver();
    }
  }, [wakeSensor, wakeState, saverOn, dismissSaver]);

  // Phase 2: Battery Health Guard (auto toggle smart plug between min and max %)
  const bg = useDevicePref(batteryGuard);
  const batteryLevel = bg.enabled && bg.sensor ? Number.parseFloat(hass.states[bg.sensor]?.state ?? "") : undefined;
  const plugState = bg.enabled && bg.switch ? hass.states[bg.switch]?.state : undefined;
  useEffect(() => {
    if (!bg.enabled || !bg.sensor || !bg.switch || batteryLevel == null || !Number.isFinite(batteryLevel) || !plugState) return;
    if (batteryLevel >= bg.max && plugState === "on") {
      void hass.callService("switch", "turn_off", { entity_id: bg.switch }).catch(() => undefined);
    } else if (batteryLevel <= bg.min && plugState === "off") {
      void hass.callService("switch", "turn_on", { entity_id: bg.switch }).catch(() => undefined);
    }
  }, [bg, batteryLevel, plugState, hass]);
  useDoorbell(hass, view?.doorbell, useCallback(() => { dismissSaver(); setRinging(true); }, [dismissSaver]));
  const stopRinging = useCallback(() => { lastActivity.current = Date.now(); setRinging(false); }, []);
  // After a minute with nobody touching the panel, it goes back to Home, in any layout. Not while the
  // screensaver, Edit mode, Settings or the doorbell are up, nor on the cameras, the full-screen player or a
  // full-screen camera, which are meant to be watched.
  const probe = useRef<HTMLSpanElement>(null);
  // The start screen chosen in Navigation, while that tab is still on; Home otherwise.
  const startPage = startScreen(view, pro);
  const opened = useRef(false);
  useEffect(() => { if (view && !opened.current) { opened.current = true; if (startPage !== "home") setActivePage(startPage); } }, [view, startPage]);
  const cameraPage = activePage === "cameras" || view?.pages.some((page) => page.id === activePage && page.type === "cameras");
  useEffect(() => {
    if ((activePage === startPage && !selectedRoomId) || editing || settingsOpen || saverOn || ringing || cameraPage || confirmingUnlock) return;
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current < IDLE_HOME_MS) return;
      const root = probe.current?.getRootNode() as Document | ShadowRoot | undefined;
      if (root?.querySelector(".hd-player, .hd-camera, .hd-camera__full, .hd-doorbell")) return;
      setSelectedRoomId(null);
      setActivePage(startPage);
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [activePage, startPage, selectedRoomId, editing, settingsOpen, saverOn, ringing, cameraPage, confirmingUnlock]);

  // Special dates (Pro): the occasion near or happening now, and New Year's fireworks.
  const season = useOccasion(view, hass, t);

  useEffect(() => {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }, [activePage, settingsOpen, selectedRoomId]);

  const visibleData = useMemo<DiscoveryResponse | null>(() => {
    if (!data || !view) return null;
    const byId = new Map(data.rooms.map((room) => [room.id, room]));
    const selected = panelRoomIds(view, data.rooms, pro).map((roomId) => byId.get(roomId)).filter((room): room is DiscoveryResponse["rooms"][number] => Boolean(room));
    // Automations are never a room's own cards: they show only where they are added (Edit → Add devices),
    // so the rooms look as before for everyone with automations in an area.
    const rooms = restrictRooms(selected, allowed).map((room) => (room.entities.some((entity) => entity.domain === "automation") ? { ...room, entities: room.entities.filter((entity) => entity.domain !== "automation") } : room));
    return {
      ...data,
      rooms,
      counts: {
        rooms: rooms.filter((room) => room.id !== "__unassigned__").length,
        devices: rooms.reduce((total, room) => total + room.device_count, 0),
        entities: rooms.reduce((total, room) => total + room.entities.length, 0),
      },
    };
  }, [view, data, allowed, pro]);

  // Cards, rich notifications and companion deep links (?hs_room= / #hs-room= / #hs-page=) navigate via events & URL.
  useEffect(() => {
    const go = (event: Event) => { setLegacyPage(true); const page = (event as CustomEvent<string>).detail; if (typeof page === "string") { setSelectedRoomId(null); setActivePage(page); } };
    const goRoom = (event: Event) => { setLegacyPage(true); const roomId = (event as CustomEvent<string>).detail; if (typeof roomId === "string" && roomId) { setSelectedRoomId(roomId); setActivePage("rooms"); } };
    const applyDeepLink = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const hashRoom = /hs-room=([^&]+)/.exec(hash)?.[1];
        const hashPage = /hs-page=([^&]+)/.exec(hash)?.[1];
        const roomParam = params.get("hs_room") ?? (hashRoom ? decodeURIComponent(hashRoom) : null);
        const pageParam = params.get("hs_page") ?? (hashPage ? decodeURIComponent(hashPage) : null);
        if (roomParam) { setLegacyPage(true); setSelectedRoomId(roomParam); setActivePage("rooms"); }
        else if (pageParam) { setLegacyPage(true); setSelectedRoomId(null); setActivePage(pageParam); }
      } catch { /* ignore malformed URLs */ }
    };
    applyDeepLink();
    window.addEventListener("HOMESMART-navigate", go);
    window.addEventListener("HOMESMART-open-room", goRoom);
    window.addEventListener("hashchange", applyDeepLink);
    return () => {
      window.removeEventListener("HOMESMART-navigate", go);
      window.removeEventListener("HOMESMART-open-room", goRoom);
      window.removeEventListener("hashchange", applyDeepLink);
    };
  }, []);
  const navigate = useCallback((page: HomeSmartPage) => {
    if (page === "rooms") {
      setSelectedRoomId((current) => current ?? visibleData?.rooms[0]?.id ?? null);
    } else {
      setSelectedRoomId(null);
    }
    setActivePage(page);
  }, [visibleData]);

  const activate = async (key: string) => {
    setLicense(await activateLicense(hass, key));
    setUpsellReason(null);
  };
  const downloadDraft = () => {
    const latest = draft ?? conflictDraft;
    if (!latest) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(latest, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "homesmart-conflict-draft.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const withPlan = (node: ReactNode) => <PlanContext.Provider value={plan}><CustomizeContext.Provider value={customize}>
    <Suspense fallback={<main className="screen center-state" role="status">{t("loadingShort")}</main>}>{node}</Suspense>
    {unlockPin && <PinPadModal expectedPin={unlockPin} onCancel={() => finishUnlock(false)} onSuccess={() => finishUnlock(true)} t={t} />}
    {(saveError || unlockFailed) && <div className="hd-operation-alert" role="alert">
      {saveError ? t(saveError) : t("unlockFailed")}
      {saveError === "configConflict" && (draft || conflictDraft) && <button className="hd-pill" onClick={downloadDraft} type="button">{t("conflictDownload")}</button>}
      {saveError
        ? <button className="hd-pill" onClick={() => { setSettingsOpen(false); setDraft(null); void load(); }} type="button">{t("refresh")}</button>
        : <button className="hd-pill" onClick={() => setUnlockFailed(false)} type="button">{t("close")}</button>}
    </div>}
    {upsellReason && <div className="app-shell app-shell--overlay" style={{ "--hd-accent": "#f4edd9" } as CSSProperties}><ProSheet hass={hass} language={language} license={license} onActivate={activate} onClose={() => setUpsellReason(null)} onLicense={setLicense} reason={upsellReason} t={t} /></div>}
  </CustomizeContext.Provider></PlanContext.Provider>;

  if (error) {
    return (
      <main className="screen center-state">
        <span className="center-state__icon"><HDIcon name="close" size={28} /></span>
        <h1>{t("appName")}</h1>
        <p>{t("errorDescription")}</p>
        <button className="primary-button" onClick={() => void load()} type="button"><HDIcon name="refresh" size={18} />{t("refresh")}</button>
      </main>
    );
  }

  if (!data || !config || !view || !visibleData) {
    return (
      <main className="screen center-state">
        <span className="loader-mark"><HDIcon name="home" size={26} /></span>
        <p>{t("loading")}</p>
        <div aria-hidden="true" className="hs-skeleton-grid">
          <div className="hs-skeleton hs-skeleton--wide" />
          <div className="hs-skeleton hs-skeleton--tall" />
          <div className="hs-skeleton" />
          <div className="hs-skeleton" />
          <div className="hs-skeleton" />
          <div className="hs-skeleton" />
        </div>
        <button
          className="secondary-button"
          style={{ marginTop: 20, opacity: 0.85 }}
          onClick={() => void load()}
          type="button"
        >
          <HDIcon name="refresh" size={16} /> {t("refresh")}
        </button>
      </main>
    );
  }

  if (!canEdit && !config.onboarding_complete) {
    return <main className="screen center-state"><p>{t("adminSetupRequired")}</p><button className="secondary-button" onClick={() => void load()} type="button">{t("refresh")}</button></main>;
  }

  if (!config.onboarding_complete) {
    return withPlan(<OnboardingScreen config={config} data={data} hass={hass} onComplete={async (next) => { await saveConfig(next); }} t={t} />);
  }

  // Free plan over its limits (after setup, an update or a removed license): pick what stays, or go Pro.
  if (!pro && overFreeLimits(config, data.rooms, limits)) {
    return withPlan(<DynamicShell config={view} data={visibleData} hass={hass}>
      <PlanGateScreen config={config} language={language} onSave={async (next) => { await saveConfig(next); }} rooms={data.rooms} t={t} />
    </DynamicShell>);
  }

  if (settingsOpen) {
    // The settings preview the real panel background, lit by the same lights as Home.
    const shellConfig = effectiveConfig(draft ?? config, pro);
    const previewRooms = panelRoomIds(draft ?? config, data.rooms, pro).map((id) => data.rooms.find((room) => room.id === id)).filter((room): room is DiscoveryResponse["rooms"][number] => Boolean(room));
    return withPlan(
      <DynamicShell config={shellConfig} data={draft ? { ...data, rooms: restrictRooms(previewRooms, allowed) } : visibleData} hass={hass}>
        <SettingsScreen
          config={config}
          hass={hass}
          language={language}
          layoutVersions={versions}
          onClose={() => { setSettingsOpen(false); setDraft(null); }}
          onDraft={setDraft}
          onLicense={setLicense}
          onReload={() => { setSettingsOpen(false); setDraft(null); void load(); }}
          onSave={async (next) => { await saveConfig(next); }}
          rooms={data.rooms}
          t={t}
          version={version}
        />
        <KeyBar active hass={hass} label={t("keyBar")} />
      </DynamicShell>,
    );
  }

  const screenProps: ScreenProps = {
    allRooms: restrictRooms(data.rooms, allowed),
    catalogRooms: data.rooms,
    config: view,
    data: visibleData,
    editing,
    hass,
    language,
    onConfig: (update) => void updateConfig(update),
    onLayout: (screen: string, layout: ScreenLayout) => void updateConfig((current) => withLayout(current, screen, pro ? layout : { ...layout, wide: current.layouts[screen]?.wide ?? [], tall: current.layouts[screen]?.tall ?? [] })),
    onSettings: () => { if (childOn) { childLockNote("hold"); return; } setEditing(false); setSettingsOpen(true); },
    onToggleEdit: () => { if (!locked) setEditing((current) => !current); },
    onNavigate: navigate,
    t,
  };

  if (profile !== "classic" && !legacyPage) {
    return withPlan(<AdaptiveDashboard
      {...screenProps}
      connection={connection}
      syncedAt={syncedAt}
      presenceDetected={wakeState === "on"}
      onReconnect={() => void load()}
      profile={profile}
      options={screenOptions(profile, view.screen_profiles)}
      onClassic={() => setScreenProfile(hass.user?.id, "classic")}
      onLegacyPage={(page) => { navigate(page); setLegacyPage(true); }}
    />);
  }

  const selectedRoom = activePage === "rooms" ? (visibleData.rooms.find((room) => room.id === selectedRoomId) ?? visibleData.rooms[0]) : undefined;
  const customPage = view.pages.find((page) => page.id === activePage);
  const { hasCameras, hasMedia, hasScenes, hasSecurity, hasVacuums } = availableSections(visibleData.rooms.flatMap((room) => room.entities));

  const openPageCreator = () => {
    if (!pro) { setUpsellReason("feature"); return; }
    setCreatingPage(true);
  };

  // Every screen follows the chosen layout: Home, rooms, Media, Security, Scenes and custom pages.
  const mode = view.view_mode;
  const pageRef: PageRef | null = selectedRoom ? null
    : activePage === "scenes" || activePage === "media" || activePage === "security" || activePage === "cameras" ? { kind: "collection", id: activePage }
    : customPage ? { kind: "custom", page: customPage } : null;
  const links: NavLink[] = orderTabs([
    ...(view.navigation.scenes && hasScenes ? [{ id: "scenes", label: t("scenes"), icon: "scene" as const }] : []),
    ...(view.navigation.media && hasMedia ? [{ id: "media", label: t("media"), icon: "media" as const }] : []),
    ...(view.navigation.security && hasSecurity ? [{ id: "security", label: t("security"), icon: "shield" as const }] : []),
    ...(view.navigation.cameras && hasCameras ? [{ id: "cameras", label: t("camerasTitle"), icon: "camera" as const }] : []),
    ...(view.navigation.system !== false ? [{ id: "system", label: t("systemMonitor"), icon: "monitor" as const }] : []),
    ...(hasVacuums && view.navigation.vacuum !== false ? [{ id: "vacuum", label: t("vacuumTabTitle"), icon: "vacuum" as const }] : []),
    ...(view.navigation.plan ? [{ id: "plan", label: planTitle(view, t), icon: "plan" as const }] : []),
    ...view.pages.map((page) => ({ id: page.id, label: page.title, icon: pageIcon(page) as NavLink["icon"] })),
  ], view.navigation.order);
  const openRoom = (roomId: string | null) => { setSelectedRoomId(roomId); setActivePage(roomId ? "rooms" : "home"); };

  // The floor plan (Pro) is its own screen in every layout; the Sidebar layout shows it beside its menu.
  const planOpen = activePage === "plan" && !selectedRoom && Boolean(view.navigation.plan);
  const systemOpen = activePage === "system" && !selectedRoom && view.navigation.system !== false;
  const vacuumOpen = activePage === "vacuum" && !selectedRoom && hasVacuums && view.navigation.vacuum !== false;
  let screen;
  if (mode === "photo") screen = <PhotoLayout {...screenProps} activePage={activePage} links={links} onAddPage={openPageCreator} onGo={(target, roomId) => { setSelectedRoomId(roomId ?? null); setActivePage(target); }} page={pageRef} plan={planOpen ? <FloorPlan {...screenProps} embedded onOpenRoom={openRoom} /> : systemOpen ? <SystemMonitorScreen {...screenProps} embedded /> : vacuumOpen ? <VacuumScreen {...screenProps} embedded /> : undefined} roomId={selectedRoomId} />;
  else if (mode === "sidebar") screen = <SidebarLayout {...screenProps} custom={planOpen ? <FloorPlan {...screenProps} embedded onOpenRoom={openRoom} /> : systemOpen ? <SystemMonitorScreen {...screenProps} embedded /> : vacuumOpen ? <VacuumScreen {...screenProps} embedded /> : undefined} customId={planOpen ? "plan" : systemOpen ? "system" : vacuumOpen ? "vacuum" : undefined} links={links} onAddPage={openPageCreator} onNavigate={navigate} onSelectRoom={openRoom} page={pageRef} roomId={selectedRoom?.id ?? null} />;
  else if (planOpen) screen = <FloorPlan {...screenProps} onOpenRoom={openRoom} />;
  else if (systemOpen) screen = <SystemMonitorScreen {...screenProps} />;
  else if (vacuumOpen) screen = <VacuumScreen {...screenProps} />;
  else if (mode === "list") screen = <ListLayout {...screenProps} onSelectRoom={(roomId) => openRoom(roomId)} page={pageRef} roomId={selectedRoom?.id ?? null} />;
  else if (mode === "focus") screen = <FocusLayout {...screenProps} onRoomChange={(roomId) => { setSelectedRoomId(roomId); setActivePage(roomId ? "rooms" : "home"); }} page={pageRef} roomId={selectedRoom?.id ?? null} />;
  else if (selectedRoom) screen = <RoomScreen {...screenProps} onSelectRoom={setSelectedRoomId} room={selectedRoom} />;
  else if (pageRef) screen = <PageScreen key={pageId(pageRef)} {...screenProps} page={pageRef} />;
  else screen = <HomeScreen {...screenProps} onOpenRoom={(roomId) => { setSelectedRoomId(roomId); setActivePage("rooms"); }} />;

  const active = selectedRoom ? "rooms" : customPage || ["scenes", "media", "security", "cameras", "plan", "system", "vacuum"].includes(activePage) ? activePage : "home";

  // A new page fades in (transitions on): the key changes with the page, not with the room inside it, which
  // animates its own content; the Sidebar layout animates its right side itself.
  const pageKey = mode === "sidebar" || mode === "photo" ? mode : selectedRoom ? "rooms" : activePage;
  return withPlan(
    <DynamicShell config={view} data={visibleData} hass={hass} mode={mode} season={season}>
      {profile !== "classic" && <button className="hd-pill hs-return-adaptive" onClick={() => setLegacyPage(false)} type="button">{t("adaptiveReturn")}</button>}
      <div className="hs-screen-wrapper" key={pageKey}>{screen}</div>
      {mode !== "sidebar" && mode !== "photo" && <NavigationDock active={active} config={view} editing={editing} hasMedia={hasMedia} hasScenes={hasScenes} hasSecurity={hasSecurity} hasCameras={hasCameras} hasVacuums={hasVacuums} onAddPage={openPageCreator} onNavigate={navigate} onOrder={(order) => void updateConfig((current) => ({ ...current, navigation: { ...current.navigation, order } }))} t={t} />}
      {!locked && <button aria-label={editing ? t("doneEditing") : t("editScreen")} aria-pressed={editing} className={editing ? "edit-fab edit-fab--on" : "edit-fab"} onClick={() => setEditing((current) => !current)} type="button">
        <HDIcon name={editing ? "check" : "pencil"} size={20} />
      </button>}
      <KeyBar active hass={hass} label={t("keyBar")} />
      <span hidden ref={probe} />
      {lockNote && <div className="hd-lock-note" role="status"><HDIcon name="lock" size={16} />{lockNote === "blocked" ? t("childLockBlocked") : childOn ? t("childLockHoldOff") : t("childLockHoldOn")}</div>}
      {saverOn && <Screensaver config={view} hass={hass} language={language} onDismiss={dismissSaver} rooms={data?.rooms} t={t} />}
      {ringing && <DoorbellPopup camera={view.doorbell.camera} config={view.doorbell} hass={hass} onClose={stopRinging} seconds={view.doorbell.seconds} t={t} />}
      {creatingPage && (
        <PageCreatorModal
          catalogRooms={data.rooms}
          config={view}
          hass={hass}
          language={language}
          onClose={() => setCreatingPage(false)}
          onCreate={({ page, layout }) => {
            void updateConfig((current) => ({
              ...current,
              pages: [...current.pages, page],
              ...(layout ? { layouts: { ...current.layouts, [pageScreen(page.id)]: layout } } : {}),
            }));
            setCreatingPage(false);
            setSelectedRoomId(null);
            setActivePage(page.id);
          }}
          t={t}
        />
      )}
    </DynamicShell>,
  );
}

/** The screen chosen to open on, when it still exists and is on; Home otherwise. */
function startScreen(view: HomeSmartConfig | null, pro: boolean): HomeSmartPage {
  const start = view?.navigation.start;
  if (!view || !start || start === "home") return "home";
  const nav = view.navigation;
  const tabs: Record<string, boolean> = { rooms: nav.rooms, scenes: nav.scenes, media: nav.media, security: nav.security, cameras: Boolean(nav.cameras), system: nav.system !== false, vacuum: nav.vacuum !== false, plan: Boolean(nav.plan) && pro };
  if (start in tabs) return tabs[start] ? start as HomeSmartPage : "home";
  return view.pages.some((page) => page.id === start) ? start as HomeSmartPage : "home";
}
