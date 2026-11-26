import { useState } from "react";
import type { TranslationKey } from "../i18n";
import type { LayoutState, LayoutVersion } from "../layoutHistory";

export function LayoutHistoryPanel({ versions, current, onRestore, onMove, t }: {
  versions: LayoutVersion[];
  current: LayoutState;
  onMove: (ids: string[]) => void;
  onRestore: (state: LayoutState) => Promise<void>;
  t: (key: TranslationKey) => string;
}) {
  const [selected, setSelected] = useState<number>();
  const [width, setWidth] = useState("phone");
  const [restoring, setRestoring] = useState(false);
  const [failed, setFailed] = useState(false);
  const version = versions.find((item) => item.id === selected);
  const layout = version?.state ?? current;
  const pageIds = [layout.navigation.start || "home", ...layout.pages.map((page) => page.id)];
  const tiles = [...new Set(pageIds)];
  const custom = layout.pages.map((page) => page.id);
  const order = [...(layout.navigation.order ?? []).filter((id) => custom.includes(id)), ...custom.filter((id) => !layout.navigation.order?.includes(id))];
  const move = (from: number, direction: number) => {
    const next = [...order];
    [next[from], next[from + direction]] = [next[from + direction], next[from]];
    onMove(next);
  };
  const restore = async () => {
    if (!version || restoring) return;
    setRestoring(true);
    setFailed(false);
    try { await onRestore(version.state); setSelected(undefined); }
    catch { setFailed(true); }
    finally { setRestoring(false); }
  };

  return <section className="st-panel">
    <h2>{t("layoutHistoryTitle")}</h2><p>{t("layoutHistoryDescription")}</p>
    <label className="st-sub__row">{t("layoutHistoryVersion")} <select value={version?.id ?? ""} onChange={(event) => setSelected(event.target.value ? Number(event.target.value) : undefined)}><option value="">{t("layoutHistoryCurrent")}</option>{versions.map((item) => <option key={item.id} value={item.id}>{new Date(item.id).toLocaleString()} · {item.state.pages.length} {t("layoutHistoryTabs")}</option>)}</select></label>
    <label className="st-sub__row">{t("layoutHistoryPreview")} <select value={width} onChange={(event) => setWidth(event.target.value)}>
      <option value="phone">{t("profilePhone")}</option><option value="wall">{t("profileWall")}</option><option value="desktop">{t("profileDesktop")}</option><option value="tv">{t("profileTv")}</option>
    </select></label>
    <div className={`hs-layout-preview hs-layout-preview--${width}`} aria-label={t("layoutHistoryPreview")}>
      {tiles.map((id) => { const page = layout.pages.find((item) => item.id === id); return <article key={id}><b>{page?.title ?? (id === "home" ? t("home") : id)}</b>{page && <span>{page.entity_ids.length + (page.widgets?.length ?? 0)} {t("layoutHistoryCards")}</span>}</article>; })}
    </div>
    {!version && order.length > 1 && <ol>{order.map((id, from) => <li key={id}>
      <span>{layout.pages.find((page) => page.id === id)?.title}</span>
      <button className="hd-pill" aria-label={t("layoutMoveEarlier")} disabled={from === 0} onClick={() => move(from, -1)} type="button">↑</button>
      <button className="hd-pill" aria-label={t("layoutMoveLater")} disabled={from === order.length - 1} onClick={() => move(from, 1)} type="button">↓</button>
    </li>)}</ol>}
    {failed && <p role="alert">{t("settingsNotSaved")}</p>}
    {version && <button className="hd-pill" disabled={restoring} onClick={() => { if (window.confirm(t("layoutHistoryConfirm"))) void restore(); }} type="button">{t("layoutHistoryRestore")}</button>}
  </section>;
}
