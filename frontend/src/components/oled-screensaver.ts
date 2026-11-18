/**
 * HomeSmart - OLED Screensaver
 * Wall Tablet & Android TV Idle Mode with Anti-Burn-in Pixel Shifting
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HassEntity, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-oled-screensaver')
export class HomeSmartOledScreensaver extends LitElement {
  @property({ type: Boolean }) active = false;
  @property({ type: Object }) weatherEntity?: HassEntity;
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private currentTime = '';
  @state() private currentDate = '';
  @state() private shiftX = 0;
  @state() private shiftY = 0;

  private clockTimer: number | null = null;
  private pixelShiftTimer: number | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .screensaver-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000000;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
    }

    .screensaver-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .display-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 1s ease-in-out;
      padding: 32px;
      border-radius: 32px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 0 80px rgba(0, 242, 254, 0.08);
    }

    .clock-text {
      font-size: clamp(72px, 12vw, 130px);
      font-weight: 800;
      font-family: var(--hs-font-display, 'Outfit', sans-serif);
      color: #ffffff;
      line-height: 1;
      letter-spacing: -2px;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.25);
    }

    .date-text {
      font-size: clamp(18px, 2.8vw, 26px);
      font-weight: 500;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      margin-top: 14px;
      text-transform: capitalize;
    }

    .weather-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
      padding: 10px 20px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .weather-temp {
      font-size: 22px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      font-family: var(--hs-font-display, sans-serif);
    }

    .weather-desc {
      font-size: 14px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      text-transform: capitalize;
    }

    .hint-text {
      position: absolute;
      bottom: 40px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 0.5px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateClock();
    this.clockTimer = window.setInterval(() => this.updateClock(), 1000);
    this.pixelShiftTimer = window.setInterval(() => this.shiftPixels(), 60000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.clockTimer) window.clearInterval(this.clockTimer);
    if (this.pixelShiftTimer) window.clearInterval(this.pixelShiftTimer);
  }

  render() {
    return html`
      <div
        class="screensaver-overlay ${this.active ? 'active' : ''}"
        @click="${this.dismiss}"
        @pointerdown="${this.dismiss}"
      >
        <div
          class="display-box"
          style="transform: translate(${this.shiftX}px, ${this.shiftY}px)"
        >
          <div class="clock-text">${this.currentTime}</div>
          <div class="date-text">${this.currentDate}</div>

          ${this.weatherEntity ? this.renderWeather() : ''}
        </div>

        <div class="hint-text">${t('tap_to_wake', this.locale)}</div>
      </div>
    `;
  }

  private renderWeather() {
    if (!this.weatherEntity) return '';
    const temp = this.weatherEntity.attributes.temperature ?? '--';
    const state = this.weatherEntity.state;

    return html`
      <div class="weather-row">
        ${renderIcon('weather-sunny', 26)}
        <span class="weather-temp">${temp}°C</span>
        <span class="weather-desc">${state}</span>
      </div>
    `;
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
      year: 'numeric',
    };
    this.currentDate = now.toLocaleDateString(
      this.locale === 'vi' ? 'vi-VN' : 'en-US',
      dateOptions
    );
  }

  private shiftPixels(): void {
    // Random offset between -16px and +16px to protect OLED phosphors
    this.shiftX = Math.floor(Math.random() * 32) - 16;
    this.shiftY = Math.floor(Math.random() * 32) - 16;
  }

  private dismiss(): void {
    if (this.active) {
      this.dispatchEvent(new CustomEvent('screensaver-dismiss', { bubbles: true, composed: true }));
    }
  }
}
