"""Storage helper for HomeSmart integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DEFAULT_CONFIG, DOMAIN, STORAGE_KEY, STORAGE_VERSION

_LOGGER = logging.getLogger(__name__)


class HomeSmartStorage:
    """Class to manage HomeSmart configuration stored in .storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the storage helper."""
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = dict(DEFAULT_CONFIG)

    async def async_load(self) -> dict[str, Any]:
        """Load stored HomeSmart configuration."""
        try:
            stored = await self._store.async_load()
            if stored and isinstance(stored, dict):
                # Deep merge defaults with stored data to ensure newly added keys are present
                merged = dict(DEFAULT_CONFIG)
                merged.update(stored)
                # Auto-migrate legacy layout from v1.0.0 ('auto' or 'sidebar') to 'deck' (HomeDeck Pro style)
                if merged.get("layout") in ("auto", "sidebar", None):
                    merged["layout"] = DEFAULT_CONFIG["layout"]
                if "screensaver" in stored and isinstance(stored["screensaver"], dict):
                    merged_screensaver = dict(DEFAULT_CONFIG["screensaver"])
                    merged_screensaver.update(stored["screensaver"])
                    merged["screensaver"] = merged_screensaver
                self._data = merged
            else:
                self._data = dict(DEFAULT_CONFIG)
                await self.async_save(self._data)
        except Exception as exc:  # pylint: disable=broad-except
            _LOGGER.warning("Failed to load HomeSmart storage, using defaults: %s", exc)
            self._data = dict(DEFAULT_CONFIG)

        return self._data

    async def async_save(self, data: dict[str, Any]) -> None:
        """Save HomeSmart configuration."""
        if not isinstance(data, dict):
            _LOGGER.error("Invalid data provided to HomeSmart storage: %s", type(data))
            return
        self._data = data
        await self._store.async_save(data)

    @property
    def data(self) -> dict[str, Any]:
        """Return cached config data."""
        return self._data
