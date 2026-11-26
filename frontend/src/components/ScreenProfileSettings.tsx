import { useEffect, useState } from "react";
import type { TranslationKey } from "../i18n";
import { DASHBOARD_TABS, SCREEN_PROFILES, screenOptions, setScreenProfile, useScreenProfile, type AdaptiveProfile, type ScreenOptions, type ScreenProfile, type ScreenProfiles } from "../screenProfiles";
import type { HomeAssistant } from "../types/home-assistant";

const labels: Record<ScreenProfile, TranslationKey> = {
  classic: "adaptiveClassic", auto: "automatic", phone: "profilePhone",
  wall: "profileWall", desktop: "profileDesktop", tv: "profileTv",
};

interface Props {
  hass: HomeAssistant;
  shared?: ScreenProfiles;
  onChange?: (value: ScreenProfiles) => void;
  t: (key: TranslationKey) => string;
}

export function ScreenProfileSettings({ hass, shared, onChange, t }: Props) {
  const local = useScreenProfile(hass.user?.id);
  const [kind, setKind] = useState<AdaptiveProfile>("phone");
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const effective = shared ?? { default: "classic", users: {}, options: {} };
  const options = screenOptions(kind, effective);
  const selectOptions = SCREEN_PROFILES.map((value) => <option key={value} value={value}>{t(labels[value])}</option>);
  const tabName = (tab: typeof DASHBOARD_TABS[number]) => t(tab === "rooms" ? "roomsPage" : tab === "more" ? "adaptiveMore" : tab);
  useEffect(() => {
    if (!onChange) return;
    let mounted = true;
    void hass.connection.sendMessagePromise<Array<{ id: string; name: string; system_generated?: boolean }> | { users: Array<{ id: string; name: string; system_generated?: boolean }> }>({ type: "config/auth/list" })
      .then((reply) => { if (mounted) setUsers((Array.isArray(reply) ? reply : reply.users ?? []).filter((user) => !user.system_generated)); })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [hass.connection, Boolean(onChange)]);
  const updateOptions = (patch: Partial<ScreenOptions>) => onChange?.({ ...effective, options: { ...effective.options, [kind]: { ...options, ...patch } } });

  return <div className="st-group hs-profile-settings">
    <label className="st-sub__row"><span>{t("profileThisScreen")}</span><select value={local} onChange={(event) => setScreenProfile(hass.user?.id, event.target.value as ScreenProfile | "")}><option value="">{t("profileInherit")}</option>{selectOptions}</select></label>
    {onChange && <>
      <label className="st-sub__row"><span>{t("profileHouse")}</span><select value={effective.default} onChange={(event) => onChange({ ...effective, default: event.target.value as ScreenProfile })}>{selectOptions}</select></label>
      {(users.length ? users : hass.user ? [{ id: hass.user.id, name: hass.user.name ?? t("profileAccount") }] : []).map((user) => (
        <label className="st-sub__row" key={user.id}><span>{t("profileAccount")} · {user.name}</span><select value={effective.users[user.id] ?? ""} onChange={(event) => {
          const current = { ...effective.users };
          if (event.target.value) current[user.id] = event.target.value as ScreenProfile; else delete current[user.id];
          onChange({ ...effective, users: current });
        }}><option value="">{t("profileInherit")}</option>{selectOptions}</select></label>
      ))}
      <label className="st-sub__row"><span>{t("profileConfigure")}</span><select value={kind} onChange={(event) => setKind(event.target.value as AdaptiveProfile)}>{SCREEN_PROFILES.slice(2).map((value) => <option key={value} value={value}>{t(labels[value])}</option>)}</select></label>
      <fieldset>
        <legend>{t("navigation")}</legend>
        {DASHBOARD_TABS.map((tab) => <label key={tab}><input checked={options.tabs.includes(tab)} disabled={tab === "home"} onChange={(event) => {
          const tabs = event.target.checked ? DASHBOARD_TABS.filter((choice) => choice === tab || options.tabs.includes(choice)) : options.tabs.filter((choice) => choice !== tab);
          updateOptions({ tabs, start: tabs.includes(options.start) ? options.start : "home" });
        }} type="checkbox" /> {tabName(tab)}</label>)}
      </fieldset>
      <label className="st-sub__row"><span>{t("profileStart")}</span><select value={options.start} onChange={(event) => updateOptions({ start: event.target.value as ScreenOptions["start"] })}>{options.tabs.map((tab) => <option value={tab} key={tab}>{tabName(tab)}</option>)}</select></label>
      <label className="st-sub__row"><span>{t("profileCompact")}</span><input checked={options.density === "compact"} onChange={(event) => updateOptions({ density: event.target.checked ? "compact" : "comfortable" })} type="checkbox" /></label>
      {(kind === "wall" || kind === "tv") && <>
        <label className="st-sub__row"><span>{t("profileIdle")}</span><input type="number" min={0} max={3600} value={options.idle} onChange={(event) => updateOptions({ idle: Math.max(0, Math.min(3600, Math.round(Number(event.target.value)))) })} /></label>
        <label className="st-sub__row"><span>{t("profileQuietStart")}</span><input type="number" min={0} max={23} value={options.quiet_start} onChange={(event) => updateOptions({ quiet_start: Math.max(0, Math.min(23, Math.round(Number(event.target.value)))) })} /></label>
        <label className="st-sub__row"><span>{t("profileQuietEnd")}</span><input type="number" min={0} max={23} value={options.quiet_end} onChange={(event) => updateOptions({ quiet_end: Math.max(0, Math.min(23, Math.round(Number(event.target.value)))) })} /></label>
      </>}
    </>}
  </div>;
}
