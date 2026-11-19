"""Register the HomeSmart frontend panel."""

import hashlib
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    PANEL_ELEMENT,
    PANEL_ICON,
    PANEL_PATH,
    PANEL_TITLE,
    PANEL_URL,
    VERSION,
)

_STATIC_REGISTERED = "static_registered"
PLANS_URL = "/homesmart_plans"
PLANS_DIR = ("homesmart", "plans")
_PANELS = "frontend_panels"


def _bundle_tag(bundle: Path) -> str:
    """A short fingerprint of the panel bundle, so browsers fetch it again whenever it changes."""
    try:
        return hashlib.sha256(bundle.read_bytes()).hexdigest()[:10]
    except OSError:
        return ""


def _panel_exists(hass: HomeAssistant) -> bool:
    """Check if panel is already registered."""
    exists = getattr(frontend, "async_panel_exists", None)
    if exists is not None:
        return exists(hass, PANEL_PATH)
    return PANEL_PATH in hass.data.get(_PANELS, {})


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register HomeSmart static assets and sidebar panel."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    frontend_dir = Path(__file__).parent / "frontend"

    if not domain_data.get(_STATIC_REGISTERED):
        plans_dir = Path(hass.config.path(*PLANS_DIR))
        await hass.async_add_executor_job(lambda: plans_dir.mkdir(parents=True, exist_ok=True))
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(PANEL_URL, str(frontend_dir), cache_headers=False),
                StaticPathConfig(PLANS_URL, str(plans_dir), cache_headers=False),
            ]
        )
        domain_data[_STATIC_REGISTERED] = True

    if _panel_exists(hass):
        frontend.async_remove_panel(hass, PANEL_PATH)

    tag = await hass.async_add_executor_job(_bundle_tag, frontend_dir / "homesmart-panel.js")
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name=PANEL_ELEMENT,
        module_url=f"{PANEL_URL}/homesmart-panel.js?v={VERSION}" + (f"-{tag}" if tag else ""),
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=False,
        embed_iframe=False,
        config={"version": VERSION},
    )


def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Remove the HomeSmart panel while keeping its static route."""
    if _panel_exists(hass):
        frontend.async_remove_panel(hass, PANEL_PATH)
