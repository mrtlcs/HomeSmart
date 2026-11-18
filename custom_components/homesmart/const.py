"""Constants for the HomeSmart integration."""

DOMAIN = "homesmart"
STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.config"

# Static frontend paths
PANEL_URL = "homesmart"
PANEL_TITLE = "HomeSmart"
PANEL_ICON = "mdi:view-dashboard-variant"
STATIC_PATH = "/homesmart_static"
FRONTEND_FILE_NAME = "homesmart-panel.js"

# WebSocket commands
WS_TYPE_CONFIG_GET = "homesmart/config/get"
WS_TYPE_CONFIG_SAVE = "homesmart/config/save"

# Themes
THEME_AURORA = "aurora"
THEME_OCEAN = "ocean"
THEME_WINE = "wine"
THEME_GRAPHITE = "graphite"
THEME_EMERALD = "emerald"
THEME_SUNSET = "sunset"

THEMES = [
    THEME_AURORA,
    THEME_OCEAN,
    THEME_WINE,
    THEME_GRAPHITE,
    THEME_EMERALD,
    THEME_SUNSET,
]

# Layout modes
LAYOUT_AUTO = "auto"
LAYOUT_SIDEBAR = "sidebar"
LAYOUT_FOCUS = "focus"
LAYOUT_GRID = "grid"
LAYOUT_TV = "tv"

LAYOUTS = [
    LAYOUT_AUTO,
    LAYOUT_SIDEBAR,
    LAYOUT_FOCUS,
    LAYOUT_GRID,
    LAYOUT_TV,
]

# Card sizes
CARD_SIZE_1X1 = "1x1"
CARD_SIZE_2X1 = "2x1"
CARD_SIZE_2X2 = "2x2"

# Default configuration dictionary
DEFAULT_CONFIG = {
    "version": 1,
    "theme": THEME_AURORA,
    "layout": LAYOUT_AUTO,
    "locale": "vi",
    "screensaver": {
        "enabled": True,
        "timeout_seconds": 180,
        "show_clock": True,
        "show_weather": True,
        "pixel_shift": True,
    },
    "custom_cards": {},
    "hidden_entities": [],
    "protected_entities": {},
    "area_order": [],
}
