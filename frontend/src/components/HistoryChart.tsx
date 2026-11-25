import { hourOptions } from "../clock";
import { useId, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { safeIntlLocale, type TranslationKey } from "../i18n";
import { useHistory, type HistoryPoint } from "../history";
import type { HomeAssistant } from "../types/home-assistant";

const RANGES = [6, 24, 168] as const;
const WIDTH = 320;
const HEIGHT = 120;
const PAD = 6;
const BAR_BINS = 16;

/** Downsamples points into evenly spaced buckets for smooth curve rendering without micro-jitter. */
function sampleSmooth(points: HistoryPoint[], maxBuckets = 32): HistoryPoint[] {
  if (points.length <= maxBuckets) return points;
  const step = (points.length - 1) / (maxBuckets - 1);
  const out: HistoryPoint[] = [];
  for (let i = 0; i < maxBuckets; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

/** Smooth midpoint quadratic Bezier path matching modern mini-graph-card / ApexCharts aesthetics. */
function buildSmoothPath(coords: Array<{ cx: number; cy: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M${coords[0].cx.toFixed(1)},${coords[0].cy.toFixed(1)}H${WIDTH - PAD}`;
  let d = `M${coords[0].cx.toFixed(1)},${coords[0].cy.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const midX = ((p0.cx + p1.cx) / 2).toFixed(1);
    const midY = ((p0.cy + p1.cy) / 2).toFixed(1);
    if (i === 0) {
      d += `L${midX},${midY}`;
    } else {
      d += `Q${p0.cx.toFixed(1)},${p0.cy.toFixed(1)} ${midX},${midY}`;
    }
  }
  const last = coords[coords.length - 1];
  d += `T${last.cx.toFixed(1)},${last.cy.toFixed(1)}`;
  return d;
}

/** A sensor's history in its details: a line with its area, the range (6 h, 24 h, 7 days), the
 * lowest and highest value, and the value under the finger. */
export function HistoryChart({ entityId, hass, language, t, unit }: { entityId: string; hass: HomeAssistant; language?: string; t: (key: TranslationKey) => string; unit?: string }) {
  const [hours, setHours] = useState<number>(24);
  const points = useHistory(hass, entityId, hours);
  return <div className="hd-history">
    <div className="hd-history__head">
      <span className="eyebrow">{t("history")}</span>
      <div className="hd-history__ranges" role="group" aria-label={t("history")}>
        {RANGES.map((range) => <button aria-pressed={hours === range} key={range} onClick={() => setHours(range)} type="button">{range === 168 ? t("range7d") : `${range} h`}</button>)}
      </div>
    </div>
    {points == null ? <div className="hd-history__empty"><span className="mini-spinner" /></div>
      : points.length < 2 ? <p className="hd-history__empty">{t("noHistory")}</p>
        : <Sparkline hours={hours} language={language} points={points} unit={unit} />}
  </div>;
}

export function Sparkline({
  color,
  compact = false,
  hours,
  language,
  points,
  showBounds = false,
  unit,
  variant = "step",
}: {
  color?: string;
  compact?: boolean;
  hours: number;
  language?: string;
  points: HistoryPoint[];
  showBounds?: boolean;
  unit?: string;
  variant?: "step" | "smooth" | "bar";
}) {
  const gradient = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HistoryPoint | null>(null);
  const end = Date.now();
  const start = end - hours * 3_600_000;

  const { path, area, bars, low, high, x, y } = useMemo(() => {
    const values = points.map((point) => point.v);
    let lowVal = Math.min(...values);
    let highVal = Math.max(...values);
    if (highVal - lowVal < 1e-9) { lowVal -= 1; highVal += 1; }
    const xFn = (time: number) => PAD + ((Math.max(start, time) - start) / (end - start)) * (WIDTH - PAD * 2);
    const yFn = (value: number) => PAD + (1 - (value - lowVal) / (highVal - lowVal)) * (HEIGHT - PAD * 2);

    if (variant === "bar") {
      const span = end - start;
      const binSize = span / BAR_BINS;
      const buckets: number[][] = Array.from({ length: BAR_BINS }, () => []);
      for (const p of points) {
        const idx = Math.min(BAR_BINS - 1, Math.max(0, Math.floor((p.t - start) / binSize)));
        buckets[idx].push(p.v);
      }
      const usableWidth = WIDTH - PAD * 2;
      const gap = 4;
      const barWidth = Math.max(4, usableWidth / BAR_BINS - gap);
      let lastKnown = points[0]?.v ?? lowVal;
      const computedBars = buckets.map((vals, i) => {
        const val = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : lastKnown;
        if (vals.length > 0) lastKnown = val;
        const barTop = Math.min(HEIGHT - 12, yFn(val));
        const barHeight = Math.max(6, HEIGHT - PAD - barTop);
        return {
          x: PAD + i * (usableWidth / BAR_BINS) + gap / 2,
          y: barTop,
          w: barWidth,
          h: barHeight,
          active: vals.length > 0,
        };
      });
      return { path: "", area: "", bars: computedBars, low: Math.min(...values), high: Math.max(...values), x: xFn, y: yFn };
    }

    if (variant === "smooth") {
      const sampled = sampleSmooth(points);
      const coords = sampled.map((p) => ({ cx: xFn(p.t), cy: yFn(p.v) }));
      const linePath = buildSmoothPath(coords);
      const firstX = coords[0]?.cx.toFixed(1) ?? String(PAD);
      const lastX = coords[coords.length - 1]?.cx.toFixed(1) ?? String(WIDTH - PAD);
      const areaPath = `${linePath}L${lastX},${HEIGHT}L${firstX},${HEIGHT}Z`;
      return { path: linePath, area: areaPath, bars: [], low: Math.min(...values), high: Math.max(...values), x: xFn, y: yFn };
    }

    // Default step curve
    let linePath = "";
    points.forEach((point, index) => {
      linePath += index === 0 ? `M${xFn(point.t).toFixed(1)},${yFn(point.v).toFixed(1)}` : `H${xFn(point.t).toFixed(1)}V${yFn(point.v).toFixed(1)}`;
    });
    linePath += `H${xFn(end).toFixed(1)}`;
    const areaPath = `${linePath}V${HEIGHT}H${xFn(points[0].t).toFixed(1)}Z`;
    return { path: linePath, area: areaPath, bars: [], low: Math.min(...values), high: Math.max(...values), x: xFn, y: yFn };
  }, [points, hours, variant]);

  const loc = safeIntlLocale(language);
  const format = (value: number) => `${new Intl.NumberFormat(loc, { maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1 }).format(value)}${unit ? ` ${unit}` : ""}`;
  const when = (time: number) => new Intl.DateTimeFormat(loc, hours > 24 ? { ...hourOptions(), weekday: "short", hour: "2-digit", minute: "2-digit" } : { ...hourOptions(), hour: "2-digit", minute: "2-digit" }).format(time);
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return;
    const time = start + ((event.clientX - box.left) / box.width) * (end - start);
    let found = points[0];
    for (const point of points) { if (point.t <= time) found = point; else break; }
    setHover(found);
  };

  return <figure className={compact ? "hd-spark hd-spark--compact" : "hd-spark"} style={color ? { color } : undefined}>
    {showBounds && (
      <div className="hd-spark__bounds">
        <span>{new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(high)}</span>
        <span>{new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(low)}</span>
      </div>
    )}
    <svg aria-hidden="true" onPointerDown={pick} onPointerLeave={() => setHover(null)} onPointerMove={pick} preserveAspectRatio="none" ref={svg} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity={variant === "bar" ? ".85" : ".38"} />
          <stop offset="1" stopColor="currentColor" stopOpacity={variant === "bar" ? ".28" : "0"} />
        </linearGradient>
      </defs>
      {variant === "bar" ? (
        bars.map((b, idx) => (
          <rect
            key={idx}
            fill={`url(#${gradient})`}
            height={b.h}
            opacity={b.active ? 0.95 : 0.45}
            rx="3"
            width={b.w}
            x={b.x}
            y={b.y}
          />
        ))
      ) : (
        <>
          <path d={area} fill={`url(#${gradient})`} />
          <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={variant === "smooth" ? "2.6" : "2"} vectorEffect="non-scaling-stroke" />
        </>
      )}
      {hover && <><line stroke="currentColor" strokeOpacity=".4" vectorEffect="non-scaling-stroke" x1={x(hover.t)} x2={x(hover.t)} y1={0} y2={HEIGHT} /><circle cx={x(hover.t)} cy={y(hover.v)} fill="currentColor" r="3.5" /></>}
    </svg>
    {!compact && <figcaption>
      {hover ? <span className="hd-spark__hover"><b>{format(hover.v)}</b> · {when(hover.t)}</span>
        : <span><i>↓ {format(low)}</i><i>↑ {format(high)}</i></span>}
    </figcaption>}
  </figure>;
}
