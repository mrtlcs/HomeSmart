/**
 * HomeSmart - Tall Device Card Component (TV / Primary Switch)
 * Features iconic centered circular power toggle and bottom device label
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DiscoveredEntity, HomeAssistant, LocaleId } from '../types';
import { renderIcon } from './icons';

@customElement('homesmart-deck-device-card')
export class HomeSmartDeckDeviceCard extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) entity!: DiscoveredEntity;
  @property({ type: String }) locale: LocaleId = 'vi';

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .device-card {
      width: 100%;
      height: 100%;
      min-height: 280px;
      border-radius: 26px;
      background: var(--hs-glass-bg, rgba(22, 36, 62, 0.38));
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.08));
      padding: 18px 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .device-card:hover {
      background: var(--hs-glass-bg-hover, rgba(30, 48, 82, 0.55));
      border-color: var(--hs-glass-border-hover, rgba(255, 255, 255, 0.16));
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }

    .device-card.active {
      border-color: rgba(120, 180, 255, 0.35);
      box-shadow: 0 0 24px var(--hs-glow-color, rgba(56, 189, 248, 0.2)), 0 12px 36px rgba(0, 0, 0, 0.35);
    }

    /* Top empty placeholder to balance center */
    .card-top {
      width: 100%;
      height: 24px;
    }

    /* Centered Circular Power Button */
    .center-power-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    .power-circle-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      outline: none;
    }

    .active .power-circle-btn {
      background: #ffffff;
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.45);
      transform: scale(1.05);
    }

    .power-circle-btn:hover {
      transform: scale(1.1);
    }

    .power-circle-btn:active {
      transform: scale(0.95);
    }

    /* Bottom Information */
    .card-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 3px;
      width: 100%;
    }

    .device-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .device-state {
      font-size: 12px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .active .device-state {
      color: var(--hs-accent, #38bdf8);
      font-weight: 600;
    }
  `;

  render() {
    const isActive = this.computeIsActive();
    const stateText = isActive ? 'Đang bật' : 'Đã tắt';

    return html`
      <div
        class="device-card ${isActive ? 'active' : ''}"
        tabindex="0"
        @click="${this.handleCardClick}"
      >
        <div class="card-top"></div>

        <div class="center-power-container">
          <button
            class="power-circle-btn"
            @click="${this.togglePower}"
            title="Bật/Tắt thiết bị"
          >
            ${renderIcon('power', 26)}
          </button>
        </div>

        <div class="card-bottom">
          <div class="device-name" title="${this.entity.name}">${this.entity.name}</div>
          <div class="device-state">${stateText}</div>
        </div>
      </div>
    `;
  }

  private computeIsActive(): boolean {
    const s = this.entity.state.toLowerCase();
    return s === 'on' || s === 'playing';
  }

  private togglePower(e: Event): void {
    e.stopPropagation();
    if (!this.hass) return;
    const domain = this.entity.domain;
    this.hass.callService(domain, 'toggle', { entity_id: this.entity.entity_id });
  }

  private handleCardClick(): void {
    if (this.entity.domain === 'media_player') {
      this.dispatchEvent(
        new CustomEvent('switch-dock-tab', {
          bubbles: true,
          composed: true,
          detail: { tab: 'media' },
        })
      );
    }
  }
}
