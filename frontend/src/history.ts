import { createContext, useContext, useEffect, useState } from "react";
import type { HomeAssistant } from "./types/home-assistant";

// A sensor's recent values from Home Assistant's recorder, for the charts in details,
// energy, and customizable sensor cards. Concurrent requests for the same window are
// coalesced into a single WebSocket call and cached in memory to avoid mobile lag.

export type HistoryPoint = { t: number; v: number };

const CACHE_TTL_MS = 120_000;
const BATCH_DELAY_MS = 40;

function maxPointsForViewport(): number {
  return typeof window !== "undefined" && window.innerWidth <= 720 ? 96 : 240;
}

interface Compressed { s?: string; lu?: number; lc?: number }

const historyCache = new Map<string, { at: number; points: HistoryPoint[] }>();

interface PendingBatch {
  entityIds: Set<string>;
  waiters: Map<string, Array<{ resolve: (pts: HistoryPoint[]) => void; reject: (err: unknown) => void }>>;
  timer: number;
}

const pendingBatches = new Map<string, PendingBatch>();

function parseSeries(raw: Compressed[] | undefined): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (const item of raw ?? []) {
    const value = Number.parseFloat(String(item.s));
    const time = (item.lu ?? item.lc ?? 0) * 1000;
    if (Number.isFinite(value) && time > 0) points.push({ t: time, v: value });
  }
  return thin(points, maxPointsForViewport());
}

export function loadHistory(hass: HomeAssistant, entityId: string, hours: number): Promise<HistoryPoint[]> {
  const cacheKey = `${entityId}:${hours}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Promise.resolve(cached.points);
  }

  return new Promise<HistoryPoint[]>((resolve, reject) => {
    const batchKey = String(hours);
    let batch = pendingBatches.get(batchKey);
    if (!batch) {
      batch = {
        entityIds: new Set(),
        waiters: new Map(),
        timer: window.setTimeout(() => {
          pendingBatches.delete(batchKey);
          const ids = [...batch!.entityIds];
          const start = new Date(Date.now() - hours * 3_600_000).toISOString();
          void hass.connection
            .sendMessagePromise<Record<string, Compressed[]>>({
              type: "history/history_during_period",
              start_time: start,
              entity_ids: ids,
              minimal_response: true,
              no_attributes: true,
              significant_changes_only: false,
            })
            .then((result) => {
              const now = Date.now();
              for (const id of ids) {
                const points = parseSeries(result?.[id]);
                historyCache.set(`${id}:${hours}`, { at: now, points });
                for (const w of batch!.waiters.get(id) ?? []) w.resolve(points);
              }
            })
            .catch((err) => {
              for (const id of ids) {
                for (const w of batch!.waiters.get(id) ?? []) w.reject(err);
              }
            });
        }, BATCH_DELAY_MS),
      };
      pendingBatches.set(batchKey, batch);
    }
    batch.entityIds.add(entityId);
    const list = batch.waiters.get(entityId) ?? [];
    list.push({ resolve, reject });
    batch.waiters.set(entityId, list);
  });
}

/** Keeps the shape of a long series: the minimum and maximum of each bucket. */
function thin(points: HistoryPoint[], maxPoints: number): HistoryPoint[] {
  if (points.length <= maxPoints) return points;
  const size = Math.ceil(points.length / (maxPoints / 2));
  const result: HistoryPoint[] = [];
  for (let index = 0; index < points.length; index += size) {
    const bucket = points.slice(index, index + size);
    const low = bucket.reduce((a, b) => (b.v < a.v ? b : a));
    const high = bucket.reduce((a, b) => (b.v > a.v ? b : a));
    result.push(...(low.t <= high.t ? [low, high] : [high, low]));
  }
  return result;
}

/** The series for a sensor, reloaded when the range changes and every 5 minutes. null while loading. */
export function useHistory(hass: HomeAssistant, entityId: string | undefined, hours: number): HistoryPoint[] | null {
  const [points, setPoints] = useState<HistoryPoint[] | null>(() => {
    if (!entityId) return [];
    const cached = historyCache.get(`${entityId}:${hours}`);
    return cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.points : null;
  });
  useEffect(() => {
    if (!entityId) { setPoints([]); return; }
    let cancelled = false;
    const cached = historyCache.get(`${entityId}:${hours}`);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setPoints(cached.points);
    } else {
      setPoints(null);
    }
    const load = () => void loadHistory(hass, entityId, hours).then((data) => { if (!cancelled) setPoints(data); }).catch(() => { if (!cancelled) setPoints([]); });
    load();
    const timer = window.setInterval(load, 5 * 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [entityId, hours, hass.connection]);
  return points;
}

/** Whether double and large sensor cards draw their last 24 hours (Settings → Card style). */
export const SparklinesContext = createContext(false);
export const useSparklines = () => useContext(SparklinesContext);
/** Sensor cards at 1x and ½x also show how long ago they changed (Settings → Cards). */
export const SensorSinceContext = createContext(false);
export const useSensorSince = () => useContext(SensorSinceContext);
/** The lights button on room cards (on unless turned off in Settings → Cards). */
export const RoomPowerContext = createContext(true);
export const useRoomPower = () => useContext(RoomPowerContext);

export function isNumericState(state?: { state: string }): boolean {
  return Boolean(state && Number.isFinite(Number.parseFloat(state.state)) && !/^\d{4}-\d{2}-\d{2}/.test(state.state));
}
