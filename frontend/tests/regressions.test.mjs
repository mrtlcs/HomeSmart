import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, ws: false },
});
after(() => server.close());
const { calculateElectricityCost, energyKwh, validTariff } = await server.ssrLoadModule("/src/components/ExtraWidgets.tsx");
const { discoverVacuumDevice } = await server.ssrLoadModule("/src/components/DreameVacuum.tsx");
const { computeHomeInsights } = await server.ssrLoadModule("/src/components/AIInsightsCard.tsx");

const { isQuietHour, resolveScreenProfile, screenOptions } = await server.ssrLoadModule("/src/screenProfiles.ts");
const { nextDirectionalItem } = await server.ssrLoadModule("/src/dashboardNavigation.ts");
const { captureLayout, layoutChanged } = await server.ssrLoadModule("/src/layoutHistory.ts");


const flat = { mode: "flat", flat_rate: 0.16, currency: "$", fixed_monthly_fee: 10, include_vat: false };
const tiered = { ...flat, mode: "tiered", fixed_monthly_fee: 0, tiers: [{ max: 100, rate: 1 }, { max: null, rate: 2 }] };

test("flat-rate bills retain cents and include the fixed charge at zero usage", () => {
  assert.equal(calculateElectricityCost(12, flat).totalCost, 11.92);
  assert.equal(calculateElectricityCost(0, flat).totalCost, 10);
});

test("tiered bills charge the correct amounts at and beyond a tier limit", () => {
  assert.equal(calculateElectricityCost(100, tiered).totalCost, 100);
  assert.equal(calculateElectricityCost(120, tiered).totalCost, 140);
  assert.deepEqual(calculateElectricityCost(120, tiered).breakdown.map((row) => row.kwhUsed), [100, 20]);
});

test("malformed tiers are rejected and legacy invalid data cannot produce negative usage", () => {
  const invalid = { ...tiered, tiers: [{ max: 100, rate: 1 }, { max: 50, rate: 2 }, { max: null, rate: 3 }] };
  assert.equal(validTariff(invalid), false);
  assert.equal(validTariff({ ...tiered, tiers: [{ max: 100, rate: 1 }] }), false);
  const breakdown = calculateElectricityCost(120, invalid).breakdown;
  assert.ok(breakdown.every((row) => row.kwhUsed >= 0));
  assert.equal(breakdown.reduce((total, row) => total + row.kwhUsed, 0), 120);
});

test("the billing meter uses energy units and rejects unavailable or power readings", () => {
  assert.equal(energyKwh({ state: "12000", attributes: { unit_of_measurement: "Wh" } }), 12);
  assert.equal(energyKwh({ state: "0", attributes: { unit_of_measurement: "kWh" } }), 0);
  assert.equal(energyKwh({ state: "1.5", attributes: { unit_of_measurement: "MWh" } }), 1500);
  assert.equal(energyKwh({ state: "unavailable", attributes: { unit_of_measurement: "kWh" } }), null);
  assert.equal(energyKwh({ state: "120", attributes: { unit_of_measurement: "W" } }), null);
});

test("similar robot names do not override verified device associations", () => {
  const states = {
    "vacuum.robot": { attributes: {} },
    "sensor.robot_pro_battery": { state: "12" },
    "sensor.robot_battery": { state: "95" },
  };
  const entities = {
    "vacuum.robot": { device_id: "robot" },
    "sensor.robot_pro_battery": { device_id: "robot-pro" },
    "sensor.robot_battery": { device_id: "robot" },
  };
  assert.equal(discoverVacuumDevice({ states, entities }, "vacuum.robot").batteryId, "sensor.robot_battery");
});

test("an open window alerts only while the HVAC is actively conditioning", () => {
  const home = { rooms: [{ id: "living", name: "Living", entities: [
    { domain: "climate", entity_id: "climate.living" },
    { domain: "binary_sensor", entity_id: "binary_sensor.window" },
  ] }] };
  const states = {
    "climate.living": { state: "cool", attributes: { hvac_action: "idle" } },
    "binary_sensor.window": { state: "on", attributes: { device_class: "window" } },
  };
  assert.equal(computeHomeInsights({}, home, { states }, "en", (key) => key).length, 0);
  states["climate.living"].attributes.hvac_action = "cooling";
  assert.equal(computeHomeInsights({}, home, { states }, "en", (key) => key).length, 1);
});


test("the active profile follows device, account and home precedence and preserves legacy layouts", () => {
  const shared = { default: "auto", users: { a: "tv" }, options: {} };
  assert.equal(resolveScreenProfile("", "a", undefined, 390, true), "classic");
  assert.equal(resolveScreenProfile("wall", "a", shared, 390, true), "wall");
  assert.equal(resolveScreenProfile("", "a", shared, 390, true), "tv");
  assert.equal(resolveScreenProfile("", "b", shared, 390, true), "phone");
  assert.equal(resolveScreenProfile("", "b", shared, 900, true), "wall");
  assert.equal(resolveScreenProfile("", "b", shared, 900, false), "desktop");
});

test("wall standby defaults are independent and quiet hours work across midnight", () => {
  assert.equal(screenOptions("phone").idle, 0);
  assert.equal(screenOptions("wall").idle, 90);
  assert.equal(isQuietHour(23, 22, 7), true);
  assert.equal(isQuietHour(6, 22, 7), true);
  assert.equal(isQuietHour(7, 22, 7), false);
  assert.equal(isQuietHour(18, 0, 0), false);
});

test("remote navigation follows the nearest target in the requested direction", () => {
  const options = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 80, y: 90 }, { x: 0, y: 104 }];
  assert.equal(nextDirectionalItem(options[0], options, "ArrowRight"), 1);
  assert.equal(nextDirectionalItem(options[0], options, "ArrowDown"), 3);
  assert.equal(nextDirectionalItem(options[1], options, "ArrowRight"), -1);
  assert.equal(nextDirectionalItem(options[1], options, "ArrowLeft"), 0);
});

test("layout snapshots preserve tabs and navigation without restoring unrelated system settings", () => {
  const original = { pages: [{ id: "energy" }], layouts: { "page:energy": { order: ["widget:energy"] } }, navigation: { order: ["energy"] }, accent_color: "#fff" };
  assert.equal(layoutChanged(original, { ...original, accent_color: "#000" }), false);
  assert.equal(layoutChanged(original, { ...original, pages: [] }), true);
  assert.deepEqual(Object.keys(captureLayout(original)).sort(), ["layouts", "navigation", "pages"]);
});
