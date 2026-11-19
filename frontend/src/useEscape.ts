import { useEffect, useRef } from "react";

/** Escape closes a window, like a tap outside it. */
export function useEscape(onClose: () => void, active = true): void {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") close.current(); };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [active]);
}
