/**
 * HomeSmart - Main Dashboard Panel Custom Element <homesmart-panel>
 * Inspired by Steam Deck / Console UI and HomeDeck Pro
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  CardSize,
  DiscoveredArea,
  DiscoveredEntity,
  DockTabId,
  HomeAssistant,
  HomeSmartConfig,
  LayoutMode,
  LocaleId,
  ProtectedCardConfig,
  ThemeId,
} from './types';
import { t } from './locales/i18n';
import { themeStyles } from './themes/themes.css';
import { computeAreaSummary, runAutoDiscovery } from './engine/auto-discovery';
import { calculateViewportMetrics, resolveEffectiveLayout, ViewportMetrics } from './engine/responsive-layout';
import { DPadNavigator } from './engine/dpad-navigation';
import { renderIcon } from './components/icons';

// Import child components
import './components/hero-header';
import './components/deck-room-card';
import './components/deck-security-card';
import './components/deck-device-card';
import './components/floating-dock';
import './components/room-detail-sheet';
import './components/sidebar-nav';
import './components/card-1x1';
import './components/card-2x1-slider';
import './components/card-2x2-climate';
import './components/card-2x2-media-cam';
import './components/visual-editor-bar';
import './components/confirm-dialog';
import './components/oled-screensaver';
import './components/squircle-device-card';
import './components/weather-modal';

const DEFAULT_CONFIG: HomeSmartConfig = {
  version: 1,
  theme: 'midnight',
  layout: 'deck',
  locale: 'vi',
  screensaver: {
    enabled: true,
    timeout_seconds: 180,
    show_clock: true,
    show_weather: true,
    pixel_shift: true,
  },
  custom_cards: {},
  hidden_entities: [],
  protected_entities: {},
  area_order: [],
};

@customElement('homesmart-panel')
export class HomeSmartPanel extends LitElement {
  private _hass!: HomeAssistant;

  @property({ attribute: false })
  set hass(val: HomeAssistant) {
    const oldVal = this._hass;
    this._hass = val;
    this.requestUpdate('hass', oldVal);
    if (!oldVal && val) {
      this.loadConfigFromHass();
    }
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  @state() private config: HomeSmartConfig = { ...DEFAULT_CONFIG };
  @state() private currentDockTab: DockTabId = 'home';
  @state() private selectedAreaId: string = '';
  @state() private selectedDetailArea: DiscoveredArea | null = null;
  @state() private roomDetailOpen = false;
  @state() private editMode = false;
  @state() private showHidden = false;
  @state() private viewport: ViewportMetrics = calculateViewportMetrics();
  @state() private screensaverActive = false;
  @state() private weatherModalOpen = false;

  // Protected card modal state
  @state() private confirmModalOpen = false;
  @state() private pendingProtectedAction: (() => void) | null = null;
  @state() private protectedModalEntityName = '';
  @state() private protectedModalEntityIcon = 'mdi:shield-check';
  @state() private protectedModalConfig: ProtectedCardConfig = { type: 'confirm' };

  private dpadNavigator: DPadNavigator | null = null;
  private resizeHandler: () => void = () => {};
  private idleTimer: number | null = null;
  private userActivityHandler: () => void = () => {};

  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
        width: 100%;
        min-height: 100vh;
        background: #000;
        box-sizing: border-box;
      }

      .app-layout {
        display: flex;
        width: 100%;
        min-height: 100vh;
        box-sizing: border-box;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding-bottom: 96px; /* Space for floating bottom dock */
        box-sizing: border-box;
        overflow-y: auto;
      }

      .main-content.sidebar-layout {
        padding: 24px;
        padding-bottom: 40px;
      }

      /* HomeDeck Pro Deck Cards Container */
      .deck-scroll-container {
        display: flex;
        align-items: stretch;
        gap: 16px;
        padding: 12px 32px 32px;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }

      .deck-card-wrapper {
        flex: 0 0 168px;
        height: 290px;
        scroll-snap-align: start;
      }

      @media (max-width: 768px) {
        .deck-scroll-container {
          padding: 8px 16px 24px;
          gap: 12px;
        }
        .deck-card-wrapper {
          flex: 0 0 148px;
          height: 260px;
        }
      }

      /* Grid of categories / rooms view */
      .tab-view-container {
        padding: 8px 32px 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      @media (max-width: 768px) {
        .tab-view-container {
          padding: 8px 16px 24px;
        }
      }

      .section-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 800;
        color: #ffffff;
        font-family: var(--hs-font-display, sans-serif);
        margin: 0;
      }

      /* Area Title Bar */
      .area-title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .area-heading {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .area-title-text {
        font-size: 24px;
        font-weight: 800;
        color: #ffffff;
        font-family: var(--hs-font-display, sans-serif);
      }

      .area-count-chip {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 3px 10px;
        font-size: 12px;
        font-weight: 600;
        color: var(--hs-text-secondary, rgba(255, 255, 255, 0.8));
      }

      /* Bento Grid Foundation */
      .bento-grid {
        display: grid;
        grid-template-columns: repeat(var(--hs-columns, 4), 1fr);
        grid-auto-rows: minmax(130px, auto);
        gap: 18px;
        width: 100%;
        box-sizing: border-box;
      }

      /* Bento Card Span Rules */
      .card-item.size-1x1 {
        grid-column: span 1;
        grid-row: span 1;
      }

      .card-item.size-2x1 {
        grid-column: span 2;
        grid-row: span 1;
      }

      .card-item.size-2x2 {
        grid-column: span 2;
        grid-row: span 2;
      }

      /* Phone Viewport adjustments */
      .phone .bento-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .phone .card-item.size-2x1,
      .phone .card-item.size-2x2 {
        grid-column: span 2;
      }

      .grid-area-section {
        margin-bottom: 36px;
      }

      .empty-notice {
        padding: 40px 20px;
        text-align: center;
        color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
        font-size: 15px;
      }

      /* HomeDeck Pro Rooms View: Two-Column Sidebar & Grid */
      .rooms-workspace {
        display: flex;
        width: 100%;
        min-height: calc(100vh - 120px);
        padding: 16px 32px 32px;
        gap: 36px;
        box-sizing: border-box;
      }

      .rooms-sidebar {
        width: 220px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .sidebar-clock-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .sidebar-date {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.8px;
        color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
        text-transform: uppercase;
        font-family: var(--hs-font-display, sans-serif);
      }

      .sidebar-clock-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sidebar-clock {
        font-size: clamp(34px, 4vw, 44px);
        font-weight: 800;
        color: #ffffff;
        line-height: 1;
        letter-spacing: -1.5px;
        font-family: var(--hs-font-display, sans-serif);
      }

      .sidebar-dot {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: var(--hs-accent, #38bdf8);
      }

      .rooms-nav-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .room-pill-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-radius: 99px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        text-align: left;
        outline: none;
      }

      .room-pill-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
        transform: translateX(2px);
      }

      .room-pill-btn.active {
        background: #ffffff;
        color: #111418;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      }

      .room-pill-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .room-pill-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .room-pill-badge {
        background: rgba(255, 255, 255, 0.18);
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 99px;
      }

      .room-pill-btn.active .room-pill-badge {
        background: #111418;
        color: #ffffff;
      }

      .rooms-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .rooms-main-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .rooms-eyebrow {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
        font-family: var(--hs-font-display, sans-serif);
      }

      .rooms-title {
        font-size: clamp(26px, 3.2vw, 36px);
        font-weight: 800;
        color: #ffffff;
        font-family: var(--hs-font-display, sans-serif);
        margin: 0;
        line-height: 1.1;
      }

      .rooms-device-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 14px;
        width: 100%;
        box-sizing: border-box;
      }

      @media (max-width: 860px) {
        .rooms-workspace {
          flex-direction: column;
          padding: 12px 16px;
          gap: 20px;
        }
        .rooms-sidebar {
          width: 100%;
          gap: 12px;
        }
        .rooms-nav-list {
          flex-direction: row;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: none;
        }
        .rooms-nav-list::-webkit-scrollbar {
          display: none;
        }
        .room-pill-btn {
          flex-shrink: 0;
          padding: 8px 14px;
        }
        .rooms-device-grid {
          grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
          gap: 10px;
        }
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.updateViewport();

    this.resizeHandler = () => this.updateViewport();
    window.addEventListener('resize', this.resizeHandler);

    this.setupInactivityTracker();
    this.setupListeners();
  }

  firstUpdated(): void {
    // Initialize TV D-Pad Spatial Navigation
    this.dpadNavigator = new DPadNavigator(this.renderRoot as HTMLElement);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.resizeHandler);
    this.removeInactivityTracker();
    if (this.dpadNavigator) {
      this.dpadNavigator.destroy();
    }
  }

  private updateViewport(): void {
    this.viewport = calculateViewportMetrics(this.config.layout);
    this.style.setProperty('--hs-columns', this.viewport.gridColumns.toString());
  }

  private setupListeners(): void {
    this.addEventListener('area-selected', (e: any) => {
      this.selectedAreaId = e.detail.areaId;
    });

    this.addEventListener('switch-dock-tab', (e: any) => {
      this.currentDockTab = e.detail.tab;
    });

    this.addEventListener('open-room-detail', (e: any) => {
      this.selectedDetailArea = e.detail.area;
      this.roomDetailOpen = true;
    });

    this.addEventListener('close-room-detail', () => {
      this.roomDetailOpen = false;
      this.selectedDetailArea = null;
    });

    this.addEventListener('toggle-edit-mode', () => {
      this.editMode = !this.editMode;
    });

    this.addEventListener('toggle-show-hidden', () => {
      this.showHidden = !this.showHidden;
    });

    this.addEventListener('update-dashboard-config', (e: any) => {
      this.config = { ...this.config, ...e.detail };
      this.setAttribute('data-theme', this.config.theme);
      this.updateViewport();
    });

    this.addEventListener('card-config-change', (e: any) => {
      const { entity_id, ...changes } = e.detail;
      const currentCards = { ...this.config.custom_cards };
      currentCards[entity_id] = {
        ...currentCards[entity_id],
        entity_id,
        ...changes,
      };
      this.config = { ...this.config, custom_cards: currentCards };
    });

    this.addEventListener('request-protected-action', (e: any) => {
      const { entity, action } = e.detail;
      this.protectedModalEntityName = entity.name;
      this.protectedModalEntityIcon = entity.icon;
      this.protectedModalConfig = entity.protection;
      this.pendingProtectedAction = action;
      this.confirmModalOpen = true;
    });

    this.addEventListener('request-save-config', async (e: any) => {
      const { onSuccess, onError } = e.detail;
      try {
        await this.saveConfigToHass();
        if (onSuccess) onSuccess();
      } catch (err) {
        if (onError) onError();
      }
    });

    this.addEventListener('screensaver-dismiss', () => {
      this.screensaverActive = false;
      this.resetIdleTimer();
    });

    this.addEventListener('master-toggle-all-lights', (e: any) => {
      const { turnOn } = e.detail;
      this.handleMasterToggleAllLights(turnOn);
    });

    this.addEventListener('trigger-quick-scene', (e: any) => {
      const { sceneId } = e.detail;
      this.handleQuickScene(sceneId);
    });

    this.addEventListener('open-weather-modal', () => {
      this.weatherModalOpen = true;
    });
  }

  private setupInactivityTracker(): void {
    this.userActivityHandler = () => {
      if (this.screensaverActive) {
        this.screensaverActive = false;
      }
      this.resetIdleTimer();
    };

    window.addEventListener('pointerdown', this.userActivityHandler);
    window.addEventListener('keydown', this.userActivityHandler);
    window.addEventListener('mousemove', this.userActivityHandler);
    this.resetIdleTimer();
  }

  private removeInactivityTracker(): void {
    window.removeEventListener('pointerdown', this.userActivityHandler);
    window.removeEventListener('keydown', this.userActivityHandler);
    window.removeEventListener('mousemove', this.userActivityHandler);
    if (this.idleTimer) window.clearTimeout(this.idleTimer);
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) window.clearTimeout(this.idleTimer);
    if (!this.config.screensaver.enabled) return;

    const ms = (this.config.screensaver.timeout_seconds || 180) * 1000;
    this.idleTimer = window.setTimeout(() => {
      this.screensaverActive = true;
    }, ms);
  }

  private async loadConfigFromHass(): Promise<void> {
    if (!this._hass) return;
    try {
      const stored = await this._hass.callWS<HomeSmartConfig>({
        type: 'homesmart/config/get',
      });
      if (stored && typeof stored === 'object') {
        this.config = { ...DEFAULT_CONFIG, ...stored };
        this.setAttribute('data-theme', this.config.theme);
        this.updateViewport();
      }
    } catch (err) {
      console.warn('[HomeSmart] Using default config, HA store not initialized:', err);
    }
  }

  private async saveConfigToHass(): Promise<void> {
    if (!this._hass) return;
    await this._hass.callWS({
      type: 'homesmart/config/save',
      config: this.config,
    });
  }

  private handleMasterToggleAllLights(turnOn: boolean): void {
    if (!this.hass) return;
    const areas = runAutoDiscovery(this.hass, this.config, true);
    const service = turnOn ? 'turn_on' : 'turn_off';

    for (const area of areas) {
      for (const ent of area.entities) {
        if (ent.domain === 'light') {
          this.hass.callService('light', service, { entity_id: ent.entity_id });
        }
      }
    }
  }

  private handleQuickScene(sceneId: string): void {
    if (!this.hass) return;
    // Map sceneId to Home Assistant scene if existing
    const sceneEntityId = `scene.${sceneId}`;
    if (this.hass.states[sceneEntityId]) {
      this.hass.callService('scene', 'turn_on', { entity_id: sceneEntityId });
    } else {
      // Fallback scene behaviors
      if (sceneId === 'away' || sceneId === 'sleep') {
        this.handleMasterToggleAllLights(false);
      } else if (sceneId === 'home') {
        this.handleMasterToggleAllLights(true);
      }
    }
  }

  render() {
    const areas = runAutoDiscovery(this.hass, this.config, this.showHidden);
    const summary = computeAreaSummary(areas);
    const isSidebarLayout = this.config.layout === 'sidebar';
    const weatherEntity = this.hass?.states
      ? Object.values(this.hass.states).find((e) => e.entity_id.startsWith('weather.'))
      : undefined;

    return html`
      <div class="homesmart-shell theme-${this.config.theme}" data-theme="${this.config.theme}">
        <!-- In-App Visual Editor Toolbar -->
        <homesmart-visual-editor-bar
          .config="${this.config}"
          .open="${this.editMode}"
          .showHidden="${this.showHidden}"
          .locale="${this.config.locale}"
        ></homesmart-visual-editor-bar>

        <div class="app-layout">
          <!-- Optional Left Sidebar (only when user explicitly chooses 'sidebar' layout) -->
          ${isSidebarLayout
            ? html`
                <homesmart-sidebar-nav
                  .areas="${areas}"
                  .selectedAreaId="${this.selectedAreaId}"
                  .device="${this.viewport.device}"
                  .locale="${this.config.locale}"
                  .lightsOn="${summary.lightsOn}"
                  .totalActive="${summary.totalActive}"
                  .editMode="${this.editMode}"
                ></homesmart-sidebar-nav>
              `
            : ''}

          <!-- Main Content Viewport -->
          <main class="main-content ${isSidebarLayout ? 'sidebar-layout' : ''} ${this.viewport.device}">
            ${isSidebarLayout
              ? this.renderSidebarMainContent(areas)
              : this.renderDeckApp(areas, summary, weatherEntity)}
          </main>
        </div>

        <!-- Floating Bottom Capsule Dock (HomeDeck Pro Style) -->
        ${!isSidebarLayout
          ? html`
              <homesmart-floating-dock
                .activeTab="${this.currentDockTab}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-floating-dock>
            `
          : ''}

        <!-- Room Detail Slide Sheet -->
        <homesmart-room-detail-sheet
          .hass="${this.hass}"
          .area="${this.selectedDetailArea}"
          .open="${this.roomDetailOpen}"
          .locale="${this.config.locale}"
        ></homesmart-room-detail-sheet>

        <!-- Security Protected Confirmation Modal -->
        <homesmart-confirm-dialog
          .open="${this.confirmModalOpen}"
          .protection="${this.protectedModalConfig}"
          .entityName="${this.protectedModalEntityName}"
          .entityIcon="${this.protectedModalEntityIcon}"
          .locale="${this.config.locale}"
          @confirm-success="${this.handleConfirmSuccess}"
          @confirm-cancel="${() => (this.confirmModalOpen = false)}"
        ></homesmart-confirm-dialog>

        <!-- Weather Forecast Modal -->
        <homesmart-weather-modal
          .open="${this.weatherModalOpen}"
          .weatherEntity="${weatherEntity}"
          .hass="${this.hass}"
          .locale="${this.config.locale}"
          @close-weather-modal="${() => (this.weatherModalOpen = false)}"
        ></homesmart-weather-modal>

        <!-- OLED Screensaver for Tablets & TV -->
        <homesmart-oled-screensaver
          .active="${this.screensaverActive}"
          .weatherEntity="${weatherEntity}"
          .locale="${this.config.locale}"
        ></homesmart-oled-screensaver>
      </div>
    `;
  }

  /**
   * HomeDeck Pro Layout View
   */
  private renderDeckApp(
    areas: DiscoveredArea[],
    summary: { lightsOn: number; totalActive: number },
    weatherEntity?: any
  ) {
    switch (this.currentDockTab) {
      case 'rooms':
        return this.renderRoomsTabView(areas);
      case 'media':
        return this.renderMediaTabView(areas);
      case 'security':
        return this.renderSecurityTabView(areas);
      case 'home':
      default:
        return this.renderHomeDeckView(areas, summary, weatherEntity);
    }
  }

  /**
   * Tab 1: Home View (Deck Carousel + Hero Header)
   */
  private renderHomeDeckView(
    areas: DiscoveredArea[],
    summary: { lightsOn: number; totalActive: number },
    weatherEntity?: any
  ) {
    // Find primary media/TV device to feature on home deck
    let heroDevice: DiscoveredEntity | null = null;
    for (const area of areas) {
      for (const ent of area.entities) {
        if (ent.domain === 'media_player') {
          heroDevice = ent;
          break;
        }
      }
      if (heroDevice) break;
    }

    return html`
      <!-- Top Hero Header -->
      <homesmart-hero-header
        .hass="${this.hass}"
        .locale="${this.config.locale}"
        .lightsOnCount="${summary.lightsOn}"
        .weatherEntity="${weatherEntity}"
      ></homesmart-hero-header>

      <!-- Horizontal Deck Cards Row (HomeDeck Style) -->
      <div class="deck-scroll-container">
        <!-- Room Cards -->
        ${areas.map(
          (area) => html`
            <div class="deck-card-wrapper">
              <homesmart-deck-room-card
                .hass="${this.hass}"
                .area="${area}"
                .locale="${this.config.locale}"
              ></homesmart-deck-room-card>
            </div>
          `
        )}

        <!-- Security Deck Card -->
        <div class="deck-card-wrapper">
          <homesmart-deck-security-card
            .hass="${this.hass}"
            .areas="${areas}"
            .locale="${this.config.locale}"
          ></homesmart-deck-security-card>
        </div>

        <!-- Featured TV / Primary Device Deck Card -->
        ${heroDevice
          ? html`
              <div class="deck-card-wrapper">
                <homesmart-deck-device-card
                  .hass="${this.hass}"
                  .entity="${heroDevice}"
                  .locale="${this.config.locale}"
                ></homesmart-deck-device-card>
              </div>
            `
          : ''}
      </div>
    `;
  }

  /**
   * Tab 2: Rooms View (HomeDeck Pro Two-Column Layout)
   * Left: Date & Time, Vertical Room Pills
   * Right: Room Eyebrow Status, Big Room Title, Squircle Device Grid
   */
  private renderRoomsTabView(areas: DiscoveredArea[]) {
    if (areas.length === 0) {
      return html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`;
    }

    // Determine selected area or default to first area
    const activeArea =
      areas.find((a) => a.id === this.selectedAreaId) || areas[0];

    // Compute active lights in selected room
    let lightsOn = 0;
    for (const ent of activeArea.entities) {
      if (ent.domain === 'light') {
        const stateObj = this.hass?.states[ent.entity_id];
        if (stateObj?.state === 'on') lightsOn++;
      }
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString(
      this.config.locale === 'vi' ? 'vi-VN' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long' }
    ).toUpperCase();

    const eyebrow =
      lightsOn === 0
        ? t('everything_off', this.config.locale)
        : `${lightsOn} ${t('lights_active', this.config.locale).toUpperCase()}`;

    return html`
      <div class="rooms-workspace">
        <!-- Left Sidebar: Date, Clock & Vertical Room Navigation Pills -->
        <aside class="rooms-sidebar">
          <div class="sidebar-clock-group">
            <span class="sidebar-date">${dateStr}</span>
            <div class="sidebar-clock-row">
              <span class="sidebar-clock">${timeStr}</span>
              <span class="sidebar-dot">＝</span>
            </div>
          </div>

          <nav class="rooms-nav-list" aria-label="Rooms Navigation">
            ${areas.map((area) => {
              const isSelected = area.id === activeArea.id;
              let areaLightsOn = 0;
              for (const e of area.entities) {
                if (
                  e.domain === 'light' &&
                  this.hass?.states[e.entity_id]?.state === 'on'
                ) {
                  areaLightsOn++;
                }
              }

              return html`
                <button
                  class="room-pill-btn ${isSelected ? 'active' : ''}"
                  @click="${() => (this.selectedAreaId = area.id)}"
                  type="button"
                >
                  <span class="room-pill-icon">${renderIcon(area.icon, 18)}</span>
                  <span class="room-pill-name">${area.name}</span>
                  ${areaLightsOn > 0
                    ? html`<span class="room-pill-badge">${areaLightsOn}</span>`
                    : ''}
                </button>
              `;
            })}
          </nav>
        </aside>

        <!-- Right Main: Eyebrow, Room Title & Squircle Device Grid -->
        <section class="rooms-main">
          <header class="rooms-main-header">
            <span class="rooms-eyebrow">${eyebrow}</span>
            <h1 class="rooms-title">${activeArea.name}</h1>
          </header>

          <div class="rooms-device-grid">
            ${activeArea.entities.map(
              (entity) => html`
                <homesmart-squircle-device-card
                  .hass="${this.hass}"
                  .entity="${entity}"
                  .locale="${this.config.locale}"
                ></homesmart-squircle-device-card>
              `
            )}
          </div>
        </section>
      </div>
    `;
  }

  /**
   * Tab 3: Media & Entertainment View
   */
  private renderMediaTabView(areas: DiscoveredArea[]) {
    const mediaEntities: DiscoveredEntity[] = [];
    for (const a of areas) {
      for (const e of a.entities) {
        if (e.domain === 'media_player') {
          mediaEntities.push(e);
        }
      }
    }

    return html`
      <div class="tab-view-container">
        <h2 class="section-heading">
          ${renderIcon('television-ambient-light', 24)}
          <span>${t('tab_media', this.config.locale)}</span>
        </h2>

        ${mediaEntities.length > 0
          ? html`
              <div class="bento-grid">
                ${mediaEntities.map(
                  (entity) => html`
                    <div class="card-item size-2x2">
                      <homesmart-card-2x2-media-cam
                        .hass="${this.hass}"
                        .entity="${entity}"
                        .editMode="${this.editMode}"
                        .locale="${this.config.locale}"
                      ></homesmart-card-2x2-media-cam>
                    </div>
                  `
                )}
              </div>
            `
          : html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`}
      </div>
    `;
  }

  /**
   * Tab 4: Security View
   */
  private renderSecurityTabView(areas: DiscoveredArea[]) {
    const securityEntities: DiscoveredEntity[] = [];
    for (const a of areas) {
      for (const e of a.entities) {
        if (
          e.domain === 'lock' ||
          e.domain === 'camera' ||
          e.domain === 'binary_sensor' ||
          (e.domain === 'cover' && e.entity_id.includes('gara'))
        ) {
          securityEntities.push(e);
        }
      }
    }

    return html`
      <div class="tab-view-container">
        <h2 class="section-heading">
          ${renderIcon('shield-check', 24)}
          <span>${t('tab_security', this.config.locale)}</span>
        </h2>

        ${securityEntities.length > 0
          ? html`
              <div class="bento-grid">
                ${securityEntities.map(
                  (entity) => html`
                    <div class="card-item size-${entity.size}">
                      ${entity.domain === 'camera'
                        ? html`
                            <homesmart-card-2x2-media-cam
                              .hass="${this.hass}"
                              .entity="${entity}"
                              .editMode="${this.editMode}"
                              .locale="${this.config.locale}"
                            ></homesmart-card-2x2-media-cam>
                          `
                        : html`
                            <homesmart-card-1x1
                              .hass="${this.hass}"
                              .entity="${entity}"
                              .editMode="${this.editMode}"
                              .locale="${this.config.locale}"
                            ></homesmart-card-1x1>
                          `}
                    </div>
                  `
                )}
              </div>
            `
          : html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`}
      </div>
    `;
  }

  /**
   * Standard Sidebar Main Content View
   */
  private renderSidebarMainContent(areas: DiscoveredArea[]) {
    if (this.selectedAreaId === '') {
      return html`
        ${areas.map(
          (area) => html`
            <section class="grid-area-section">
              <div class="area-title-bar">
                <div class="area-heading">
                  ${renderIcon(area.icon, 26)}
                  <span class="area-title-text">${area.name}</span>
                </div>
                <span class="area-count-chip">${area.entities.length}</span>
              </div>
              ${this.renderAreaBentoGrid(area)}
            </section>
          `
        )}
      `;
    }

    const currentArea = areas.find((a) => a.id === this.selectedAreaId);
    if (!currentArea) {
      return html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`;
    }

    return html`
      <div class="area-title-bar">
        <div class="area-heading">
          ${renderIcon(currentArea.icon, 28)}
          <span class="area-title-text">${currentArea.name}</span>
        </div>
        <span class="area-count-chip">${currentArea.entities.length}</span>
      </div>
      ${this.renderAreaBentoGrid(currentArea)}
    `;
  }

  /**
   * Render Bento Cards for a given area
   */
  private renderAreaBentoGrid(area: DiscoveredArea) {
    if (!area.entities || area.entities.length === 0) {
      return html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`;
    }

    return html`
      <div class="bento-grid">
        ${area.entities.map((entity) => this.renderEntityCard(entity))}
      </div>
    `;
  }

  /**
   * Render individual Bento card based on its size and domain
   */
  private renderEntityCard(entity: DiscoveredEntity) {
    const size = entity.size;

    return html`
      <div class="card-item size-${size}">
        ${size === '1x1'
          ? html`
              <homesmart-card-1x1
                .hass="${this.hass}"
                .entity="${entity}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-1x1>
            `
          : size === '2x1'
          ? html`
              <homesmart-card-2x1-slider
                .hass="${this.hass}"
                .entity="${entity}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x1-slider>
            `
          : entity.domain === 'climate' || entity.domain === 'water_heater'
          ? html`
              <homesmart-card-2x2-climate
                .hass="${this.hass}"
                .entity="${entity}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x2-climate>
            `
          : html`
              <homesmart-card-2x2-media-cam
                .hass="${this.hass}"
                .entity="${entity}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x2-media-cam>
            `}
      </div>
    `;
  }

  private handleConfirmSuccess(): void {
    this.confirmModalOpen = false;
    if (this.pendingProtectedAction) {
      this.pendingProtectedAction();
      this.pendingProtectedAction = null;
    }
  }
}
