"""HomeSmart Custom Panel Integration for Home Assistant."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    FRONTEND_FILE_NAME,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL,
    STATIC_PATH,
    WS_TYPE_CONFIG_GET,
    WS_TYPE_CONFIG_SAVE,
)
from .storage import HomeSmartStorage

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = vol.Schema({DOMAIN: vol.Schema({})}, extra=vol.ALLOW_EXTRA)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the HomeSmart component."""
    hass.data.setdefault(DOMAIN, {})

    # Initialize storage
    storage = HomeSmartStorage(hass)
    await storage.async_load()
    hass.data[DOMAIN]["storage"] = storage

    # Register static path for frontend JS bundle
    frontend_dir = Path(__file__).parent / "frontend"
    panel_file = frontend_dir / FRONTEND_FILE_NAME

    # Register static path
    if hasattr(hass.http, "async_register_static_paths"):
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths([
            StaticPathConfig(
                url_path=f"{STATIC_PATH}/{FRONTEND_FILE_NAME}",
                path=str(panel_file),
                cache_headers=False,
            )
        ])
    else:
        hass.http.register_static_path(
            f"{STATIC_PATH}/{FRONTEND_FILE_NAME}",
            str(panel_file),
            cache_headers=False,
        )

    # Read manifest version for cache busting
    manifest_version = "1.2.1"
    try:
        import json
        manifest_file = Path(__file__).parent / "manifest.json"
        with open(manifest_file, encoding="utf-8") as f:
            manifest_version = json.load(f).get("version", "1.2.1")
    except Exception:
        pass

    # Register Custom Panel with cache-busting version query parameter
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL,
        config={
            "_panel_custom": {
                "name": "homesmart-panel",
                "module_url": f"{STATIC_PATH}/{FRONTEND_FILE_NAME}?v={manifest_version}",
            }
        },
        require_admin=False,
    )

    # Register WebSocket Commands
    websocket_api.async_register_command(hass, ws_handle_config_get)
    websocket_api.async_register_command(hass, ws_handle_config_save)

    _LOGGER.info("HomeSmart integration successfully registered panel and websocket handlers.")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up HomeSmart from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    if "storage" not in hass.data[DOMAIN]:
        storage = HomeSmartStorage(hass)
        await storage.async_load()
        hass.data[DOMAIN]["storage"] = storage

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a HomeSmart config entry."""
    async_remove_panel(hass, PANEL_URL)
    if DOMAIN in hass.data:
        hass.data.pop(DOMAIN, None)
    return True


@websocket_api.websocket_command({vol.Required("type"): WS_TYPE_CONFIG_GET})
@websocket_api.async_response
async def ws_handle_config_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle get configuration WebSocket request."""
    storage: HomeSmartStorage = hass.data[DOMAIN]["storage"]
    data = await storage.async_load()
    connection.send_result(msg["id"], data)


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_CONFIG_SAVE,
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_handle_config_save(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Handle save configuration WebSocket request."""
    storage: HomeSmartStorage = hass.data[DOMAIN]["storage"]
    new_config = msg["config"]
    await storage.async_save(new_config)
    connection.send_result(msg["id"], {"success": True})
