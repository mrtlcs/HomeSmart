/**
 * HomeSmart - Glassmorphism Themes & Typography CSS
 */

import { css } from 'lit';

export const themeStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    font-family: 'Figtree', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    /* Base Tokens */
    --hs-font-display: 'Outfit', sans-serif;
    --hs-font-body: 'Figtree', sans-serif;
    --hs-radius-sm: 10px;
    --hs-radius-md: 16px;
    --hs-radius-lg: 24px;
    --hs-radius-xl: 32px;
    --hs-transition-fast: 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-normal: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ========================================================
     THEME 1: AURORA (VIOLET / INDIGO / NEON TEAL GLOW)
     ======================================================== */
  :host([data-theme='aurora']),
  .theme-aurora {
    --hs-bg-gradient: radial-gradient(circle at 10% 20%, #1f1444 0%, #0d0a21 40%, #05040d 100%),
      radial-gradient(circle at 90% 80%, rgba(0, 242, 254, 0.15) 0%, transparent 50%);
    --hs-glass-bg: rgba(25, 20, 52, 0.45);
    --hs-glass-bg-hover: rgba(35, 28, 72, 0.65);
    --hs-glass-bg-active: rgba(45, 36, 92, 0.85);
    --hs-glass-border: rgba(147, 128, 255, 0.18);
    --hs-glass-border-hover: rgba(180, 165, 255, 0.4);
    --hs-glass-border-active: rgba(0, 242, 254, 0.65);
    --hs-accent: #00f2fe;
    --hs-accent-secondary: #7f5af0;
    --hs-glow-color: rgba(0, 242, 254, 0.35);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 255, 255, 0.7);
    --hs-text-muted: rgba(255, 255, 255, 0.45);
    --hs-sidebar-bg: rgba(13, 10, 33, 0.75);
    --hs-active-gradient: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  }

  /* ========================================================
     THEME 2: OCEAN (DEEP SAPPHIRE / NAVY / CYAN)
     ======================================================== */
  :host([data-theme='ocean']),
  .theme-ocean {
    --hs-bg-gradient: radial-gradient(circle at 20% 10%, #0c2547 0%, #07162c 50%, #020813 100%),
      radial-gradient(circle at 85% 85%, rgba(0, 198, 255, 0.18) 0%, transparent 55%);
    --hs-glass-bg: rgba(11, 37, 69, 0.45);
    --hs-glass-bg-hover: rgba(19, 58, 104, 0.65);
    --hs-glass-bg-active: rgba(28, 80, 140, 0.85);
    --hs-glass-border: rgba(77, 166, 255, 0.2);
    --hs-glass-border-hover: rgba(120, 195, 255, 0.45);
    --hs-glass-border-active: rgba(0, 217, 255, 0.7);
    --hs-accent: #00d9ff;
    --hs-accent-secondary: #0072ff;
    --hs-glow-color: rgba(0, 217, 255, 0.4);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 245, 255, 0.75);
    --hs-text-muted: rgba(180, 215, 255, 0.45);
    --hs-sidebar-bg: rgba(7, 22, 44, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
  }

  /* ========================================================
     THEME 3: WINE (DARK RUBY / BURGUNDY / ROSE)
     ======================================================== */
  :host([data-theme='wine']),
  .theme-wine {
    --hs-bg-gradient: radial-gradient(circle at 20% 15%, #3a0d24 0%, #1c0511 50%, #090105 100%),
      radial-gradient(circle at 80% 85%, rgba(255, 75, 114, 0.16) 0%, transparent 50%);
    --hs-glass-bg: rgba(58, 13, 36, 0.45);
    --hs-glass-bg-hover: rgba(85, 20, 54, 0.65);
    --hs-glass-bg-active: rgba(112, 28, 72, 0.85);
    --hs-glass-border: rgba(255, 105, 140, 0.22);
    --hs-glass-border-hover: rgba(255, 145, 175, 0.48);
    --hs-glass-border-active: rgba(255, 75, 114, 0.7);
    --hs-accent: #ff4b72;
    --hs-accent-secondary: #f857a6;
    --hs-glow-color: rgba(255, 75, 114, 0.38);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 230, 238, 0.75);
    --hs-text-muted: rgba(255, 190, 210, 0.45);
    --hs-sidebar-bg: rgba(28, 5, 17, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #ff4b72 0%, #f857a6 100%);
  }

  /* ========================================================
     THEME 4: GRAPHITE (TITANIUM / DARK SLATE / MONOCHROME)
     ======================================================== */
  :host([data-theme='graphite']),
  .theme-graphite {
    --hs-bg-gradient: radial-gradient(circle at 30% 10%, #20242b 0%, #121417 55%, #08090a 100%),
      radial-gradient(circle at 75% 85%, rgba(226, 232, 240, 0.08) 0%, transparent 60%);
    --hs-glass-bg: rgba(30, 34, 42, 0.5);
    --hs-glass-bg-hover: rgba(45, 51, 62, 0.7);
    --hs-glass-bg-active: rgba(58, 66, 80, 0.88);
    --hs-glass-border: rgba(255, 255, 255, 0.12);
    --hs-glass-border-hover: rgba(255, 255, 255, 0.25);
    --hs-glass-border-active: rgba(255, 255, 255, 0.55);
    --hs-accent: #38bdf8;
    --hs-accent-secondary: #e2e8f0;
    --hs-glow-color: rgba(56, 189, 248, 0.35);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(226, 232, 240, 0.75);
    --hs-text-muted: rgba(148, 163, 184, 0.5);
    --hs-sidebar-bg: rgba(18, 20, 23, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  }

  /* ========================================================
     THEME 5: EMERALD (CYBER OBSIDIAN / JADE / MINT)
     ======================================================== */
  :host([data-theme='emerald']),
  .theme-emerald {
    --hs-bg-gradient: radial-gradient(circle at 20% 10%, #0d2e23 0%, #071a14 50%, #020a07 100%),
      radial-gradient(circle at 80% 85%, rgba(0, 245, 160, 0.16) 0%, transparent 50%);
    --hs-glass-bg: rgba(13, 46, 35, 0.45);
    --hs-glass-bg-hover: rgba(20, 68, 52, 0.65);
    --hs-glass-bg-active: rgba(28, 92, 70, 0.85);
    --hs-glass-border: rgba(0, 245, 160, 0.2);
    --hs-glass-border-hover: rgba(80, 255, 190, 0.45);
    --hs-glass-border-active: rgba(0, 245, 160, 0.7);
    --hs-accent: #00f5a0;
    --hs-accent-secondary: #00d9f5;
    --hs-glow-color: rgba(0, 245, 160, 0.38);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 255, 245, 0.75);
    --hs-text-muted: rgba(160, 225, 200, 0.45);
    --hs-sidebar-bg: rgba(7, 26, 20, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
  }

  /* ========================================================
     THEME 6: SUNSET (CORAL / DUSK AMBER / TWILIGHT)
     ======================================================== */
  :host([data-theme='sunset']),
  .theme-sunset {
    --hs-bg-gradient: radial-gradient(circle at 15% 15%, #3d1428 0%, #1f0b18 50%, #0a0308 100%),
      radial-gradient(circle at 85% 80%, rgba(255, 126, 95, 0.18) 0%, transparent 50%);
    --hs-glass-bg: rgba(61, 20, 40, 0.45);
    --hs-glass-bg-hover: rgba(88, 30, 58, 0.65);
    --hs-glass-bg-active: rgba(118, 42, 78, 0.85);
    --hs-glass-border: rgba(255, 126, 95, 0.22);
    --hs-glass-border-hover: rgba(254, 180, 123, 0.48);
    --hs-glass-border-active: rgba(255, 126, 95, 0.7);
    --hs-accent: #ff7e5f;
    --hs-accent-secondary: #feb47b;
    --hs-glow-color: rgba(255, 126, 95, 0.4);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 235, 230, 0.75);
    --hs-text-muted: rgba(255, 195, 180, 0.45);
    --hs-sidebar-bg: rgba(31, 11, 24, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
  }

  /* Global App Container */
  .homesmart-shell {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: var(--hs-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  /* Glass Card Foundation */
  .glass-card {
    background: var(--hs-glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--hs-glass-border);
    border-radius: var(--hs-radius-lg);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    transition: all var(--hs-transition-normal);
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    pointer-events: none;
  }

  .glass-card:hover {
    background: var(--hs-glass-bg-hover);
    border-color: var(--hs-glass-border-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 36px 0 rgba(0, 0, 0, 0.45);
  }

  .glass-card.active {
    background: var(--hs-glass-bg-active);
    border-color: var(--hs-glass-border-active);
    box-shadow: 0 0 24px var(--hs-glow-color), 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }

  /* TV / D-Pad Focus Ring */
  .glass-card:focus-visible,
  .glass-card.dpad-focused {
    outline: none !important;
    border-color: var(--hs-accent) !important;
    box-shadow: 0 0 0 3px var(--hs-accent), 0 0 30px var(--hs-glow-color) !important;
    transform: scale(1.03) translateY(-4px) !important;
    z-index: 10;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;
