/**
 * HomeSmart - Room Detail Glass Modal / Bottom Sheet
 * Opens when a room card is tapped to display granular device controls
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DiscoveredArea, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-room-detail-sheet')
export class HomeSmartRoomDetailSheet extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) area: DiscoveredArea | null = null;
  @property({ type: Boolean }) open = false;
  @property({ type: String }) locale: LocaleId = 'vi';

  static styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 8, 15, 0.75);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .sheet-container {
      width: 100%;
      max-width: 960px;
      max-height: 85vh;
      background: var(--hs-sidebar-bg, rgba(14, 24, 44, 0.92));
      backdrop-filter: blur(36px);
      -webkit-backdrop-filter: blur(36px);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.12));
      border-bottom: none;
      border-radius: 32px 32px 0 0;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 24px 32px 40px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .modal-overlay.open .sheet-container {
      transform: translateY(0);
    }

    /* Header Bar */
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .room-icon-bubble {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #38bdf8 0%, #818cf8 100%));
      color: #05040d;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(56, 189, 248, 0.4));
    }

    .room-title-col {
      display: flex;
      flex-direction: column;
    }

    .room-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      margin: 0;
    }

    .room-sub {
      font-size: 13px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .quick-toggle-btn {
      padding: 8px 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Devices Grid */
    .devices-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding-right: 6px;
    }

    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    @media (max-width: 600px) {
      .sheet-container {
        padding: 20px 16px 32px;
      }
      .devices-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  render() {
    if (!this.area) return html``;

    return html`
      <div
        class="modal-overlay ${this.open ? 'open' : ''}"
        @click="${this.handleBackdropClick}"
      >
        <div class="sheet-container" @click="${(e: Event) => e.stopPropagation()}">
          <div class="sheet-header">
            <div class="header-left">
              <div class="room-icon-bubble">
                ${renderIcon(this.area.icon, 22)}
              </div>
              <div class="room-title-col">
                <h2 class="room-title">${this.area.name}</h2>
                <span class="room-sub">${this.area.entities.length} ${t('devices_active', this.locale)}</span>
              </div>
            </div>

            <div class="header-right">
              <button class="quick-toggle-btn" @click="${() => this.toggleRoomLights(true)}">
                ${t('turn_all_on', this.locale)}
              </button>
              <button class="quick-toggle-btn" @click="${() => this.toggleRoomLights(false)}">
                ${t('turn_all_off', this.locale)}
              </button>
              <button class="close-btn" @click="${this.closeSheet}">
                ${renderIcon('close', 18)}
              </button>
            </div>
          </div>

          <div class="devices-scroll-area">
            <div class="devices-grid">
              ${this.area.entities.map(
                (entity) => html`
                  <div>
                    ${entity.size === '2x1'
                      ? html`
                          <homesmart-card-2x1-slider
                            .hass="${this.hass}"
                            .entity="${entity}"
                            .locale="${this.locale}"
                          ></homesmart-card-2x1-slider>
                        `
                      : entity.domain === 'climate' || entity.domain === 'water_heater'
                      ? html`
                          <homesmart-card-2x2-climate
                            .hass="${this.hass}"
                            .entity="${entity}"
                            .locale="${this.locale}"
                          ></homesmart-card-2x2-climate>
                        `
                      : entity.domain === 'media_player' || entity.domain === 'camera'
                      ? html`
                          <homesmart-card-2x2-media-cam
                            .hass="${this.hass}"
                            .entity="${entity}"
                            .locale="${this.locale}"
                          ></homesmart-card-2x2-media-cam>
                        `
                      : html`
                          <homesmart-card-1x1
                            .hass="${this.hass}"
                            .entity="${entity}"
                            .locale="${this.locale}"
                          ></homesmart-card-1x1>
                        `}
                  </div>
                `
              )}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private handleBackdropClick(): void {
    this.closeSheet();
  }

  private closeSheet(): void {
    this.dispatchEvent(new CustomEvent('close-room-detail', { bubbles: true, composed: true }));
  }

  private toggleRoomLights(turnOn: boolean): void {
    if (!this.hass || !this.area) return;
    const lights = this.area.entities.filter((ent) => ent.domain === 'light');
    const service = turnOn ? 'turn_on' : 'turn_off';
    for (const light of lights) {
      this.hass.callService('light', service, { entity_id: light.entity_id });
    }
  }
}
