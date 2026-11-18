/**
 * HomeSmart - Multi-Screen Viewport Math & Layout Controller
 */

import { DeviceViewport, LayoutMode } from '../types';

export interface ViewportMetrics {
  width: number;
  height: number;
  device: DeviceViewport;
  gridColumns: number;
  isTouch: boolean;
  isTV: boolean;
}

/**
 * Determine current viewport metrics
 */
export function calculateViewportMetrics(
  forcedLayout: LayoutMode = 'auto',
  customWidth?: number,
  customHeight?: number
): ViewportMetrics {
  const width = customWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const height = customHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800);

  // Detect TV mode from User-Agent or forced layout
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAndroidTV =
    userAgent.includes('android tv') ||
    userAgent.includes('smart-tv') ||
    userAgent.includes('googletv') ||
    userAgent.includes('crkey') ||
    userAgent.includes('hbbtv') ||
    userAgent.includes('tizen');

  const isTV = forcedLayout === 'tv' || isAndroidTV;

  let device: DeviceViewport;
  let gridColumns: number;

  if (isTV) {
    device = 'tv';
    gridColumns = 4; // 10-foot UI optimal 4 columns
  } else if (width < 768) {
    device = 'phone';
    gridColumns = 2; // 2 columns for smartphones
  } else if (width < 1440) {
    device = 'tablet';
    gridColumns = 4; // 4 columns for tablets
  } else {
    device = 'desktop';
    gridColumns = 6; // 6 columns for large command center monitors
  }

  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    width,
    height,
    device,
    gridColumns,
    isTouch,
    isTV,
  };
}

/**
 * Resolve effective layout mode based on user setting and viewport
 */
export function resolveEffectiveLayout(
  configuredLayout: LayoutMode,
  metrics: ViewportMetrics
): LayoutMode {
  if (configuredLayout && configuredLayout !== 'auto') {
    return configuredLayout;
  }

  // When 'auto' is selected, choose HomeDeck Pro deck layout by default
  if (metrics.isTV) {
    return 'tv';
  }
  return 'deck';
}
