// HomeSmart v2.0 visual system: Liquid Glass 2.0, Bento Grid spans, physics motion, skeleton loaders,
// AI Insights styling, Room Theme swatches, Rich Notification cards, and Thermal Floorplan layers.

export const themeV2 = String.raw`
/* ─── Liquid Glass 2.0 (Spatial Glassmorphism & Edge Reflections) ─── */
.app-shell[data-glass-depth="subtle"] {
  --hd-g2-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  --hd-g2-edge: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}
.app-shell[data-glass-depth="standard"] {
  --hd-g2-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  --hd-g2-edge: inset 1px 1px 0 rgba(255, 255, 255, 0.24), inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}
.app-shell[data-glass-depth="intense"] {
  --hd-g2-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
  --hd-g2-edge: inset 1px 1px 0 rgba(255, 255, 255, 0.36), inset 0 -1px 0 rgba(255, 255, 255, 0.1);
}

.app-shell[data-glass-depth]:not([data-glass-depth="subtle"]) :where(.room-card, .device-tile, .widget-card, .hs-room-summary, .hs-insights-card, .hs-energy-flow) {
  box-shadow: var(--hd-g2-edge), var(--hd-g2-shadow);
  transition:
    transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background 280ms ease,
    border-color 260ms ease,
    box-shadow 260ms ease,
    color 240ms ease;
}

.app-shell[data-glass-depth] .room-card:hover,
.app-shell[data-glass-depth] .device-tile--interactive:hover,
.app-shell[data-glass-depth] .widget-card--interactive:hover {
  transform: translateY(-2px);
}

/* ─── Physics Motion & Smooth Active State Crossfade ─── */
.app-shell.hd-motion :where(.device-tile, .room-card, .widget-card, .hs-room-summary, .hd-pill, button) {
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 260ms ease,
    border-color 240ms ease,
    box-shadow 240ms ease,
    opacity 200ms ease;
}
.app-shell :where(.device-tile, .room-card, .widget-card, .hs-room-summary):active:not(:disabled) {
  transform: scale(0.968);
}

/* ─── Skeleton Loading Placeholders (Zero-layout-shift startup) ─── */
@keyframes hs-shimmer {
  0% { background-position: -220% 0; }
  100% { background-position: 220% 0; }
}
.hs-skeleton-grid {
  width: 100%;
  max-width: 1120px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
  margin-top: 24px;
}
.hs-skeleton {
  height: 112px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.13) 45%,
    rgba(255, 255, 255, 0.05) 65%
  );
  background-size: 220% 100%;
  animation: hs-shimmer 1.6s ease-in-out infinite;
}
.hs-skeleton--wide {
  grid-column: span 2;
}
.hs-skeleton--tall {
  grid-row: span 2;
  height: 238px;
}
@media (max-width: 600px) {
  .hs-skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .hs-skeleton--tall {
    height: 180px;
  }
}

/* ─── Bento Grid Asymmetric Spans ─── */
.app-shell .hd-grid .hd-item--bento-1x2 {
  grid-column: span 1;
  grid-row: span 2;
}
.app-shell .hd-grid .hd-item--bento-1x2 > :first-child {
  height: 100%;
}
.app-shell .hd-grid .hd-item--bento-3x1 {
  grid-column: span 3;
}
.app-shell .hd-grid .hd-item--bento-3x1 > :first-child {
  height: 100%;
}
@media (max-width: 960px) {
  .app-shell .hd-grid .hd-item--bento-3x1 {
    grid-column: 1 / -1;
  }
}
@media (max-width: 720px) {
  .app-shell .hd-grid .hd-item--bento-1x2 {
    grid-column: span 1;
    grid-row: span 2;
  }
  .app-shell .hd-grid .hd-item--bento-3x1 {
    grid-column: 1 / -1;
  }
}

/* ─── Room Swatch Theme Tints ─── */
.app-shell .room-card[data-room-accent],
.app-shell .hs-room-summary[data-room-accent] {
  border-color: color-mix(in srgb, var(--room-theme, #60a5fa) 42%, rgba(255, 255, 255, 0.2));
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--room-theme, #60a5fa) 18%, transparent),
    var(--glass, rgba(255, 255, 255, 0.14))
  );
}
.app-shell .room-card--active[data-room-accent],
.app-shell .hs-room-summary--active[data-room-accent] {
  border-color: color-mix(in srgb, var(--room-theme, #60a5fa) 65%, transparent);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--room-theme, #60a5fa) 22%, transparent);
}
.app-shell .room-pane[data-room-accent] .room-operational-header {
  padding-bottom: calc(var(--u) * 1.4);
  border-bottom: 1px solid color-mix(in srgb, var(--room-theme, #60a5fa) 32%, rgba(255, 255, 255, 0.12));
}
.app-shell .hs-room-swatches {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* ─── AI Insights Card ─── */
.hs-insights-card {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: calc(var(--u, 8px) * 1.8) calc(var(--u, 8px) * 2);
  border-radius: calc(var(--u, 8px) * 3 * var(--hd-r, 1));
  background: var(--glass, rgba(255, 255, 255, 0.14));
  border: 1px solid var(--hd-frame, var(--line, rgba(255, 255, 255, 0.2)));
  backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--hd-blur, 22px)) saturate(1.3);
  display: flex;
  flex-direction: column;
  gap: calc(var(--u, 8px) * 1.1);
  color: var(--ink, #ffffff);
}
.hs-insights-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.hs-insights-card__title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: 700 calc(var(--u, 8px) * 1.55) / 1.2 var(--f-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-2, rgba(255, 255, 255, 0.78));
}
.hs-insights-card__count {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.35);
}
.hs-insights-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hs-insight-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: calc(var(--u, 8px) * 1.8 * var(--hd-r, 1));
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.hs-insight-row--warn {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.34);
}
.hs-insight-row--alert {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.35);
}
.hs-insight-row__icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
  background: rgba(255, 255, 255, 0.12);
}
.hs-insight-row__copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hs-insight-row__copy strong {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-insight-row__copy small {
  font-size: 11.5px;
  color: var(--ink-2, rgba(255, 255, 255, 0.72));
}
.hs-insight-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.hs-insight-row__btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}
.hs-insight-row__btn:hover {
  background: rgba(255, 255, 255, 0.24);
}
.hs-insight-row__dismiss {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: var(--ink-3, rgba(255, 255, 255, 0.52));
  display: grid;
  place-items: center;
  cursor: pointer;
}
.hs-insight-row__dismiss:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--ink);
}
.hs-insights-calm {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 2px 2px;
  font-size: 13px;
  color: var(--ink-2, rgba(255, 255, 255, 0.75));
}

/* ─── Rich Notification Enhancements ─── */
.hs-note-context {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.hs-note-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(59, 130, 246, 0.34);
  color: #93c5fd;
  cursor: pointer;
}

/* ─── Thermal Floorplan Overlay ─── */
.fp-room--thermal {
  background: color-mix(in srgb, var(--fp-thermal-color, #34d399) 34%, rgba(255, 255, 255, 0.08)) !important;
  border-color: color-mix(in srgb, var(--fp-thermal-color, #34d399) 70%, transparent) !important;
  box-shadow: inset 0 0 24px color-mix(in srgb, var(--fp-thermal-color, #34d399) 28%, transparent);
}
.fp-thermal-pill {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
  z-index: 2;
}

/* ─── Deep Link Copy Row ─── */
.hs-deeplink-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.hs-deeplink-row code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
  color: var(--ink-2);
}

/* ─── Device Card Vertical Swipe Feedback ─── */
.device-tile--swipe-hint {
  box-shadow: 0 0 0 2px var(--on, #ffc94d), 0 12px 30px rgba(0, 0, 0, 0.35);
}
`;
