"""Constants for HomeSmart."""

from typing import Final

DOMAIN: Final = "homesmart"
NAME: Final = "HomeSmart"
VERSION: Final = "2.1.0"

PANEL_URL: Final = "/homesmart_static"
PANEL_PATH: Final = "homesmart"
PANEL_TITLE: Final = "HomeSmart"
PANEL_ICON: Final = "mdi:view-dashboard-variant"
PANEL_ELEMENT: Final = "homesmart-panel"

SUPPORTED_DOMAINS: Final = {
    "alarm_control_panel",
    "automation",
    "binary_sensor",
    "button",
    "camera",
    "climate",
    "cover",
    "fan",
    "input_boolean",
    "input_button",
    "input_select",
    "light",
    "lock",
    "media_player",
    "plant",
    "scene",
    "script",
    "select",
    "sensor",
    "switch",
    "vacuum",
}

STORAGE_KEY: Final = "homesmart.config"
STORAGE_VERSION: Final = 1
