/**
 * HomeSmart - HomeDeck Pro Hero Header Component
 * Clock, Date, Live Home Status, Quick Scenes & Master Action Toggles
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HassEntity, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-hero-header')
export class HomeSmartHeroHeader extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: String }) locale: LocaleId = 'vi';
  @property({ type: Number }) lightsOnCount = 0;
  @property({ type: Object }) weatherEntity?: HassEntity;
  @property({ type: String }) userName = 'T';

  @state() private currentTime = '';
  @state() private currentDate = '';
  private timer: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      padding: 24px 32px 16px;
      box-sizing: border-box;
      user-select: none;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    /* Left Column: Clock, Status, Scenes */
    .left-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .date-row {
      font-size: 11px;
      font-weight: 700;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: var(--hs-font-display, sans-serif);
    }

    .time-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .clock-display {
      font-size: clamp(38px, 4.5vw, 54px);
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
      font-family: var(--hs-font-display, sans-serif);
      letter-spacing: -1.5px;
    }

    .clock-status-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--hs-accent, #38bdf8);
    }

    /* Home Status */
    .status-section {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
      text-transform: uppercase;
    }

    .status-value {
      font-size: 17px;
      font-weight: 600;
      color: var(--hs-text-primary, #ffffff);
      font-family: var(--hs-font-display, sans-serif);
    }

    /* Scenes Row */
    .scenes-section {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .scenes-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
      text-transform: uppercase;
    }

    .scenes-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .scene-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
    }

    .scene-pill:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .scene-pill:active {
      transform: scale(0.96);
      background: var(--hs-accent, #38bdf8);
      color: #05040d;
    }

    /* Right Section: Avatar, Weather, Settings & Master Toggles */
    .right-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .top-controls-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2d9cc;
      color: #1a1a1a;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: none;
      cursor: pointer;
    }

    .weather-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
    }

    .weather-temp {
      font-weight: 700;
    }

    .weather-desc {
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.55));
      text-transform: capitalize;
    }

    .icon-circle-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .icon-circle-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    /* Master Action Buttons */
    .master-actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .master-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .master-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    .master-btn:active {
      transform: scale(0.96);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      :host {
        padding: 18px 16px 12px;
      }
      .header-container {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      .right-section {
        align-items: flex-start;
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateClock();
    this.timer = window.setInterval(() => this.updateClock(), 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.timer) window.clearInterval(this.timer);
  }

  private updateClock(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.currentTime = `${hours}:${minutes}`;

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    this.currentDate = now.toLocaleDateString(
      this.locale === 'vi' ? 'vi-VN' : 'en-US',
      dateOptions
    );
  }

  render() {
    const weatherTemp = this.weatherEntity?.attributes?.temperature ?? 27;
    const weatherState = this.weatherEntity?.state ?? 'Rainy';

    const statusText =
      this.lightsOnCount > 0
        ? `${this.lightsOnCount} ${t('lights_on_at_home', this.locale)}`
        : t('all_lights_off', this.locale);

    return html`
      <header class="header-container">
        <!-- Left: Clock, Status, Scenes -->
        <div class="left-section">
          <div class="date-row">${this.currentDate}</div>
          <div class="time-row">
            <div class="clock-display">${this.currentTime}</div>
            <div class="clock-status-dot">●</div>
          </div>

          <div class="status-section">
            <span class="status-label">${t('home_status', this.locale)}</span>
            <span class="status-value">${statusText}</span>
          </div>

          <div class="scenes-section">
            <span class="scenes-label">${t('scenes_title', this.locale)} 4</span>
            <div class="scenes-pills">
              <button class="scene-pill" @click="${() => this.triggerScene('away')}">
                ${renderIcon('tree', 14)}
                <span>${t('scene_away', this.locale)}</span>
              </button>
              <button class="scene-pill" @click="${() => this.triggerScene('home')}">
                ${renderIcon('home-outline', 14)}
                <span>${t('scene_home', this.locale)}</span>
              </button>
              <button class="scene-pill" @click="${() => this.triggerScene('sleep')}">
                ${renderIcon('bed', 14)}
                <span>${t('scene_sleep', this.locale)}</span>
              </button>
              <button class="scene-pill" @click="${() => this.triggerScene('movie')}">
                ${renderIcon('television-ambient-light', 14)}
                <span>${t('scene_movie', this.locale)}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Avatar, Weather, Settings & Master Toggles -->
        <div class="right-section">
          <div class="top-controls-row">
            <div class="avatar-btn" title="User Profile">${this.userName.charAt(0).toUpperCase()}</div>

            <div class="weather-pill">
              ${renderIcon('weather-sunny', 18)}
              <span class="weather-temp">${weatherTemp}°</span>
              <span class="weather-desc">${weatherState}</span>
            </div>

            <button
              class="icon-circle-btn"
              title="${t('visual_editor', this.locale)}"
              @click="${this.openSettings}"
            >
              ${renderIcon('cog', 18)}
            </button>
          </div>

          <div class="master-actions-row">
            <button class="master-btn" @click="${() => this.toggleAllLights(true)}">
              ${renderIcon('lightbulb-on', 15)}
              <span>${t('turn_all_on', this.locale)}</span>
            </button>
            <button class="master-btn" @click="${() => this.toggleAllLights(false)}">
              ${renderIcon('power', 15)}
              <span>${t('turn_all_off', this.locale)}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  private triggerScene(sceneId: string): void {
    this.dispatchEvent(
      new CustomEvent('trigger-quick-scene', {
        bubbles: true,
        composed: true,
        detail: { sceneId },
      })
    );
  }

  private toggleAllLights(turnOn: boolean): void {
    this.dispatchEvent(
      new CustomEvent('master-toggle-all-lights', {
        bubbles: true,
        composed: true,
        detail: { turnOn },
      })
    );
  }

  private openSettings(): void {
    this.dispatchEvent(
      new CustomEvent('toggle-edit-mode', {
        bubbles: true,
        composed: true,
      })
    );
  }
}
