/**
 * HomeSmart - 2x2 Interactive Climate Thermostat Dial Card
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DiscoveredEntity, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-card-2x2-climate')
export class HomeSmartCard2x2Climate extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) entity!: DiscoveredEntity;
  @property({ type: Boolean }) editMode = false;
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private localTargetTemp: number | null = null;
  private debounceTimer: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      min-height: 250px;
      box-sizing: border-box;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .device-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-container {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-accent, #00f2fe);
    }

    .active .icon-container {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    .name-col {
      display: flex;
      flex-direction: column;
    }

    .entity-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--hs-text-primary, #ffffff);
      font-family: var(--hs-font-display, sans-serif);
    }

    .entity-hvac-action {
      font-size: 12px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
    }

    /* Circular Arc Dial Area */
    .dial-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      margin: 10px 0;
    }

    .svg-dial {
      width: 170px;
      height: 110px;
      overflow: visible;
    }

    .arc-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 10;
      stroke-linecap: round;
    }

    .arc-progress {
      fill: none;
      stroke: url(#climateGradient);
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }

    .temp-readout {
      position: absolute;
      top: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .current-temp-val {
      font-size: 34px;
      font-weight: 800;
      font-family: var(--hs-font-display, sans-serif);
      color: #ffffff;
      line-height: 1;
      display: flex;
      align-items: baseline;
    }

    .temp-unit {
      font-size: 18px;
      font-weight: 500;
      margin-left: 2px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
    }

    .current-label {
      font-size: 12px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      margin-top: 4px;
    }

    /* Target Temp Controls */
    .target-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 6px;
    }

    .round-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .round-btn:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: var(--hs-accent, #00f2fe);
      transform: scale(1.08);
    }

    .round-btn:active {
      transform: scale(0.94);
    }

    .target-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
    }

    .target-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      font-family: var(--hs-font-display, sans-serif);
    }

    .target-lbl {
      font-size: 11px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    /* Mode selector pills */
    .mode-pills {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 6px;
      background: rgba(0, 0, 0, 0.25);
      padding: 4px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: 10px;
    }

    .mode-pill {
      flex: 1;
      padding: 6px 4px;
      border-radius: 12px;
      background: transparent;
      border: none;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-transform: capitalize;
      transition: all 0.2s ease;
      text-align: center;
      white-space: nowrap;
    }

    .mode-pill:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    .mode-pill.selected {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 10px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    /* Edit Controls */
    .edit-controls {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }

    .edit-btn {
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      color: #fff;
      font-size: 11px;
      padding: 3px 6px;
      cursor: pointer;
    }

    .edit-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }
  `;

  render() {
    const isActive = this.entity.state !== 'off';
    const currentTemp = this.entity.attributes.current_temperature ?? 24;
    const targetTemp = this.getTargetTemp();
    const minTemp = this.entity.attributes.min_temp ?? 16;
    const maxTemp = this.entity.attributes.max_temp ?? 30;
    const modes: string[] = this.entity.attributes.hvac_modes ?? ['off', 'cool', 'heat', 'auto'];

    // SVG arc calculations: 180 degree semi-circle arc (radius 70)
    const arcRadius = 65;
    const arcCircumference = Math.PI * arcRadius;
    const ratio = Math.max(0, Math.min((targetTemp - minTemp) / (maxTemp - minTemp), 1));
    const strokeDashoffset = arcCircumference * (1 - ratio);

    return html`
      <div class="glass-card card-inner ${isActive ? 'active' : ''}" tabindex="0">
        <div class="header-row">
          <div class="device-title">
            <div class="icon-container" @click="${this.togglePower}">
              ${renderIcon(this.entity.icon, 22)}
            </div>
            <div class="name-col">
              <span class="entity-name">${this.entity.name}</span>
              <span class="entity-hvac-action">${this.getHvacActionLabel()}</span>
            </div>
          </div>
        </div>

        <div class="dial-center">
          <svg class="svg-dial" viewBox="0 0 160 95">
            <defs>
              <linearGradient id="climateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#00f2fe" />
                <stop offset="100%" stop-color="#4facfe" />
              </linearGradient>
            </defs>
            <!-- Background Arc -->
            <path
              class="arc-bg"
              d="M 15 80 A 65 65 0 0 1 145 80"
              stroke-dasharray="${arcCircumference}"
              stroke-dashoffset="0"
            />
            <!-- Progress Arc -->
            <path
              class="arc-progress"
              d="M 15 80 A 65 65 0 0 1 145 80"
              stroke-dasharray="${arcCircumference}"
              stroke-dashoffset="${strokeDashoffset}"
            />
          </svg>

          <div class="temp-readout">
            <div class="current-temp-val">
              ${currentTemp}<span class="temp-unit">°C</span>
            </div>
            <span class="current-label">${t('current_temp', this.locale)}</span>
          </div>
        </div>

        <div class="target-controls">
          <button class="round-btn" @click="${() => this.adjustTarget(-0.5)}">
            ${renderIcon('minus', 18)}
          </button>
          <div class="target-display">
            <span class="target-val">${targetTemp.toFixed(1)}°C</span>
            <span class="target-lbl">${t('target_temp', this.locale)}</span>
          </div>
          <button class="round-btn" @click="${() => this.adjustTarget(0.5)}">
            ${renderIcon('plus', 18)}
          </button>
        </div>

        <div class="mode-pills">
          ${modes.map(
            (mode) => html`
              <button
                class="mode-pill ${this.entity.state === mode ? 'selected' : ''}"
                @click="${() => this.setMode(mode)}"
              >
                ${t(`state_${mode}`, this.locale)}
              </button>
            `
          )}
        </div>

        ${this.editMode ? this.renderEditControls() : ''}
      </div>
    `;
  }

  private getTargetTemp(): number {
    if (this.localTargetTemp !== null) {
      return this.localTargetTemp;
    }
    return this.entity.attributes.temperature ?? 22;
  }

  private getHvacActionLabel(): string {
    const action = this.entity.attributes.hvac_action || this.entity.state;
    return t(`state_${action}`, this.locale);
  }

  private adjustTarget(delta: number): void {
    const current = this.getTargetTemp();
    const min = this.entity.attributes.min_temp ?? 16;
    const max = this.entity.attributes.max_temp ?? 30;
    const next = Math.max(min, Math.min(max, current + delta));
    this.localTargetTemp = next;

    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      if (this.hass && this.localTargetTemp !== null) {
        this.hass.callService('climate', 'set_temperature', {
          entity_id: this.entity.entity_id,
          temperature: this.localTargetTemp,
        });
        this.localTargetTemp = null;
      }
    }, 400);
  }

  private setMode(mode: string): void {
    if (!this.hass) return;
    this.hass.callService('climate', 'set_hvac_mode', {
      entity_id: this.entity.entity_id,
      hvac_mode: mode,
    });
  }

  private togglePower(): void {
    if (!this.hass) return;
    const nextMode = this.entity.state === 'off' ? 'cool' : 'off';
    this.setMode(nextMode);
  }

  private renderEditControls() {
    return html`
      <div class="edit-controls" @click="${(e: Event) => e.stopPropagation()}">
        <button class="edit-btn" @click="${() => this.changeSize('1x1')}">1x1</button>
        <button class="edit-btn" @click="${() => this.changeSize('2x1')}">2x1</button>
        <button class="edit-btn" @click="${this.cycleProtection}">🛡️</button>
        <button class="edit-btn" @click="${this.toggleHide}">👁️</button>
      </div>
    `;
  }

  private changeSize(newSize: '1x1' | '2x1'): void {
    this.dispatchEvent(
      new CustomEvent('card-config-change', {
        bubbles: true,
        composed: true,
        detail: {
          entity_id: this.entity.entity_id,
          size: newSize,
        },
      })
    );
  }

  private cycleProtection(): void {
    const nextType =
      this.entity.protection.type === 'none'
        ? 'confirm'
        : this.entity.protection.type === 'confirm'
        ? 'pin'
        : 'none';

    this.dispatchEvent(
      new CustomEvent('card-config-change', {
        bubbles: true,
        composed: true,
        detail: {
          entity_id: this.entity.entity_id,
          protection: { type: nextType, pin: '1234' },
        },
      })
    );
  }

  private toggleHide(): void {
    this.dispatchEvent(
      new CustomEvent('card-config-change', {
        bubbles: true,
        composed: true,
        detail: {
          entity_id: this.entity.entity_id,
          hidden: !this.entity.hidden,
        },
      })
    );
  }
}
