import { hourOptions } from "../clock";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { safeIntlLocale, type TranslationKey } from "../i18n";
import { useCustomize } from "../personalize";
import type { HomeAssistant } from "../types/home-assistant";
import { HDIcon } from "./HDIcon";

/** One of Home Assistant's own notifications (the bell in its sidebar). */
export interface HaNotification { notification_id: string; title?: string | null; message: string; created_at: string }

interface NotificationEvent { type: "current" | "added" | "updated" | "removed"; notifications: Record<string, HaNotification> }

/** Home Assistant's notifications, kept up to date through its websocket (persistent_notification/subscribe). */
export function useHaNotifications(hass: HomeAssistant, enabled: boolean): HaNotification[] {
  const [items, setItems] = useState<Record<string, HaNotification>>({});
  const connection = hass.connection;
  useEffect(() => {
    if (!enabled || !connection.subscribeMessage) { setItems({}); return; }
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void connection.subscribeMessage<NotificationEvent>((event) => {
      setItems((current) => {
        if (event.type === "current") return { ...event.notifications };
        const next = { ...current };
        for (const [id, item] of Object.entries(event.notifications ?? {})) {
          if (event.type === "removed") delete next[id];
          else next[id] = item;
        }
        return next;
      });
    }, { type: "persistent_notification/subscribe" })
      .then((stop) => { if (cancelled) stop(); else unsubscribe = stop; })
      .catch(() => undefined);
    return () => { cancelled = true; unsubscribe?.(); };
  }, [enabled, connection]);
  return Object.values(items).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Home Assistant renders its messages as Markdown; its own element does that when it is on the page. */
function Message({ text }: { text: string }) {
  const ref = useRef<HTMLElement & { content?: string }>(null);
  const markdown = typeof customElements !== "undefined" && Boolean(customElements.get("ha-markdown"));
  useEffect(() => { if (ref.current) ref.current.content = text; }, [text, markdown]);
  if (markdown) return <ha-markdown class="hd-notes__text" ref={ref} />;
  // Without it: the text with the most common Markdown marks taken out (bold, links, headings).
  const plain = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/(\*\*|__|`)/g, "").replace(/^#{1,6}\s+/gm, "");
  return <p className="hd-notes__text hd-notes__text--plain">{plain}</p>;
}

/** The bell beside the header buttons: a dot with the count when Home Assistant has notifications;
 * a tap lists them, each one can be dismissed (in Home Assistant too), or all at once. */
export function NotificationBell({ hass, language, shell, t }: { hass: HomeAssistant; language?: string; shell: Element | null; t: (key: TranslationKey) => string }) {
  const notes = useHaNotifications(hass, true);
  const customize = useCustomize();
  const [open, setOpen] = useState(false);
  const rooms = customize?.rooms() ?? [];
  const matchRoom = (note: HaNotification) => {
    const hay = `${note.title ?? ""} ${note.message}`.toLowerCase();
    return rooms.find((room) => room.id !== "__unassigned__" && hay.includes(room.name.toLowerCase()));
  };
  const dismiss = (ids: string[]) => { for (const id of ids) void hass.callService("persistent_notification", "dismiss", { notification_id: id }).catch(() => undefined); };
  const when = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(+date)) return "";
    const today = new Date().toDateString() === date.toDateString();
    const loc = safeIntlLocale(language);
    return new Intl.DateTimeFormat(loc, today ? { ...hourOptions(), hour: "2-digit", minute: "2-digit" } : { ...hourOptions(), day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  };
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return <>
    <button aria-label={notes.length > 0 ? `${t("haNotifications")}: ${notes.length}` : t("haNotifications")} className={`round-action hd-bell${notes.length > 0 ? " hd-bell--on" : ""}`} onClick={() => setOpen(true)} type="button">
      <HDIcon name="bell" size={19} />
      {notes.length > 0 && <i className="hd-bell__dot">{notes.length > 9 ? "9+" : notes.length}</i>}
    </button>
    {open && shell && createPortal(<div aria-label={t("haNotifications")} aria-modal="true" className="hd-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} role="dialog">
      <section className="hd-sheet hd-notes">
        <header className="hd-sheet__header">
          <div><span className="eyebrow">Home Assistant</span><h2>{t("haNotifications")}</h2></div>
          <button className="hd-sheet__close" onClick={() => setOpen(false)} type="button">{t("close")}</button>
        </header>
        {notes.length === 0
          ? <p className="hd-notes__empty">{t("haNotificationsNone")}</p>
          : <>
              <div className="hd-notes__list">
                {notes.map((note) => {
                  const matchedRoom = matchRoom(note);
                  return (
                    <article className="hd-notes__item" key={note.notification_id}>
                      <div className="hd-notes__head"><b>{note.title || t("haNotification")}</b><small>{when(note.created_at)}</small></div>
                      <Message text={note.message} />
                      <div className="hs-note-context">
                        {matchedRoom && (
                          <button
                            className="hs-note-badge"
                            onClick={() => {
                              setOpen(false);
                              window.dispatchEvent(new CustomEvent("HOMESMART-open-room", { detail: matchedRoom.id }));
                            }}
                            type="button"
                          >
                            <HDIcon name="arrow" size={11} />
                            {t("haNotificationJump")}: {matchedRoom.name}
                          </button>
                        )}
                        <button className="hd-pill" onClick={() => dismiss([note.notification_id])} type="button"><HDIcon name="check" size={14} />{t("haNotificationDismiss")}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {notes.length > 1 && <button className="hd-pill hd-notes__all" onClick={() => dismiss(notes.map((note) => note.notification_id))} type="button">{t("haNotificationDismissAll")}</button>}
            </>}
      </section>
    </div>, shell)}
  </>;
}
