import { useEffect, useRef } from "react";

export interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  maxVerticalRatio?: number;
  disabled?: boolean;
}

/**
 * High-performance, passive touch swipe gesture hook for smooth navigation.
 * Specifically rejects gestures originating from interactive controls (sliders, buttons, scroll strips)
 * and enforces horizontal dominance to preserve native vertical page scrolling.
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
  targetRef: React.RefObject<T | null>,
  options: SwipeOptions
): void {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isIgnored = useRef(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || options.disabled) return;

    const threshold = options.threshold ?? 50;
    const maxVerticalRatio = options.maxVerticalRatio ?? 0.65;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStart.current = null;
        return;
      }
      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;

      // Do not trigger swipe when interacting with sliders, buttons, pickers, or horizontally scrollable strips
      if (
        target?.closest(
          'input, button, select, textarea, [role="slider"], [role="button"], .no-swipe, .room-selector__list, .category-chips, .scene-strip, .hd-cal__body, .device-dimmer'
        )
      ) {
        isIgnored.current = true;
        touchStart.current = null;
        return;
      }

      isIgnored.current = false;
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isIgnored.current || !touchStart.current) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;
      touchStart.current = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Verify horizontal gesture: enough distance, low vertical drift, and reasonable duration
      if (absX >= threshold && absY / Math.max(1, absX) <= maxVerticalRatio && dt < 800) {
        if (dx < 0 && options.onSwipeLeft) {
          options.onSwipeLeft();
        } else if (dx > 0 && options.onSwipeRight) {
          options.onSwipeRight();
        }
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [targetRef, options.disabled, options.threshold, options.maxVerticalRatio, options.onSwipeLeft, options.onSwipeRight]);
}
