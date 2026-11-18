/**
 * HomeSmart - Squircle Device Card Component
 * Compact 1:1 squircle device card (~135px x 135px) with:
 * - Cover 3-button pill [^] [▢] [v]
 * - Vacuum 2-button pill [▶] [🏠]
 * - Select dropdown pill [ option ▾ ]
 * - Center circular power button for TV / media player
 * - Light dimmer / toggle
 * - Climate quick adjust [-] [+]
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DiscoveredEntity, HomeAssistant, LocaleId } from '../types';
import { renderIcon } from './icons';
import { t } from '../locales/i18n';

@customElement('homesmart-squircle-device-card')
export class HomeSmartSquircleDeviceCard extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) entity!: DiscoveredEntity;
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private brightnessDraft: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .card {
      width: 100%;
      height: 100%;
      aspect-ratio: 1 / 1;
      min-height: 130px;
      max-height: 155px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 14px 14px 12px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      user-select: none;
      color: #ffffff;
      font-family: var(--hs-font-body, -apple-system, BlinkMacSystemFont, 'Figtree', sans-serif);
    }

    .card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.16);
      transform: translateY(-2px);
    }

    .card.active {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
    }

    /* Top Row: Icon + Header */
    .card-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon-box {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.75);
      flex-shrink: 0;
    }

    .card.active .icon-box {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }

    /* Card Copy / Titles */
    .card-copy {
      min-width: 0;
      flex: 1;
    }

    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
      line-height: 1.2;
    }

    .card-state {
      font-size: 11px;
      font-weight: 500;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      text-transform: capitalize;
      margin-top: 3px;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card.active .card-state {
      color: rgba(255, 255, 255, 0.85);
    }

    /* Controls Strip: Cover 3-buttons, Vacuum 2-buttons */
    .controls-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 99px;
      padding: 3px 6px;
      width: 100%;
      box-sizing: border-box;
      margin-top: auto;
    }

    .control-btn {
      flex: 1;
      height: 30px;
      border-radius: 99px;
      border: none;
      background: transparent;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      padding: 0;
    }

    .control-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      transform: scale(1.05);
    }

    .control-btn:active {
      transform: scale(0.92);
      background: rgba(255, 255, 255, 0.25);
    }

    /* Select Dropdown Capsule */
    .select-capsule {
      position: relative;
      width: 100%;
      margin-top: auto;
    }

    .custom-select {
      width: 100%;
      height: 32px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      padding: 0 24px 0 12px;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      outline: none;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .custom-select:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.22);
    }

    .select-arrow {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 10px;
    }

    /* Center Circular Power Button (TV / Media Player) */
    .center-power-layout {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
    }

    .power-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #ffffff;
      color: #0d1117;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
    }

    .card:not(.active) .power-circle {
      background: #ffffff;
      color: #0d1117;
    }

    .card.active .power-circle {
      background: #38bdf8;
      color: #ffffff;
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.5);
    }

    .power-circle:hover {
      transform: scale(1.08);
    }

    .power-circle:active {
      transform: scale(0.92);
    }

    .center-power-title {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* Climate Quick Adjust */
    .climate-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
    }

    .climate-temp {
      font-size: 20px;
      font-weight: 700;
      font-family: var(--hs-font-display, sans-serif);
      color: #ffffff;
    }

    .climate-btns {
      display: flex;
      gap: 6px;
    }

    .temp-adjust-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      font-weight: 700;
      transition: all 0.15s ease;
      outline: none;
    }

    .temp-adjust-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .temp-adjust-btn:active {
      transform: scale(0.9);
    }

    /* Light Dimmer Bar */
    .inline-dimmer {
      width: 100%;
      height: 6px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.12);
      overflow: hidden;
      margin-top: auto;
      position: relative;
    }

    .inline-dimmer-fill {
      height: 100%;
      border-radius: inherit;
      background: #38bdf8;
      transition: width 0.2s ease;
    }
  `;

  private getState(): any {
    return this.hass?.states[this.entity.entity_id];
  }

  private handleCardClick(e: MouseEvent): void {
    // If click originated from button or select, don't trigger card toggle
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input')) {
      return;
    }

    const domain = this.entity.domain;
    if (domain === 'light' || domain === 'switch' || domain === 'fan') {
      this.hass.callService('homeassistant', 'toggle', {
        entity_id: this.entity.entity_id,
      });
    } else if (domain === 'media_player') {
      this.hass.callService('media_player', 'toggle', {
        entity_id: this.entity.entity_id,
      });
    }
  }

  // Cover actions
  private handleCoverUp(): void {
    this.hass.callService('cover', 'open_cover', { entity_id: this.entity.entity_id });
  }

  private handleCoverStop(): void {
    this.hass.callService('cover', 'stop_cover', { entity_id: this.entity.entity_id });
  }

  private handleCoverDown(): void {
    this.hass.callService('cover', 'close_cover', { entity_id: this.entity.entity_id });
  }

  // Vacuum actions
  private handleVacuumStart(): void {
    this.hass.callService('vacuum', 'start', { entity_id: this.entity.entity_id });
  }

  private handleVacuumDock(): void {
    this.hass.callService('vacuum', 'return_to_base', { entity_id: this.entity.entity_id });
  }

  // Select actions
  private handleSelectChange(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    this.hass.callService('select', 'select_option', {
      entity_id: this.entity.entity_id,
      option: value,
    });
  }

  // Climate adjustments
  private handleClimateAdjust(delta: number): void {
    const stateObj = this.getState();
    const currentTarget = Number(stateObj?.attributes?.temperature ?? 24);
    const newTarget = Math.min(30, Math.max(16, currentTarget + delta));
    this.hass.callService('climate', 'set_temperature', {
      entity_id: this.entity.entity_id,
      temperature: newTarget,
    });
  }

  private getDisplayState(): string {
    const stateObj = this.getState();
    if (!stateObj) return t('state_unavailable', this.locale);
    const val = stateObj.state;

    if (this.entity.domain === 'cover') {
      return val === 'open' ? t('state_open', this.locale) : t('state_closed', this.locale);
    }
    if (this.entity.domain === 'vacuum') {
      return val === 'docked' ? t('vacuum_docked', this.locale) : t('vacuum_cleaning', this.locale);
    }
    if (this.entity.domain === 'light' && val === 'on') {
      const b = stateObj.attributes.brightness;
      return b ? `${Math.round((b / 255) * 100)}%` : t('state_on', this.locale);
    }
    if (this.entity.domain === 'climate') {
      const cur = stateObj.attributes.current_temperature;
      return cur ? `${cur}°` : val;
    }
    if (val === 'on') return t('state_on', this.locale);
    if (val === 'off') return t('state_off', this.locale);
    return val;
  }

  private isEntityActive(): boolean {
    const stateObj = this.getState();
    if (!stateObj) return false;
    const val = stateObj.state;
    return (
      val === 'on' ||
      val === 'open' ||
      val === 'playing' ||
      val === 'cleaning' ||
      val === 'cool' ||
      val === 'heat'
    );
  }

  render() {
    const stateObj = this.getState();
    const domain = this.entity.domain;
    const active = this.isEntityActive();
    const displayState = this.getDisplayState();

    // 1. TV / Centered Power Button Layout
    if (
      domain === 'media_player' ||
      this.entity.entity_id.includes('tv') ||
      this.entity.name.toLowerCase().includes('tv')
    ) {
      return html`
        <div class="card ${active ? 'active' : ''}" @click="${this.handleCardClick}">
          <div class="center-power-layout">
            <button class="power-circle" aria-label="Toggle Power">
              ${renderIcon('power', 24)}
            </button>
            <div class="center-power-title">${this.entity.name}</div>
          </div>
        </div>
      `;
    }

    // 2. Cover Card with Up / Stop / Down buttons
    if (domain === 'cover') {
      return html`
        <div class="card ${active ? 'active' : ''}">
          <div class="card-top">
            <div class="icon-box">
              ${renderIcon('curtains-open', 18)}
            </div>
          </div>
          <div class="card-copy">
            <h4 class="card-title">${this.entity.name}</h4>
            <span class="card-state">${displayState}</span>
          </div>
          <div class="controls-strip">
            <button class="control-btn" @click="${this.handleCoverUp}" aria-label="Open">
              ${renderIcon('chevron-up', 18)}
            </button>
            <button class="control-btn" @click="${this.handleCoverStop}" aria-label="Stop">
              ${renderIcon('stop', 14)}
            </button>
            <button class="control-btn" @click="${this.handleCoverDown}" aria-label="Close">
              ${renderIcon('chevron-down', 18)}
            </button>
          </div>
        </div>
      `;
    }

    // 3. Vacuum Card with Clean & Dock buttons
    if (domain === 'vacuum') {
      return html`
        <div class="card ${active ? 'active' : ''}">
          <div class="card-top">
            <div class="icon-box">
              ${renderIcon('robot', 18)}
            </div>
          </div>
          <div class="card-copy">
            <h4 class="card-title">${this.entity.name}</h4>
            <span class="card-state">${displayState}</span>
          </div>
          <div class="controls-strip">
            <button class="control-btn" @click="${this.handleVacuumStart}" aria-label="Clean">
              ${renderIcon('play', 16)}
            </button>
            <button class="control-btn" @click="${this.handleVacuumDock}" aria-label="Dock">
              ${renderIcon('home', 16)}
            </button>
          </div>
        </div>
      `;
    }

    // 4. Select / Input Select Dropdown Card
    if (domain === 'select' || domain === 'input_select') {
      const options: string[] = stateObj?.attributes?.options || [stateObj?.state || 'Option'];
      return html`
        <div class="card ${active ? 'active' : ''}">
          <div class="card-top">
            <div class="icon-box">
              ${renderIcon('list', 18)}
            </div>
          </div>
          <div class="card-copy">
            <h4 class="card-title">${this.entity.name}</h4>
          </div>
          <div class="select-capsule">
            <select class="custom-select" @change="${this.handleSelectChange}">
              ${options.map(
                (opt) => html`
                  <option value="${opt}" ?selected="${opt === stateObj?.state}">
                    ${opt}
                  </option>
                `
              )}
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
      `;
    }

    // 5. Climate Card with Temperature & Quick Adjust
    if (domain === 'climate') {
      const targetTemp = stateObj?.attributes?.temperature ?? 24;
      return html`
        <div class="card ${active ? 'active' : ''}">
          <div class="card-top">
            <div class="icon-box">
              ${renderIcon('air-conditioner', 18)}
            </div>
          </div>
          <div class="card-copy">
            <h4 class="card-title">${this.entity.name}</h4>
            <span class="card-state">${displayState}</span>
          </div>
          <div class="climate-row">
            <span class="climate-temp">${targetTemp}°</span>
            <div class="climate-btns">
              <button
                class="temp-adjust-btn"
                @click="${() => this.handleClimateAdjust(-0.5)}"
                aria-label="Decrease"
              >
                −
              </button>
              <button
                class="temp-adjust-btn"
                @click="${() => this.handleClimateAdjust(0.5)}"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 6. Light Card with Brightness Indicator
    if (domain === 'light') {
      const brightnessPct = stateObj?.attributes?.brightness
        ? Math.round((stateObj.attributes.brightness / 255) * 100)
        : 0;
      return html`
        <div class="card ${active ? 'active' : ''}" @click="${this.handleCardClick}">
          <div class="card-top">
            <div class="icon-box">
              ${renderIcon(active ? 'lightbulb-on' : 'lightbulb-outline', 18)}
            </div>
          </div>
          <div class="card-copy">
            <h4 class="card-title">${this.entity.name}</h4>
            <span class="card-state">${displayState}</span>
          </div>
          ${active
            ? html`
                <div class="inline-dimmer">
                  <div
                    class="inline-dimmer-fill"
                    style="width: ${brightnessPct > 0 ? brightnessPct : 100}%;"
                  ></div>
                </div>
              `
            : ''}
        </div>
      `;
    }

    // 7. Generic Switch / Fan / Sensor / Default Card
    return html`
      <div class="card ${active ? 'active' : ''}" @click="${this.handleCardClick}">
        <div class="card-top">
          <div class="icon-box">
            ${renderIcon(this.entity.icon || 'power', 18)}
          </div>
        </div>
        <div class="card-copy">
          <h4 class="card-title">${this.entity.name}</h4>
          <span class="card-state">${displayState}</span>
        </div>
      </div>
    `;
  }
}
