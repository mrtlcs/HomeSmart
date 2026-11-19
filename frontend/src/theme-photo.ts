// The Photo layout (Pro): the room's photo fills the screen and a panel in the theme's own background
// covers its right side, flush with the edges, with the cards (screens/layouts/PhotoLayout.tsx).
// Everything is scoped to .view-photo, so the other layouts never see it.
export const themePhoto = String.raw`
.app-shell.view-photo { --ph-side: clamp(280px, 34vw, 470px); --ph-radius: calc(var(--u)*4.2*var(--hd-r,1)); }
.app-shell.view-photo > .screen.ph {
  position: relative; z-index: 1; display: grid; grid-template-columns: var(--ph-side) minmax(0, 1fr);
  height: calc(var(--hd-vh, 1vh)*100); padding: 0; gap: 0; overflow: hidden; box-sizing: border-box;
}

/* ---------- The photo ---------- */
.app-shell .ph-photo {
  position: absolute; inset: 0; z-index: 0; background-size: cover; background-repeat: no-repeat;
  /* Without a photo it ends under the panel's rounded corner: nothing shows past it. */
  right: calc(100% - var(--ph-side) - var(--ph-radius)*2);
  transition: filter .8s ease;
}
.app-shell .ph-photo--off { filter: brightness(.42) saturate(.7); }
.app-shell .ph-photo--none { background: radial-gradient(ellipse 90% 70% at 20% 10%, color-mix(in srgb, var(--ambient-1, #6b3b4f) 85%, #fff 8%), transparent 70%), linear-gradient(170deg, var(--ambient-3, #3b2430), var(--ambient-4, #1d1520)); }
.app-shell .ph-photo__icon { position: absolute; left: calc(var(--ph-side)*.5); top: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,.1); }
.app-shell .ph-photo__icon svg, .app-shell .ph-photo__icon .hd-ha-icon { width: min(28vw, 200px) !important; height: min(28vw, 200px) !important; --mdc-icon-size: min(28vw, 200px); }
.app-shell .ph-photo__glow { position: absolute; inset: 0; mix-blend-mode: screen; pointer-events: none;
  background: radial-gradient(ellipse 26% 34% at var(--gx) var(--gy), rgba(255,196,110,.58), rgba(255,170,70,.16) 55%, transparent 75%); }
.app-shell.hd-motion .ph-photo__glow { animation: ph-glow 1s ease both; }
@keyframes ph-glow { from { opacity: 0; } }
.app-shell .ph-photo__shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(0,0,0,.42), transparent 30%, transparent 60%, rgba(0,0,0,.58)); }

/* ---------- The strip of photo on the left ---------- */
.app-shell .ph-side { position: relative; z-index: 1; min-width: 0; display: flex; flex-direction: column; gap: calc(var(--u)*2); padding: calc(var(--u)*3.4) calc(var(--u)*3) calc(var(--u)*3); color: #fff; text-shadow: 0 1px 12px rgba(0,0,0,.35); }
.app-shell .ph-side__top { display: flex; justify-content: flex-end; min-height: calc(var(--u)*5); }
.app-shell .ph-side__title h1 { margin: 0; font: 600 calc(var(--u)*6.4)/1 var(--f-display); letter-spacing: -.03em; overflow-wrap: anywhere; }
.app-shell .ph-side__title .ph-side__time { font-weight: 300; font-size: calc(var(--u)*9); letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.app-shell .ph-side__title p { display: flex; align-items: center; gap: calc(var(--u)*.7); margin: calc(var(--u)*1.2) 0 0; font: 500 calc(var(--u)*1.7)/1.35 var(--f-body); color: rgba(255,255,255,.88); }
.app-shell .ph-rooms { margin-top: auto; display: flex; flex-wrap: wrap; gap: calc(var(--u)*.9); }
.app-shell .ph-rooms button {
  display: inline-flex; align-items: center; gap: calc(var(--u)*.7); height: calc(var(--u)*4.6); min-height: 36px; padding: 0 calc(var(--u)*1.8);
  border-radius: var(--hd-pill, 99px); border: 1px solid rgba(255,255,255,.18); background: rgba(18,14,20,.46); color: #fff; cursor: pointer;
  font: 600 calc(var(--u)*1.6)/1 var(--f-body); text-shadow: none; backdrop-filter: blur(14px) saturate(1.3); -webkit-backdrop-filter: blur(14px) saturate(1.3);
  transition: background .2s ease, transform .25s cubic-bezier(.3,1.4,.5,1);
}
.app-shell .ph-rooms button:active { transform: scale(.95); }
.app-shell .ph-rooms button[aria-current="page"] { background: #fff; color: #1b1620; border-color: transparent; }
.app-shell .ph-rooms button i { width: 7px; height: 7px; border-radius: 50%; background: var(--on, #f5c542); box-shadow: 0 0 8px var(--on, #f5c542); }

/* ---------- The panel: flush with the edges, in the theme's own background ---------- */
.app-shell .ph-panel {
  position: relative; z-index: 2; min-width: 0; min-height: 0; display: flex; flex-direction: column;
  border-radius: var(--ph-radius) 0 0 var(--ph-radius); overflow: hidden;
  background:
    radial-gradient(circle at 80% 8%, var(--ambient-1) 0, transparent 58%),
    radial-gradient(circle at 10% 96%, var(--ambient-2) 0, transparent 56%),
    radial-gradient(circle at 56% 52%, var(--ambient-3) 0, transparent 45%),
    var(--ambient-4);
  box-shadow: calc(var(--u)*-2.4) 0 calc(var(--u)*6) rgba(0,0,0,.42), inset 1px 0 0 rgba(255,255,255,.1);
}
.app-shell .ph-bar { display: flex; align-items: center; justify-content: space-between; gap: calc(var(--u)*1.6); padding: calc(var(--u)*2.6) calc(var(--u)*3.2) 0; }
.app-shell .ph-bar .context-header { height: auto; min-height: 0; flex: none; margin: 0; padding: 0; }
.app-shell .ph-tabs { min-width: 0; display: flex; gap: 2px; padding: 4px; border-radius: var(--hd-pill, 99px); background: rgba(255,255,255,.07); border: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; }
.app-shell .ph-tabs::-webkit-scrollbar { display: none; }
.app-shell .ph-tabs button { flex: none; display: inline-flex; align-items: center; gap: calc(var(--u)*.7); height: calc(var(--u)*4.4); min-height: 34px; padding: 0 calc(var(--u)*1.7); border: 0; border-radius: var(--hd-pill, 99px); background: none; color: var(--ink-2); cursor: pointer; font: 600 calc(var(--u)*1.5)/1 var(--f-body); white-space: nowrap; transition: background .2s ease, color .2s ease; }
.app-shell .ph-tabs button[aria-current="page"] { background: rgba(255,255,255,.16); color: var(--ink); }
.app-shell .ph-scroll { flex: 1; min-height: 0; overflow: auto; padding: calc(var(--u)*2.6) calc(var(--u)*3.2) calc(var(--u)*10); display: flex; flex-direction: column; gap: calc(var(--u)*2.2); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.25) transparent; }
.app-shell .ph-head { display: flex; align-items: flex-end; justify-content: space-between; gap: calc(var(--u)*2); flex-wrap: wrap; }
.app-shell .ph-head h2 { margin: 0; font: 600 calc(var(--u)*4.4)/1.05 var(--f-display); letter-spacing: -.025em; }
.app-shell .ph-head p { margin: calc(var(--u)*.8) 0 0; color: var(--ink-2); font: 500 calc(var(--u)*1.6)/1.3 var(--f-body); }
.app-shell .ph-actions { display: flex; gap: calc(var(--u)*1); flex-wrap: wrap; }
.app-shell .ph-btn { display: inline-flex; align-items: center; justify-content: center; gap: calc(var(--u)*.8); height: calc(var(--u)*4.8); min-height: 38px; padding: 0 calc(var(--u)*2); border-radius: var(--hd-pill, 99px); border: 1px solid var(--line); background: rgba(255,255,255,.08); color: var(--ink); cursor: pointer; font: 600 calc(var(--u)*1.55)/1 var(--f-body); }
.app-shell .ph-btn--main { background: var(--on, #f5c542); color: var(--on-ink, #2a2110); border-color: transparent; box-shadow: 0 8px 20px color-mix(in srgb, var(--on, #f5c542) 30%, transparent); }
.app-shell .ph-btn:disabled { opacity: .6; cursor: default; }
.app-shell .ph-round { width: calc(var(--u)*5.2); height: calc(var(--u)*5.2); min-width: 40px; min-height: 40px; display: grid; place-items: center; padding: 0; border-radius: 50%; border: 1px solid rgba(255,255,255,.24); background: rgba(255,255,255,.16); color: #fff; cursor: pointer; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.app-shell .ph-plan { flex: 1; min-height: calc(var(--u)*50); position: relative; display: flex; flex-direction: column; }
.app-shell .ph-plan > .fp { flex: 1 1 auto; min-height: 0; height: auto; }
.app-shell .ph-scroll--plan { overflow: hidden; padding-bottom: calc(var(--u)*3); }
.app-shell .ph-scroll--plan.ph-scroll--editing { overflow: auto; }
.app-shell .ph-scroll > .scene-section { margin: 0; }

/* ---------- The photo window ---------- */
.app-shell .ph-sheet { width: min(760px, 94vw); }
.app-shell .ph-sheet__body { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: calc(var(--u)*2.4); align-items: start; }
.app-shell .ph-sheet__preview { position: relative; height: min(46vh, 380px); width: auto; max-width: 100%; justify-self: center; border-radius: calc(var(--u)*2*var(--hd-r,1)); overflow: hidden; background: rgba(255,255,255,.06); border: 1px dashed rgba(255,255,255,.25); }
.app-shell .ph-sheet__preview--mark { cursor: crosshair; }
.app-shell .ph-sheet__img { position: absolute; inset: 0; background-size: cover; }
.app-shell .ph-sheet__empty { position: absolute; inset: 0; display: grid; place-items: center; color: rgba(255,255,255,.4); }
.app-shell .ph-sheet__dot { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; background: #ffd76a; box-shadow: 0 0 0 4px rgba(255,255,255,.7), 0 0 26px 10px rgba(255,200,90,.7); pointer-events: none; }
.app-shell .ph-sheet__side { display: flex; flex-direction: column; gap: calc(var(--u)*1.2); }
.app-shell .ph-sheet__hint { margin: calc(var(--u)*.4) 0 0; color: var(--ink-2); font: 500 calc(var(--u)*1.45)/1.45 var(--f-body); }
.app-shell .ph-sheet__options { display: flex; flex-direction: column; margin-top: calc(var(--u)*2); }
.app-shell .ph-sheet__row { display: flex; align-items: center; justify-content: space-between; gap: calc(var(--u)*2); padding: calc(var(--u)*1.4) 0; border-top: 1px solid var(--line); font: 600 calc(var(--u)*1.6)/1.3 var(--f-body); cursor: pointer; }
.app-shell .ph-sheet__row span { display: flex; flex-direction: column; gap: 3px; }
.app-shell .ph-sheet__row small { color: var(--ink-2); font-weight: 500; font-size: calc(var(--u)*1.35); }
.app-shell .ph-sheet__row input[type="range"] { width: min(260px, 45%); accent-color: var(--on, #f5c542); }
.app-shell .ph-sheet__row input[type="checkbox"] { width: 22px; height: 22px; accent-color: var(--on, #f5c542); }

/* ---------- Phones: the photo is a band on top and the panel slides up over it ---------- */
@media (max-width: 720px) {
  .app-shell.view-photo > .screen.ph { display: flex; flex-direction: column; height: auto; min-height: calc(var(--hd-vh, 1vh)*100); overflow: visible; }
  .app-shell .ph-photo { position: absolute; right: 0; bottom: auto; height: calc(var(--hd-vh, 1vh)*46); }
  .app-shell .ph-side { min-height: calc(var(--hd-vh, 1vh)*40); padding: calc(var(--u)*3) calc(var(--u)*2.4) calc(var(--u)*5); }
  .app-shell .ph-rooms { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: calc(var(--u)*-2.4); padding-right: calc(var(--u)*2.4); }
  .app-shell .ph-rooms::-webkit-scrollbar { display: none; }
  .app-shell .ph-rooms button { flex: none; }
  .app-shell .ph-panel { margin-top: calc(var(--u)*-3); border-radius: var(--ph-radius) var(--ph-radius) 0 0; min-height: calc(var(--hd-vh, 1vh)*62); overflow: visible; box-shadow: 0 calc(var(--u)*-2) calc(var(--u)*5) rgba(0,0,0,.4); }
  .app-shell .ph-bar { flex-direction: column-reverse; align-items: stretch; padding: calc(var(--u)*2.4) calc(var(--u)*2.4) 0; }
  .app-shell .ph-bar .context-header { justify-content: flex-end; }
  .app-shell .ph-scroll { overflow: visible; padding: calc(var(--u)*2.4) calc(var(--u)*2.4) calc(var(--u)*12); }
  .app-shell .ph-sheet__body { grid-template-columns: minmax(0, 1fr); }
  /* The photo already names the room: the panel keeps only the buttons. */
  .app-shell .ph-head > div:first-child { display: none; }
  .app-shell .ph-head { justify-content: flex-end; }
}
/* Tablets held upright: a narrower strip of photo. */
@media (min-width: 721px) and (orientation: portrait) { .app-shell.view-photo { --ph-side: clamp(240px, 30vw, 340px); } }

/* The layout's miniature in the picker. */
:is(.app-shell, .onboarding-screen) .lp-thumb--photo { flex-direction: row; gap: 0; padding: 0; overflow: hidden; background: linear-gradient(180deg, #5d6d8c, #44516d 64%, #7a5a43 64%); }
:is(.app-shell, .onboarding-screen) .lp-ph-photo { position: relative; width: 36%; }
:is(.app-shell, .onboarding-screen) .lp-ph-photo b { position: absolute; left: 12%; right: 0; bottom: 22%; height: 18%; border-radius: 4px; background: #4a71b8; }
:is(.app-shell, .onboarding-screen) .lp-ph-photo i { position: absolute; left: 22%; top: 18%; width: 30%; height: 30%; border-radius: 2px; background: #1b2238; box-shadow: 0 0 0 2px #d8d2c4; }
:is(.app-shell, .onboarding-screen) .lp-ph-panel { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 6px; border-radius: 7px 0 0 7px; background: linear-gradient(135deg, #2a1d2b, #3b2430); box-shadow: -3px 0 8px rgba(0,0,0,.4); align-content: center; }
:is(.app-shell, .onboarding-screen) .lp-ph-panel i { height: 12px; border-radius: 3px; background: rgba(255,255,255,.14); }
:is(.app-shell, .onboarding-screen) .lp-ph-panel i.lp-on { background: #f4edd9; }
`;
