import { useEffect, useState } from "react";
import type { TranslationKey } from "../i18n";
import type { HomeAssistant } from "../types/home-assistant";
import { HDIcon } from "./HDIcon";

const RELEASES_URL = "https://github.com/mrtlcs/HomeSmart/releases";

interface ReleaseItem {
  tag_name: string;
  name: string;
  published_at: string;
}

export function VersionModal({ currentVersion, hass, onClose, t }: {
  currentVersion?: string;
  hass: HomeAssistant;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [releases, setReleases] = useState<ReleaseItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const current = currentVersion?.replace(/^v/, "");

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    void hass.connection.sendMessagePromise<{ releases: ReleaseItem[] }>({ type: "homesmart/releases/list" })
      .then(({ releases }) => { if (!cancelled) setReleases(releases); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [hass.connection]);

  return <div aria-labelledby="hd-version-title" aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
    <section className="hd-sheet hd-version-sheet" style={{ maxWidth: 640 }}>
      <header className="hd-pro__header">
        <span className="hd-pro__mark"><HDIcon name="refresh" size={22} /></span>
        <h2 id="hd-version-title">{t("versionManage")}</h2>
        <button aria-label={t("close")} className="hd-close" onClick={onClose} type="button"><HDIcon name="close" size={20} /></button>
      </header>
      {current && <p>{t("versionInstalled")} <strong>v{current}</strong></p>}
      {failed && <p role="status">{t("versionFetchError")}</p>}
      {!failed && !releases && <p role="status">{t("loadingShort")}</p>}
      {releases && <ul className="widget-list">
        {releases.map((release) => {
          const active = release.tag_name.replace(/^v/, "") === current;
          const url = `${RELEASES_URL}/tag/${encodeURIComponent(release.tag_name)}`;
          return <li key={release.tag_name}>
            <a href={url} rel="noopener noreferrer" target="_blank">{release.name || release.tag_name}</a>
            <small>{active ? t("versionCurrent") : release.published_at.slice(0, 10)}</small>
          </li>;
        })}
      </ul>}
      <p>{t("versionUpdateViaHacs")}</p>
      <a className="hd-pill hd-pill--primary" href={RELEASES_URL} rel="noopener noreferrer" target="_blank">{t("versionGithubReleases")}</a>
    </section>
  </div>;
}
