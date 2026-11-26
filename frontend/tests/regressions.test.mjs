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
