"""Local WebSocket API for homesmart."""

import base64
import binascii
import re
import secrets
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN
from .discovery import discover_home
from .license import (
    CONTROLLABLE_DOMAINS,
    FREE_DEVICES,
    FREE_ROOMS,
    LicenseError,
    async_activate,
    async_cancel_checkout,
    async_checkout,
    async_claim,
    async_deactivate,
    async_feedback,
    async_is_pro,
    async_license_status,
    async_portal,
    async_refresh,
    async_signed_key,
)
from .notices import SIGNAL_DISMISSED, async_dismiss, async_dismissed
from .frontend import PLANS_DIR, PLANS_URL
from .storage import async_load_config, async_save_config, normalize_config

_COMMANDS_REGISTERED = "commands_registered"


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/rooms"})
@callback
def websocket_get_rooms(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the normalized Areas -> Devices -> Entities model."""
    try:
        connection.send_result(msg["id"], discover_home(hass))
    except Exception:
        connection.send_result(
            msg["id"],
            {"version": "1.3.2", "rooms": [], "counts": {"rooms": 0, "devices": 0, "entities": 0}},
        )


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/config"})
@websocket_api.async_response
async def websocket_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return local homesmart configuration."""
    try:
        connection.send_result(msg["id"], await async_load_config(hass))
    except Exception:
        from .storage import normalize_config
        connection.send_result(msg["id"], normalize_config({}))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/config/save",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def websocket_save_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Validate and persist local homesmart configuration."""
    if not await async_is_pro(hass):
        current = _free_usage(hass, await async_load_config(hass))
        wanted = _free_usage(hass, normalize_config(msg["config"]))
        # Only block changes that grow past the free limits, so a panel that was already
        # over them before an update can still be rearranged while it is being reduced.
        for key, limit in (("rooms", FREE_ROOMS), ("devices", FREE_DEVICES)):
            if wanted[key] > limit and wanted[key] > current[key]:
                connection.send_error(msg["id"], "pro_required", f"Free plan allows up to {limit} {key}")
                return
    config = await async_save_config(hass, msg["config"])
    connection.send_result(msg["id"], config)


def _free_usage(hass: HomeAssistant, config: dict[str, Any]) -> dict[str, int]:
    """Rooms in the panel and controllable devices that count toward the free plan."""
    rooms = discover_home(hass)["rooms"]
    ids = [room["id"] for room in rooms]
    # The free plan keeps its own room choice, so the full selection is intact for Pro.
    selected = (
        [room_id for room_id in config["free_rooms"] if room_id in ids]
        or [room_id for room_id in config["selected_rooms"] if room_id in ids]
        or ids
    )
    devices = config["free_devices"]
    if not devices:
        # No explicit choice yet: every controllable device of the selected rooms counts.
        devices = [
            entity["entity_id"]
            for room in rooms
            if room["id"] in selected
            for entity in room["entities"]
            if entity["domain"] in CONTROLLABLE_DOMAINS
        ]
    return {"rooms": len(selected), "devices": len(devices)}


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/license", vol.Optional("refresh", default=False): bool}
)
@websocket_api.async_response
async def websocket_license(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the plan and license status; `refresh` checks with the license server first."""
    if msg["refresh"]:
        await async_refresh(hass, force=True)
    connection.send_result(msg["id"], await async_license_status(hass))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/license/key"})
@websocket_api.async_response
async def websocket_license_key(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the signed license key, which homesmart Desktop checks itself before it opens."""
    connection.send_result(msg["id"], await async_signed_key(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/license/activate", vol.Required("key"): str}
)
@websocket_api.async_response
async def websocket_license_activate(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Activate Pro with a license key."""
    try:
        status = await async_activate(hass, msg["key"])
    except LicenseError as err:
        connection.send_error(msg["id"], str(err), "This key does not unlock Pro here")
        return
    connection.send_result(msg["id"], status)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/license/deactivate"})
@websocket_api.async_response
async def websocket_license_deactivate(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remove the license from this installation."""
    connection.send_result(msg["id"], await async_deactivate(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/license/checkout",
        vol.Required("plan"): vol.In(["lifetime", "annual"]),
        vol.Optional("locale"): str,
    }
)
@websocket_api.async_response
async def websocket_license_checkout(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Start a Stripe checkout for this installation and return its URL."""
    try:
        connection.send_result(msg["id"], await async_checkout(hass, msg["plan"], msg.get("locale")))
    except LicenseError as err:
        connection.send_error(msg["id"], str(err), "The license server could not start the checkout")


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/license/claim", vol.Optional("cancel", default=False): bool}
)
@websocket_api.async_response
async def websocket_license_claim(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Activate Pro if the pending checkout was paid, or forget it when cancelled."""
    claim = async_cancel_checkout if msg["cancel"] else async_claim
    connection.send_result(msg["id"], await claim(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/license/portal", vol.Optional("return_url"): str}
)
@websocket_api.async_response
async def websocket_license_portal(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return a Stripe customer portal link for the license on this installation."""
    try:
        connection.send_result(msg["id"], await async_portal(hass, msg.get("return_url")))
    except LicenseError as err:
        connection.send_error(msg["id"], str(err), "The license server could not open the portal")


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/feedback",
        vol.Required("email"): vol.All(str, vol.Length(max=200)),
        vol.Required("kind"): vol.In(["problem", "idea", "praise"]),
        vol.Required("message"): vol.All(str, vol.Length(min=10, max=5000)),
        vol.Optional("locale"): vol.All(str, vol.Length(max=12)),
        vol.Optional("user_agent"): vol.All(str, vol.Length(max=300)),
    }
)
@websocket_api.async_response
async def websocket_feedback(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """E-mail the Pro feedback form to homesmart support through the license server."""
    fields = {name: msg[name] for name in ("email", "kind", "message", "locale", "user_agent") if name in msg}
    try:
        connection.send_result(msg["id"], await async_feedback(hass, fields))
    except LicenseError as err:
        connection.send_error(msg["id"], str(err), "The feedback could not be sent")


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/notices/subscribe"})
@websocket_api.async_response
async def websocket_notices_subscribe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Send the dismissed notices now and again whenever a screen dismisses one."""

    @callback
    def forward(dismissed: dict[str, str]) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"dismissed": dismissed}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_DISMISSED, forward)
    connection.send_result(msg["id"])
    forward(await async_dismissed(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/notices/dismiss",
        vol.Required("entity_id"): vol.All(str, vol.Length(max=255)),
    }
)
@websocket_api.async_response
async def websocket_notices_dismiss(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Hide a header notice on every screen until its entity changes again."""
    connection.send_result(msg["id"], {"dismissed": await async_dismiss(hass, msg["entity_id"])})


_PLAN_MAX_BYTES = 8 * 1024 * 1024
_PLAN_TYPES = ((b"\x89PNG\r\n\x1a\n", "png"), (b"\xff\xd8\xff", "jpg"))


def _plan_type(data: bytes) -> str | None:
    """PNG, JPEG or WebP, told by the file's first bytes (never by what the browser says)."""
    for magic, extension in _PLAN_TYPES:
        if data.startswith(magic):
            return extension
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/floorplan/upload",
        vol.Required("floor"): vol.All(str, vol.Length(min=1, max=64)),
        vol.Required("data"): str,
    }
)
@websocket_api.async_response
async def websocket_floorplan_upload(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save a floor's plan image (Pro, administrators) and return the address it is served from."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Only administrators can change the floor plan")
        return
    if not await async_is_pro(hass):
        connection.send_error(msg["id"], "pro_required", "The floor plan is a Pro feature")
        return
    raw = msg["data"].split(",", 1)[1] if msg["data"].startswith("data:") else msg["data"]
    try:
        data = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        connection.send_error(msg["id"], "invalid_image", "The image could not be read")
        return
    extension = _plan_type(data)
    if extension is None or len(data) > _PLAN_MAX_BYTES:
        connection.send_error(msg["id"], "invalid_image", "Send a PNG, JPEG or WebP image up to 8 MB")
        return
    floor = re.sub(r"[^a-z0-9_-]", "-", msg["floor"].lower())[:40] or "home"
    name = f"floorplan-{floor}-{secrets.token_hex(6)}.{extension}"
    folder = Path(hass.config.path(*PLANS_DIR))

    def write() -> None:
        folder.mkdir(parents=True, exist_ok=True)
        # One image per floor: the previous one goes when a new one arrives.
        for old in folder.glob(f"floorplan-{floor}-*"):
            old.unlink(missing_ok=True)
        (folder / name).write_bytes(data)

    await hass.async_add_executor_job(write)
    connection.send_result(msg["id"], {"url": f"{PLANS_URL}/{name}"})


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register homesmart commands once per Home Assistant process."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(_COMMANDS_REGISTERED):
        return

    websocket_api.async_register_command(hass, websocket_get_rooms)
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_save_config)
    websocket_api.async_register_command(hass, websocket_license)
    websocket_api.async_register_command(hass, websocket_license_key)
    websocket_api.async_register_command(hass, websocket_license_activate)
    websocket_api.async_register_command(hass, websocket_license_deactivate)
    websocket_api.async_register_command(hass, websocket_license_checkout)
    websocket_api.async_register_command(hass, websocket_license_claim)
    websocket_api.async_register_command(hass, websocket_license_portal)
    websocket_api.async_register_command(hass, websocket_feedback)
    websocket_api.async_register_command(hass, websocket_notices_subscribe)
    websocket_api.async_register_command(hass, websocket_notices_dismiss)
    websocket_api.async_register_command(hass, websocket_floorplan_upload)
    domain_data[_COMMANDS_REGISTERED] = True
