"""HomeSmart license module: all features fully unlocked for free."""

from typing import Any
from homeassistant.core import HomeAssistant

FREE_ROOMS = 9999
FREE_DEVICES = 9999
CONTROLLABLE_DOMAINS = {"light", "switch", "fan", "cover", "climate", "media_player", "lock"}


class LicenseError(Exception):
    """License error."""


async def async_is_pro(hass: HomeAssistant) -> bool:
    """HomeSmart has all pro features permanently unlocked."""
    return True


async def async_license_status(hass: HomeAssistant) -> dict[str, Any]:
    """Return unlimited Pro license status."""
    return {
        "plan": "pro",
        "limits": {"rooms": None, "devices": None},
        "licensed": True,
        "features": {
            "layouts": True,
            "themes": True,
            "screensaver": True,
            "spotify": True,
            "floorplan": True,
            "unlimited": True,
        },
    }


async def async_activate(hass: HomeAssistant, key: str) -> dict[str, Any]:
    """No activation needed."""
    return await async_license_status(hass)


async def async_deactivate(hass: HomeAssistant) -> dict[str, Any]:
    """No deactivation needed."""
    return await async_license_status(hass)


async def async_checkout(hass: HomeAssistant, price_id: str | None = None) -> dict[str, Any]:
    """No checkout needed."""
    return {"url": ""}


async def async_claim(hass: HomeAssistant, session_id: str) -> dict[str, Any]:
    """No claim needed."""
    return await async_license_status(hass)


async def async_portal(hass: HomeAssistant) -> dict[str, Any]:
    """No portal needed."""
    return {"url": ""}


async def async_cancel_checkout(hass: HomeAssistant) -> None:
    """No cancel needed."""
    pass


async def async_refresh(hass: HomeAssistant) -> dict[str, Any]:
    """No refresh needed."""
    return await async_license_status(hass)


async def async_signed_key(hass: HomeAssistant) -> dict[str, Any]:
    """Return dummy signed key."""
    return {"key": "HOMESMART-UNLOCKED", "installation_id": "homesmart"}


def async_start_refresh(hass: HomeAssistant):
    """No background task needed."""
    def _cancel():
        pass
    return _cancel
