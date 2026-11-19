import { useEffect, useState } from "react";

// Windows (details, pickers, forecast) cover the screen with position: fixed. Inside some Home Assistant
// apps a parent of the panel is transformed and scrolls on its own; "fixed" then follows that parent and a
// window opens at the end of the page, out of reach. Each window is checked when it opens (and while the
// page scrolls or resizes) and, if it isn't on the visible screen, moved there.

const OVERLAYS = ".hd-sheet-backdrop, .weather-modal, .hdx-select__backdrop";

function fit(element: HTMLElement): void {
  element.style.removeProperty("top");
  element.style.removeProperty("height");
  element.style.removeProperty("bottom");
  const box = element.getBoundingClientRect();
  const visible = window.visualViewport?.height ?? window.innerHeight;
  if (Math.abs(box.top) <= 1 && Math.abs(box.height - visible) <= 2) return;
  const top = Number.parseFloat(getComputedStyle(element).top) || 0;
  element.style.top = `${top - box.top}px`;
  element.style.bottom = "auto";
  element.style.height = `${visible}px`;
}

export function useOverlayFit(): (node: HTMLElement | null) => void {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!node) return;
    let frame = 0;
    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => node.querySelectorAll<HTMLElement>(OVERLAYS).forEach(fit));
    };
    const observer = new MutationObserver((records) => { if (records.some((record) => record.addedNodes.length > 0)) scan(); });
    observer.observe(node, { childList: true, subtree: true });
    window.addEventListener("resize", scan);
    window.visualViewport?.addEventListener("resize", scan);
    document.addEventListener("scroll", scan, true);
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", scan); window.visualViewport?.removeEventListener("resize", scan); document.removeEventListener("scroll", scan, true); };
  }, [node]);
  return setNode;
}
