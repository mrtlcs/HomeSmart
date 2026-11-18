/**
 * HomeSmart - Glassmorphism Themes & Typography CSS
 * Enhanced with Midnight Blue & Atmospheric Spotlight
 */

import { css } from 'lit';

export const themeStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', 'Figtree', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    /* Base Tokens */
    --hs-font-display: 'Plus Jakarta Sans', 'Outfit', sans-serif;
    --hs-font-body: 'Plus Jakarta Sans', 'Figtree', sans-serif;
    --hs-radius-sm: 10px;
    --hs-radius-md: 16px;
    --hs-radius-lg: 24px;
    --hs-radius-xl: 32px;
    --hs-transition-fast: 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-normal: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ========================================================
     THEME 0: MIDNIGHT DECK (SIGNATURE DEEP NAVY)
     Deep Navy / Sapphire with Right Atmospheric Soft Spotlight
     ======================================================== */
  :host([data-theme='midnight']),
  :host(:not([data-theme])),
  .theme-midnight {
    --hs-bg-gradient: radial-gradient(ellipse 95% 70% at 75% 50%, #1e355b 0%, #0e1a2f 45%, #070d18 100%);
    --hs-glass-bg: rgba(22, 36, 62, 0.38);
    --hs-glass-bg-hover: rgba(30, 48, 82, 0.55);
    --hs-glass-bg-active: rgba(40, 64, 108, 0.72);
    --hs-glass-border: rgba(255, 255, 255, 0.08);
    --hs-glass-border-hover: rgba(255, 255, 255, 0.16);
    --hs-glass-border-active: rgba(147, 197, 253, 0.45);
    --hs-accent: #38bdf8;
    --hs-accent-secondary: #818cf8;
    --hs-glow-color: rgba(56, 189, 248, 0.25);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 255, 255, 0.65);
    --hs-text-muted: rgba(255, 255, 255, 0.42);
    --hs-sidebar-bg: rgba(8, 14, 26, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  }

  /* ========================================================
     THEME 1: AURORA (VIOLET / INDIGO / NEON TEAL GLOW)
     ======================================================== */
  :host([data-theme='aurora']),
  .theme-aurora {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #291b58 0%, #100b2a 45%, #05040f 100%);
    --hs-glass-bg: rgba(28, 22, 58, 0.42);
    --hs-glass-bg-hover: rgba(38, 30, 78, 0.6);
    --hs-glass-bg-active: rgba(50, 40, 102, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(180, 165, 255, 0.3);
    --hs-glass-border-active: rgba(0, 242, 254, 0.55);
    --hs-accent: #00f2fe;
    --hs-accent-secondary: #7f5af0;
    --hs-glow-color: rgba(0, 242, 254, 0.25);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 255, 255, 0.68);
    --hs-text-muted: rgba(255, 255, 255, 0.42);
    --hs-sidebar-bg: rgba(12, 9, 30, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  }

  /* ========================================================
     THEME 2: OCEAN (DEEP SAPPHIRE / NAVY / CYAN)
     ======================================================== */
  :host([data-theme='ocean']),
  .theme-ocean {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #133a6b 0%, #091c36 45%, #030a15 100%);
    --hs-glass-bg: rgba(13, 42, 78, 0.42);
    --hs-glass-bg-hover: rgba(20, 62, 112, 0.6);
    --hs-glass-bg-active: rgba(28, 84, 148, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(120, 195, 255, 0.35);
    --hs-glass-border-active: rgba(0, 217, 255, 0.55);
    --hs-accent: #00d9ff;
    --hs-accent-secondary: #0072ff;
    --hs-glow-color: rgba(0, 217, 255, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 245, 255, 0.7);
    --hs-text-muted: rgba(180, 215, 255, 0.42);
    --hs-sidebar-bg: rgba(6, 18, 36, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
  }

  /* ========================================================
     THEME 3: WINE (DARK RUBY / BURGUNDY / ROSE)
     ======================================================== */
  :host([data-theme='wine']),
  .theme-wine {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #46142e 0%, #200714 45%, #0a0206 100%);
    --hs-glass-bg: rgba(56, 18, 38, 0.42);
    --hs-glass-bg-hover: rgba(78, 26, 54, 0.6);
    --hs-glass-bg-active: rgba(104, 34, 72, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(255, 145, 175, 0.35);
    --hs-glass-border-active: rgba(255, 75, 114, 0.55);
    --hs-accent: #ff4b72;
    --hs-accent-secondary: #f857a6;
    --hs-glow-color: rgba(255, 75, 114, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 230, 238, 0.7);
    --hs-text-muted: rgba(255, 190, 210, 0.42);
    --hs-sidebar-bg: rgba(24, 6, 16, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #ff4b72 0%, #f857a6 100%);
  }

  /* ========================================================
     THEME 4: GRAPHITE (TITANIUM / DARK SLATE / MONOCHROME)
     ======================================================== */
  :host([data-theme='graphite']),
  .theme-graphite {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #2a303a 0%, #15181d 45%, #08090b 100%);
    --hs-glass-bg: rgba(34, 39, 48, 0.45);
    --hs-glass-bg-hover: rgba(48, 55, 68, 0.65);
    --hs-glass-bg-active: rgba(62, 71, 88, 0.85);
    --hs-glass-border: rgba(255, 255, 255, 0.08);
    --hs-glass-border-hover: rgba(255, 255, 255, 0.2);
    --hs-glass-border-active: rgba(255, 255, 255, 0.45);
    --hs-accent: #38bdf8;
    --hs-accent-secondary: #e2e8f0;
    --hs-glow-color: rgba(56, 189, 248, 0.25);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(226, 232, 240, 0.7);
    --hs-text-muted: rgba(148, 163, 184, 0.45);
    --hs-sidebar-bg: rgba(16, 19, 23, 0.85);
    --hs-active-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  }

  /* ========================================================
     THEME 5: EMERALD (CYBER OBSIDIAN / JADE / MINT)
     ======================================================== */
  :host([data-theme='emerald']),
  .theme-emerald {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #133a2e 0%, #092019 45%, #020b08 100%);
    --hs-glass-bg: rgba(14, 46, 36, 0.42);
    --hs-glass-bg-hover: rgba(22, 68, 54, 0.6);
    --hs-glass-bg-active: rgba(30, 92, 72, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(80, 255, 190, 0.35);
    --hs-glass-border-active: rgba(0, 245, 160, 0.55);
    --hs-accent: #00f5a0;
    --hs-accent-secondary: #00d9f5;
    --hs-glow-color: rgba(0, 245, 160, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 255, 245, 0.7);
    --hs-text-muted: rgba(160, 225, 200, 0.42);
    --hs-sidebar-bg: rgba(6, 22, 17, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
  }

  /* ========================================================
     THEME 6: SUNSET (CORAL / DUSK AMBER / TWILIGHT)
     ======================================================== */
  :host([data-theme='sunset']),
  .theme-sunset {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #461d32 0%, #220d1a 45%, #0a0308 100%);
    --hs-glass-bg: rgba(58, 22, 40, 0.42);
    --hs-glass-bg-hover: rgba(82, 32, 58, 0.6);
    --hs-glass-bg-active: rgba(110, 44, 78, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(254, 180, 123, 0.35);
    --hs-glass-border-active: rgba(255, 126, 95, 0.55);
    --hs-accent: #ff7e5f;
    --hs-accent-secondary: #feb47b;
    --hs-glow-color: rgba(255, 126, 95, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 235, 230, 0.7);
    --hs-text-muted: rgba(255, 195, 180, 0.42);
    --hs-sidebar-bg: rgba(26, 9, 20, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
  }

  /* Global App Shell */
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
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid var(--hs-glass-border);
    border-radius: var(--hs-radius-lg);
    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.35);
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
    pointer-events: none;
  }

  .glass-card:hover {
    background: var(--hs-glass-bg-hover);
    border-color: var(--hs-glass-border-hover);
    transform: translateY(-2px);
    box-shadow: 0 14px 40px 0 rgba(0, 0, 0, 0.42);
  }

  .glass-card.active {
    background: var(--hs-glass-bg-active);
    border-color: var(--hs-glass-border-active);
    box-shadow: 0 0 24px var(--hs-glow-color), 0 10px 30px 0 rgba(0, 0, 0, 0.4);
  }

  /* TV / D-Pad Focus Ring */
  .glass-card:focus-visible,
  .glass-card.dpad-focused {
    outline: none !important;
    border-color: var(--hs-accent) !important;
    box-shadow: 0 0 0 3px var(--hs-accent), 0 0 30px var(--hs-glow-color) !important;
    transform: scale(1.02) translateY(-2px) !important;
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
    background: rgba(255, 255, 255, 0.12);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;
