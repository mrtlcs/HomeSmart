# HomeSmart 🏠✨

> **Commercial-Grade, Zero-YAML Dashboard Panel for Home Assistant**  
> *Modern Glassmorphic & Console UI — 100% Free & Open-Source.*

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/default)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.2.3-emerald.svg)]()
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue.svg)]()

---

## 🌟 Overview

**HomeSmart** (`domain: homesmart`) is a standalone custom panel integration for Home Assistant designed from the ground up for modern smart homes. It brings sleek, glassmorphic aesthetics and high-performance tactile interfaces directly into Home Assistant — **with zero YAML configuration, zero paywalls, and unlimited areas & devices.**

Whether viewed on a **Wall-Mounted Tablet**, a **Smartphone**, a **Desktop Command Center**, or an **Android TV with Remote D-Pad Navigation**, HomeSmart automatically adapts its Bento grid layout, font math, and interaction zones.

---

## ✨ Key Capabilities

### 1. 🚀 Zero-YAML Auto-Discovery Engine
- Instantly reads `hass.areas`, `hass.devices`, `hass.entities`, and `hass.states`.
- Automatically assigns devices to rooms (*Phòng Khách, Phòng Ngủ, Phòng Bếp, Sân Vườn, An Ninh*).
- Intelligently sizes Bento cards based on entity domains and features.

### 2. 🍱 Multi-Size Bento Grid System
- **`1x1` Standard Bento**: Compact toggles for lights, switches, fans, sensors, locks with active neon ambient glow.
- **`2x1` Slider Bento**: Full touch/mouse drag slider for dimmable lights (0-100% brightness), motorized covers/curtains (position slider with open/stop/close buttons), and fans.
- **`2x2` Interactive Master Cards**:
  - **Climate Thermostat Dial**: Beautiful SVG arc circular thermostat showing current & target temperatures with +/- controls and HVAC mode selectors.
  - **Live Camera Stream**: Real-time snapshot/video feed with "LIVE" status badge and 1-tap full-screen expansion.
  - **Media Player**: Album artwork glass background with track title, artist, volume slider, and playback controls.

### 3. 🛡️ Protected Security Cards
- Prevent accidental toggles on critical hardware (smart door locks, garage roller shutters, water heaters).
- **Two protection modes**:
  - **Double-Tap Confirmation**: Pop-up modal asking for explicit confirmation.
  - **4-Digit Security PIN**: Interactive numerical keypad with shake-animation error feedback.

### 4. 📐 5 Adaptive Layout Modes
- **Auto-Responsive**: Seamlessly switches between phone bottom navigation, tablet sidebar, and desktop grid based on viewport math.
- **Sidebar**: Frosted glass left navigation bar with area status counters (e.g. *3 đèn đang bật*).
- **Focus**: Single-room focus mode with clean horizontal room pills for tablets and phones.
- **Bento Grid**: All rooms and devices visible simultaneously in stacked sections.
- **TV Console (10-Foot UI)**: Scaled-up UI optimized for Android TV remote controls with **2D Spatial D-Pad Navigation** (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`).

### 5. 🎨 6 Built-in Glassmorphism Themes
Switch themes live with instant preview:
1. **Aurora (Default)**: Deep indigo / violet cosmos with neon cyan and teal glow.
2. **Ocean**: Oceanic deep sapphire with vibrant electric blue highlights.
3. **Wine**: Luxurious ruby and burgundy glass with rose-pink accents.
4. **Graphite**: Stealth matte titanium and slate for ultra-clean minimalist setups.
5. **Emerald**: Cyber obsidian and deep jade with bright mint green lighting.
6. **Sunset**: Dramatic dusk violet and warm amber coral twilight.

### 6. 🌙 Anti-Burn-In OLED Screensaver
- Designed specifically for wall tablets (Samsung Galaxy Tab, iPad OLED) and OLED Android TVs.
- True black `#000000` power-saving background.
- Floating digital clock, date, live weather status, and subtle ambient glow.
- **Anti-Burn-In Pixel Shifting**: Gently offsets screen elements every 60 seconds by random coordinates to safeguard OLED phosphors.
- Wakes up instantly on touch, click, or any remote button press.

### 7. 🌐 In-App Visual Editor & Cross-Device Sync
- Zero YAML files to edit!
- Tap the **Settings (Gear)** icon to open the glass drawer toolbar:
  - Change card sizes (`1x1` ↔ `2x1` ↔ `2x2`).
  - Set PIN protection on any device.
  - Hide or reorder entities.
  - Switch themes, layout modes, screensaver timeouts, and languages.
- Settings are saved directly to Home Assistant's `.storage` via custom WebSocket API (`homesmart/config/save`), syncing automatically across every tablet, phone, and TV in the house.

### 8. 🇻🇳 Bilingual Localization (Vietnamese Default & English)
- Fully localized with Vietnamese (`vi`) as default, plus English (`en`).
- Includes room names, HVAC states (*Làm mát, Sưởi ấm, Tự động*), cover actions (*Đang mở, Đang đóng*), and PIN dialog prompts.

---

## 📁 Repository File Structure

```text
homesmart/
├── hacs.json                             # HACS metadata
├── LICENSE                               # MIT License
├── README.md                             # Documentation
├── .gitignore
├── .github/
│   └── workflows/
│       ├── build_and_release.yml         # CI/CD bundle builder & release packager
│       └── validate_hacs.yml             # HACS repository validation
├── custom_components/
│   └── homesmart/
│       ├── __init__.py                   # Panel registration, static path & WebSocket API
│       ├── config_flow.py                # 1-Click UI config flow
│       ├── const.py                      # Integration constants and defaults
│       ├── manifest.json                 # Integration manifest
│       ├── storage.py                    # Home Assistant .storage persistence helper
│       ├── translations/
│       │   ├── en.json                   # English config flow strings
│       │   └── vi.json                   # Vietnamese config flow strings
│       └── frontend/
│           └── homesmart-panel.js        # Self-contained bundled ES module (compiled)
└── frontend/
    ├── package.json                      # Lit 3 & Vite dependencies
    ├── tsconfig.json                     # TypeScript compiler settings
    ├── vite.config.ts                    # Vite bundle configuration (inlineDynamicImports)
    ├── index.html                        # Standalone preview harness with Mock HASS
    └── src/
        ├── homesmart-panel.ts            # Main Custom Element <homesmart-panel>
        ├── types.ts                      # Full TypeScript interfaces
        ├── locales/
        │   └── i18n.ts                   # Vietnamese & English translations
        ├── themes/
        │   └── themes.css.ts             # Outfit/Figtree fonts & 6 glassmorphic themes
        ├── engine/
        │   ├── auto-discovery.ts         # Zero-YAML grouping & sizing engine
        │   ├── responsive-layout.ts      # Multi-screen viewport math
        │   └── dpad-navigation.ts        # 2D Spatial Navigation for TV Remote
        ├── components/
        │   ├── sidebar-nav.ts            # Sidebar + Mobile bottom bar
        │   ├── card-1x1.ts               # Standard 1x1 toggle card
        │   ├── card-2x1-slider.ts        # 2x1 dimmer/cover/fan slider card
        │   ├── card-2x2-climate.ts       # 2x2 circular thermostat dial card
        │   ├── card-2x2-media-cam.ts     # 2x2 live camera & media player card
        │   ├── visual-editor-bar.ts      # In-app visual customizer toolbar
        │   ├── confirm-dialog.ts         # Protected confirmation & PIN modal
        │   └── oled-screensaver.ts       # OLED screensaver with pixel shifting
        └── mock/
            └── mock-hass.ts              # Interactive Mock HASS state machine
```

---

## 📥 Installation

### Method 1: Via HACS (Recommended)
1. Open **HACS** in your Home Assistant sidebar.
2. Click **Integrations** > Three dots in top right > **Custom repositories**.
3. Paste repository URL: `https://github.com/mrtlcs/HomeSmart`.
4. Category: **Integration**. Click **Add**.
5. Find **HomeSmart**, click **Download**, and restart Home Assistant.
6. Go to **Settings** > **Devices & Services** > **Add Integration** > Search **HomeSmart**.
7. HomeSmart will appear in your left sidebar immediately!

### Method 2: Manual Installation
1. Download the latest release `homesmart.zip` from GitHub Releases.
2. Extract and copy `custom_components/homesmart` into your Home Assistant `<config_dir>/custom_components/`.
3. Restart Home Assistant.
4. Go to **Settings** > **Devices & Services** > **Add Integration** > Search **HomeSmart**.

---

## 🛠️ Developer Setup & Instant Preview

You can test, preview, and customize the HomeSmart dashboard directly on your computer without running a Home Assistant server, thanks to the included **Mock HASS Test Harness**:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. You will see an interactive smart home with realistic Vietnamese devices (*Phòng Khách, Phòng Ngủ Master, Phòng Bếp, Phòng Tắm Thông Minh*). You can toggle lights, drag brightness/volume/curtain sliders, adjust the AC dial, trigger PIN verification, and switch themes!

To compile the self-contained production bundle into `custom_components/homesmart/frontend/homesmart-panel.js`:

```bash
cd frontend
npm run build
```

---

## 📄 License
This project is licensed under the **MIT License** — free for personal and commercial smart home installations.
