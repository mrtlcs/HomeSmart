/**
 * HomeSmart - Tall Security Card Component
 * Displays system-wide security overview with monitored items count
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DiscoveredArea, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-deck-security-card')
export class HomeSmartDeckSecurityCard extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Array }) areas: DiscoveredArea[] = [];
  @property({ type: String }) locale: LocaleId = 'vi';

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .security-card {
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

    .security-card:hover {
      background: var(--hs-glass-bg-hover, rgba(30, 48, 82, 0.55));
      border-color: var(--hs-glass-border-hover, rgba(255, 255, 255, 0.16));
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }

    .security-card.alert {
      border-color: rgba(255, 75, 114, 0.4);
      box-shadow: 0 0 24px rgba(255, 75, 114, 0.3);
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 8px;
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
      color: var(--hs-accent, #38bdf8);
    }

    .alert .icon-bubble {
      background: #ff4b72;
      color: #fff;
    }

    .category-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      text-transform: uppercase;
    }

    .card-center {
      flex: 1;
    }

    .card-bottom {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .status-headline {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      line-height: 1.25;
    }

    .status-subtext {
      font-size: 12px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }
  `;

  render() {
    // Gather all security devices (locks, covers, cameras, binary sensors)
    let totalMonitored = 0;
    let unlockedLocks = 0;

    for (const area of this.areas) {
      for (const ent of area.entities) {
        if (
          ent.domain === 'lock' ||
          ent.domain === 'camera' ||
          ent.domain === 'binary_sensor' ||
          (ent.domain === 'cover' && ent.entity_id.includes('gara'))
        ) {
          totalMonitored++;
          if (ent.domain === 'lock' && ent.state !== 'locked') {
            unlockedLocks++;
          }
        }
      }
    }

    const isAlert = unlockedLocks > 0;
    const headline = isAlert
      ? `${unlockedLocks} khóa chưa đóng`
      : t('everything_secure', this.locale);

    return html`
      <div
        class="security-card ${isAlert ? 'alert' : ''}"
        tabindex="0"
        @click="${this.handleClick}"
      >
        <div class="card-top">
          <div class="icon-bubble">
            ${renderIcon('shield-check', 18)}
          </div>
          <span class="category-label">${t('security_title', this.locale)}</span>
        </div>

        <div class="card-center"></div>

        <div class="card-bottom">
          <div class="status-headline">${headline}</div>
          <div class="status-subtext">${totalMonitored} ${t('monitored_items', this.locale)}</div>
        </div>
      </div>
    `;
  }

  private handleClick(): void {
    this.dispatchEvent(
      new CustomEvent('switch-dock-tab', {
        bubbles: true,
        composed: true,
        detail: { tab: 'security' },
      })
    );
  }
}
