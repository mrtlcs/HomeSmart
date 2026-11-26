export const adaptiveStyles = `
.hs-adaptive {
  --adaptive-bg: #141c26;
  --adaptive-panel: #222e3b;
  --adaptive-line: #526171;
  --adaptive-accent: #ffdca3;
  background: var(--adaptive-bg);
  color: #f5f7fa;
  display: grid;
  grid-template-columns: minmax(11rem, 15rem) minmax(0, 1fr);
  min-height: var(--hd-vh, 100vh);
  position: relative;
}
.hs-adaptive button {
  align-items: center;
  background: #283747;
  border: 1px solid var(--adaptive-line);
  border-radius: .7rem;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  gap: .45rem;
  justify-content: center;
  min-height: 44px;
  padding: .55rem .8rem;
  text-align: start;
}
.hs-adaptive button:disabled { cursor: default; opacity: .55; }
.hs-adaptive button:focus-visible, .hs-adaptive input:focus-visible { outline: 3px solid var(--adaptive-accent); outline-offset: 3px; }
.hs-adaptive-nav {
  align-content: start;
  border-inline-end: 1px solid var(--adaptive-line);
  display: grid;
  gap: .6rem;
  height: max-content;
  padding: 1.3rem;
  position: sticky;
  top: 0;
}
.hs-adaptive-nav button { justify-content: flex-start; }
.hs-adaptive-nav button[aria-current] { background: var(--adaptive-accent); border-color: var(--adaptive-accent); color: #241c0d; font-weight: 700; }
.hs-adaptive-content { box-sizing: border-box; height: var(--hd-vh, 100vh); margin-inline: auto; max-width: 95rem; overflow: auto; padding: 1.4rem clamp(1rem, 3vw, 3rem); width: 100%; }
.hs-adaptive-header, .hs-adaptive-detail header, .hs-adaptive-summary { align-items: center; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: space-between; }
.hs-adaptive h1, .hs-adaptive h2 { margin: 0; overflow-wrap: anywhere; }
.hs-adaptive-header p { color: #c4d1df; margin-block: .3rem 0; }
.hs-adaptive-summary { border-block: 1px solid var(--adaptive-line); margin-block: 1.1rem; padding-block: .6rem; }
.hs-adaptive-grid { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); margin-block: .9rem; }
.hs-adaptive--compact .hs-adaptive-grid { gap: .55rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); }
.hs-adaptive-card { align-content: start; background: var(--adaptive-panel); border: 1px solid var(--adaptive-line); border-radius: .9rem; display: grid; gap: .55rem; min-width: 0; overflow-wrap: anywhere; padding: .65rem; }
.hs-adaptive button.hs-adaptive-card-label { align-items: start; background: transparent; border-color: transparent; flex-direction: column; justify-content: start; padding: .35rem; text-align: start; width: 100%; }
.hs-adaptive-card-label span, .hs-adaptive-card > span { color: #d0dbe8; font-size: .94em; }
.hs-adaptive-temp { align-items: center; display: grid; gap: .35rem; grid-template-columns: 1fr auto 1fr; text-align: center; }
.hs-adaptive-search { display: grid; gap: .4rem; margin-block: 1rem; max-width: 28rem; }
.hs-adaptive-search input { background: var(--adaptive-panel); border: 1px solid var(--adaptive-line); border-radius: .7rem; color: inherit; font: inherit; min-height: 44px; padding-inline: .7rem; }
.hs-adaptive-connection { border: 1px solid #ffdca3; border-radius: .7rem; color: #ffdca3; padding: .7rem; }
.hs-adaptive-overlay { background: #0008; display: flex; inset: 0; justify-content: flex-end; position: absolute; z-index: 12; }
.hs-adaptive-detail { background: var(--adaptive-panel); box-sizing: border-box; max-width: 100%; overflow: auto; padding: clamp(1rem, 3vw, 2rem); width: min(28rem, 100%); }
.hs-adaptive--quiet { --adaptive-bg: #121923; --adaptive-panel: #1d2633; }
.hs-adaptive button.hs-adaptive-idle { background: #111821; border: 0; border-radius: 0; display: grid; grid-column: 1 / -1; justify-items: center; align-content: center; min-height: var(--hd-vh, 100vh); width: 100%; }
.hs-adaptive-idle strong { font-size: clamp(2.5rem, 9vw, 8rem); }
.hs-adaptive--wall .hs-adaptive-content { padding-top: 2rem; }
.hs-adaptive--tv { font-size: clamp(1.3rem, 2.1vw, 2rem); grid-template-columns: 1fr; }
.hs-adaptive--tv .hs-adaptive-nav { border-inline-end: 0; display: flex; flex-wrap: wrap; position: static; padding: 3vh 4vw 1vh; }
.hs-adaptive--tv .hs-adaptive-content { height: 83vh; max-width: none; padding: 2vh 4vw; }
.hs-adaptive--tv .hs-adaptive-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.hs-adaptive--tv button { border-width: 2px; min-height: 3rem; }
.hs-adaptive--tv button:focus { outline: 4px solid var(--adaptive-accent); outline-offset: 4px; }
.hs-adaptive--tv .hs-adaptive-overlay { align-items: center; justify-content: center; padding: 5vh 5vw; }
.hs-adaptive--tv .hs-adaptive-detail { border-radius: 1rem; max-height: 90%; width: min(48rem, 100%); }
.hs-adaptive--phone { display: block; }
.hs-adaptive--phone .hs-adaptive-nav { background: var(--adaptive-bg); border: 0; bottom: 0; box-sizing: border-box; display: flex; inset-inline: 0; padding: .35rem .35rem calc(.35rem + env(safe-area-inset-bottom, 0px)); position: fixed; top: auto; z-index: 10; }
.hs-adaptive--phone .hs-adaptive-nav button { flex: 1; flex-direction: column; font-size: .72rem; min-width: 0; overflow-wrap: anywhere; padding: .3rem .15rem; text-align: center; }
.hs-adaptive--phone .hs-adaptive-content { padding: max(.9rem, env(safe-area-inset-top)) .75rem calc(5.25rem + env(safe-area-inset-bottom, 0px)); }
.hs-adaptive--phone .hs-adaptive-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); }
.hs-adaptive--phone .hs-adaptive-overlay { align-items: flex-end; }
.hs-adaptive--phone .hs-adaptive-detail { border-radius: 1rem 1rem 0 0; max-height: 90%; padding-bottom: max(1rem, env(safe-area-inset-bottom)); width: 100%; }
@media (max-width: 680px) {
  .hs-adaptive:not(.hs-adaptive--phone):not(.hs-adaptive--tv) { grid-template-columns: 1fr; }
  .hs-adaptive:not(.hs-adaptive--phone):not(.hs-adaptive--tv) .hs-adaptive-nav { border: 0; display: flex; flex-wrap: wrap; position: static; }
}

.hs-adaptive-links { display: flex; flex-wrap: wrap; gap: .6rem; margin-block: .8rem 1.5rem; }
.hs-return-adaptive { position: fixed; z-index: 75; top: .7rem; inset-inline-end: .9rem; }
.hs-profile-settings select, .hs-layout-preview article, .hs-profile-settings input[type="number"], .settings-v2 .st-sub__row select {
  color: var(--ink, #f5f7fa); background: var(--paper, #242f3b); border: 1px solid var(--line, #728399); border-radius: .55rem; padding: .55rem; max-width: 100%;
}
.hs-profile-settings fieldset { display: flex; flex-wrap: wrap; gap: .65rem; padding: .7rem; margin-block: .6rem; }
.hs-layout-preview { display: grid; gap: .45rem; margin-block: .75rem; max-width: 100%; padding: .65rem; border: 1px solid var(--line, #728399); border-radius: .65rem; }
.hs-layout-preview article { display: grid; min-width: 0; overflow-wrap: anywhere; }
.hs-layout-preview--phone { width: 18rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.hs-layout-preview--wall { width: 34rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.hs-layout-preview--desktop { width: 50rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.hs-layout-preview--tv { font-size: 1.15em; grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (prefers-reduced-motion: reduce) {
  .hs-adaptive *, .hs-adaptive *::before, .hs-adaptive *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
`;
