import type { TranslationKey } from "../i18n";
import type { HomeSmartConfig } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HassEntity, HomeAssistant } from "../types/home-assistant";
import { useTallTile, useWideTile } from "./EditableGrid";
import { HDIcon } from "./HDIcon";

// Recently added (Pro): the newest movies and episodes of a media library, as covers. Read from the
// sensors of the "recently added" integrations (Plex Recently Added, Jellyfin, Sonarr, Radarr...),
// which all keep a list in a `data` attribute: a first item with defaults, then one item per title.

export interface RecentItem { key: string; title: string; detail: string; poster: string; added: string; source: string }

/** A sensor that holds such a list. */
export function isRecentMediaSensor(state?: HassEntity): boolean {
  const data = state?.attributes.data;
  if (Array.isArray(data)) return data.length > 0 && typeof data[0] === "object";
  return typeof data === "string" && data.trimStart().startsWith("[");
}

function itemsOf(state: HassEntity | undefined): RecentItem[] {
  if (!state) return [];
  let data: unknown = state.attributes.data;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch { return []; } }
  if (!Array.isArray(data)) return [];
  return data.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    // The first item only carries the defaults of the card these sensors were made for.
    if ("title_default" in item || typeof item.title !== "string" || !item.title) return [];
    const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : "");
    const episode = text(item.episode);
    const number = text(item.number);
    const year = text(item.release).replace(/^\$day,?\s*/, "").slice(0, 4);
    return [{
      key: `${state.entity_id}:${index}`,
      title: item.title,
      detail: episode ? [number, episode].filter(Boolean).join(" · ") : /^\d{4}$/.test(year) ? year : number,
      poster: text(item.poster) || text(item.fanart),
      added: text(item.airdate),
      source: state.entity_id,
    }];
  });
}

/** Every chosen sensor's titles, newest first when they say when they were added. */
export function recentItems(hass: HomeAssistant, ids: string[]): RecentItem[] {
  const all = ids.flatMap((id) => itemsOf(hass.states[id]));
  return all.some((item) => item.added) ? [...all].sort((a, b) => b.added.localeCompare(a.added)) : all;
}

/** The covers in a row (two rows on a large card), as many as fit; a tap opens the sensor's details. */
export function RecentMediaCard({ config, hass, onOpen, t }: { config: HomeSmartConfig; hass: HomeAssistant; onOpen: (entity: DiscoveredEntity) => void; t: (key: TranslationKey) => string }) {
  const wide = useWideTile();
  const tall = useTallTile();
  const items = recentItems(hass, config.recent_media ?? []).slice(0, tall ? 16 : wide ? 8 : 3);
  const open = (id: string) => {
    const state = hass.states[id];
    if (state) onOpen({ entity_id: id, domain: id.split(".")[0], name: String(state.attributes.friendly_name ?? id), area_id: "", device_id: null, device_class: null, icon: null });
  };
  return <div className={`widget-card hd-recent${wide ? " hd-recent--wide" : ""}${tall ? " hd-recent--tall" : ""}`}>
    <span className="widget-card__icon"><HDIcon name="play" size={18} /></span>
    <span className="widget-card__label">{t("recentMedia")}</span>
    {items.length === 0
      ? <p className="hd-recent__empty">{t("recentMediaEmpty")}</p>
      : <div className="hd-recent__row">{items.map((item) => <button aria-label={`${item.title}${item.detail ? `, ${item.detail}` : ""}`} className="hd-recent__item" key={item.key} onClick={() => open(item.source)} type="button">
          <span className="hd-recent__poster"><HDIcon name="play" size={22} />{item.poster && <img alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} src={item.poster} />}</span>
          <b>{item.title}</b>
          {item.detail && <small>{item.detail}</small>}
        </button>)}</div>}
  </div>;
}
