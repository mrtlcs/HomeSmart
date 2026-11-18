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
import './components/sidebar-nav';
import './components/card-1x1';
import './components/card-2x1-slider';
import './components/card-2x2-climate';
import './components/card-2x2-media-cam';
import './components/visual-editor-bar';
import './components/confirm-dialog';
import './components/oled-screensaver';

const DEFAULT_CONFIG: HomeSmartConfig = {
  version: 1,
  theme: 'aurora',
  layout: 'auto',
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
  @state() private selectedAreaId: string = '';
  @state() private editMode = false;
  @state() private showHidden = false;
  @state() private viewport: ViewportMetrics = calculateViewportMetrics();
  @state() private screensaverActive = false;

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
        padding: 24px;
        box-sizing: border-box;
        overflow-y: auto;
      }

      .main-content.phone {
        padding: 16px 14px 90px; /* Space for mobile bottom bar */
      }

      /* TV Layout Header */
      .tv-header {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 16px;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .tv-tab-item {
        padding: 12px 22px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .tv-tab-item:hover,
      .tv-tab-item.active {
        background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
        color: #05040d;
        box-shadow: 0 0 20px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
      }

      /* Focus Layout Header */
      .focus-header {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 14px;
        margin-bottom: 16px;
      }

      .focus-tab {
        padding: 8px 16px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .focus-tab.active {
        background: var(--hs-accent, #00f2fe);
        color: #000;
        font-weight: 700;
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

      /* Grid Mode (All Areas stacked) */
      .grid-area-section {
        margin-bottom: 36px;
      }

      .empty-notice {
        padding: 40px 20px;
        text-align: center;
        color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
        font-size: 15px;
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

  render() {
    const areas = runAutoDiscovery(this.hass, this.config, this.showHidden);
    const summary = computeAreaSummary(areas);
    const effectiveLayout = resolveEffectiveLayout(this.config.layout, this.viewport);
    const weatherEntity = this.hass?.states ? Object.values(this.hass.states).find((e) => e.entity_id.startsWith('weather.')) : undefined;

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
          <!-- Sidebar: Shown when in 'sidebar' layout OR 'auto' on tablet/desktop -->
          ${effectiveLayout === 'sidebar'
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
          <main class="main-content ${this.viewport.device}">
            ${this.renderLayoutView(effectiveLayout, areas)}
          </main>
        </div>

        <!-- Phone Bottom Bar: Shown when on phone in non-sidebar mode -->
        ${this.viewport.device === 'phone' && effectiveLayout !== 'sidebar'
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

        <!-- OLED Screensaver for Tablets & TV -->
        <homesmart-oled-screensaver
          .active="${this.screensaverActive}"
          .weatherEntity="${weatherEntity}"
          .locale="${this.config.locale}"
        ></homesmart-oled-screensaver>
      </div>
    `;
  }

  private renderLayoutView(layout: LayoutMode, areas: DiscoveredArea[]) {
    switch (layout) {
      case 'tv':
        return this.renderTvLayout(areas);
      case 'focus':
        return this.renderFocusLayout(areas);
      case 'grid':
        return this.renderGridLayout(areas);
      case 'sidebar':
      default:
        return this.renderSidebarMainContent(areas);
    }
  }

  /**
   * TV Console (10-Foot UI) Layout
   */
  private renderTvLayout(areas: DiscoveredArea[]) {
    const activeArea =
      areas.find((a) => a.id === this.selectedAreaId) || areas[0] || null;

    return html`
      <div class="tv-header">
        ${areas.map(
          (area) => html`
            <button
              class="tv-tab-item ${activeArea?.id === area.id ? 'active' : ''}"
              @click="${() => (this.selectedAreaId = area.id)}"
            >
              ${renderIcon(area.icon, 22)}
              <span>${area.name}</span>
            </button>
          `
        )}
      </div>

      ${activeArea ? this.renderAreaBentoGrid(activeArea) : html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`}
    `;
  }

  /**
   * Focus Mode Layout (Single Room with Top Tab Switcher)
   */
  private renderFocusLayout(areas: DiscoveredArea[]) {
    const activeArea =
      areas.find((a) => a.id === this.selectedAreaId) || areas[0] || null;

    return html`
      <div class="focus-header">
        ${areas.map(
          (area) => html`
            <button
              class="focus-tab ${activeArea?.id === area.id ? 'active' : ''}"
              @click="${() => (this.selectedAreaId = area.id)}"
            >
              ${renderIcon(area.icon, 16)}
              <span>${area.name}</span>
            </button>
          `
        )}
      </div>

      ${activeArea ? this.renderAreaBentoGrid(activeArea) : html`<div class="empty-notice">${t('no_entities', this.config.locale)}</div>`}
    `;
  }

  /**
   * Grid Mode Layout (All Areas stacked in Bento groups)
   */
  private renderGridLayout(areas: DiscoveredArea[]) {
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

  /**
   * Standard Sidebar Main Content View
   */
  private renderSidebarMainContent(areas: DiscoveredArea[]) {
    if (this.selectedAreaId === '') {
      // Show All Areas stacked
      return this.renderGridLayout(areas);
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
