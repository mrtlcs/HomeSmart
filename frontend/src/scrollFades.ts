import { useEffect, useState } from "react";

// Rows that scroll sideways (the tab bar, the room list on phones, scene strips, chips...) fade at the edge
// that has more to show, so it is clear there is more to swipe. Each such row gets data-fade="left",
// "right" or "both" while it is scrolled; the CSS draws the fade.

const SCROLLERS = ".navigation-dock, .room-selector__list, .scene-strip, .sb-nav, .ls-strip, .tile-chips, .hd-forecast__hours, .hd-picker__kinds, .settings-nav, .forecast-strip, .page-builder > aside";

function mark(element: HTMLElement): void {
  const room = element.scrollWidth - element.clientWidth;
  const left = room > 2 && element.scrollLeft > 2;
  const right = room > 2 && element.scrollLeft < room - 2;
  const fade = left && right ? "both" : left ? "left" : right ? "right" : "";
  if ((element.dataset.fade ?? "") === fade) return;
  if (fade) element.dataset.fade = fade;
  else delete element.dataset.fade;
}

/** Give it to the shell's ref: every sideways row inside (windows drawn there included) keeps its fades. */
export function useScrollFades(): (node: HTMLElement | null) => void {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!node) return;
    let frame = 0;
    let later = 0;
    const markAll = () => node.querySelectorAll<HTMLElement>(SCROLLERS).forEach(mark);
    // Once on the next frame, and again a moment later, when rows that animate in have their final width.
    const scan = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
      frame = window.requestAnimationFrame(markAll);
      later = window.setTimeout(markAll, 350);
    };
    // Scroll events don't bubble, but an ancestor still sees them while capturing.
    const scrolled = (event: Event) => { const target = event.target; if (target instanceof HTMLElement && target.matches(SCROLLERS)) mark(target); };
    node.addEventListener("scroll", scrolled, true);
    const observer = new MutationObserver(scan);
    observer.observe(node, { childList: true, subtree: true });
    window.addEventListener("resize", scan);
    scan();
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(later); node.removeEventListener("scroll", scrolled, true); observer.disconnect(); window.removeEventListener("resize", scan); };
  }, [node]);
  return setNode;
}
