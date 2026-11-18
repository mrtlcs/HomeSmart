/**
 * HomeSmart - HomeDeck Pro Tall Room Card Component
 * Tall rounded rectangular deck card with icon, status, and room details trigger
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DiscoveredArea, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-deck-room-card')
export class HomeSmartDeckRoomCard extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) area!: DiscoveredArea;
  @property({ type: String }) locale: LocaleId = 'vi';

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .deck-card {
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
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .deck-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      pointer-events: none;
    }

    .deck-card:hover {
      background: var(--hs-glass-bg-hover, rgba(30, 48, 82, 0.55));
      border-color: var(--hs-glass-border-hover, rgba(255, 255, 255, 0.16));
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }

    .deck-card.has-active {
      border-color: rgba(120, 180, 255, 0.35);
      box-shadow: 0 0 24px var(--hs-glow-color, rgba(56, 189, 248, 0.2)), 0 12px 36px rgba(0, 0, 0, 0.35);
    }

    .deck-card.has-active::after {
      content: '';
      position: absolute;
      bottom: -40px;
      left: 10%;
      right: 10%;
      height: 80px;
      background: var(--hs-accent, #38bdf8);
      filter: blur(40px);
      opacity: 0.18;
      pointer-events: none;
    }

    /* Top Row */
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .icon-bubble {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      transition: all 0.2s ease;
    }

    .has-active .icon-bubble {
      background: var(--hs-active-gradient, linear-gradient(135deg, #38bdf8 0%, #818cf8 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 14px var(--hs-glow-color, rgba(56, 189, 248, 0.4));
    }

    .top-action-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.35));
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .deck-card:hover .top-action-dot {
      color: #ffffff;
      transform: translateX(2px);
    }

    /* Center Ambient Area */
    .card-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Bottom Information */
    .card-bottom {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .room-name {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .room-status {
      font-size: 12px;
      font-weight: 500;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .has-active .room-status {
      color: var(--hs-accent, #38bdf8);
      font-weight: 600;
    }
  `;

  render() {
    const activeEntities = this.area.entities.filter(
      (e) => e.state === 'on' || e.state === 'open' || e.state === 'playing'
    );
    const activeCount = activeEntities.length;
    const hasActive = activeCount > 0;

    return html`
      <div
        class="deck-card ${hasActive ? 'has-active' : ''}"
        tabindex="0"
        @click="${this.handleCardClick}"
      >
        <div class="card-top">
          <div
            class="icon-bubble"
            title="Bật/tắt đèn phòng"
            @click="${this.handleIconToggle}"
          >
            ${renderIcon(this.area.icon, 18)}
          </div>
          <div class="top-action-dot">›</div>
        </div>

        <div class="card-center"></div>

        <div class="card-bottom">
          <div class="room-name" title="${this.area.name}">${this.area.name}</div>
          <div class="room-status">
            ${activeCount} ${t('active_count', this.locale)}
          </div>
        </div>
      </div>
    `;
  }

  private handleCardClick(): void {
    this.dispatchEvent(
      new CustomEvent('open-room-detail', {
        bubbles: true,
        composed: true,
        detail: { area: this.area },
      })
    );
  }

  private handleIconToggle(e: Event): void {
    e.stopPropagation();
    if (!this.hass) return;

    // Toggle all lights in this room
    const lights = this.area.entities.filter((ent) => ent.domain === 'light');
    const hasLightsOn = lights.some((l) => l.state === 'on');
    const targetService = hasLightsOn ? 'turn_off' : 'turn_on';

    for (const light of lights) {
      this.hass.callService('light', targetService, { entity_id: light.entity_id });
    }
  }
}
