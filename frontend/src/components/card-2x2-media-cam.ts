/**
 * HomeSmart - 2x2 Bento Card for Live Camera Stream & Media Player
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DiscoveredEntity, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-card-2x2-media-cam')
export class HomeSmartCard2x2MediaCam extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) entity!: DiscoveredEntity;
  @property({ type: Boolean }) editMode = false;
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private showFullscreen = false;

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
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Camera Card */
    .camera-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--hs-radius-lg, 24px);
      overflow: hidden;
    }

    .camera-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .camera-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.4);
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      box-sizing: border-box;
      pointer-events: none;
    }

    .camera-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 75, 114, 0.85);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 10px;
      letter-spacing: 0.5px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
      animation: pulse 1.5s infinite;
    }

    .camera-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
    }

    .camera-name {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
    }

    .fullscreen-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .fullscreen-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }

    /* Media Player Card */
    .media-container {
      width: 100%;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .media-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-size: cover;
      background-position: center;
      filter: blur(24px) brightness(0.35);
      transform: scale(1.15);
      z-index: 0;
    }

    .media-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .media-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .media-device-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .media-artwork-small {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .media-titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .track-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--hs-font-display, sans-serif);
    }

    .track-artist {
      font-size: 12px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .media-controls-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin: 14px 0;
    }

    .play-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
      transition: all 0.2s ease;
    }

    .play-btn:hover {
      transform: scale(1.08);
    }

    .nav-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .volume-slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .vol-slider {
      flex: 1;
      height: 6px;
      appearance: none;
      -webkit-appearance: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      outline: none;
    }

    .vol-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--hs-accent, #00f2fe);
      cursor: pointer;
    }

    /* Fullscreen Modal */
    .fs-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fs-close {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: #fff;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .fs-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
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
    const isCamera = this.entity.domain === 'camera';

    return html`
      <div class="glass-card card-inner" tabindex="0">
        ${isCamera ? this.renderCamera() : this.renderMediaPlayer()}
        ${this.editMode ? this.renderEditControls() : ''}
      </div>

      ${this.showFullscreen && isCamera ? this.renderFullscreenModal() : ''}
    `;
  }

  private renderCamera() {
    const entityPicture = this.entity.attributes.entity_picture;
    const streamUrl = entityPicture ? `${entityPicture}&token=${Date.now()}` : '';

    return html`
      <div class="camera-container">
        ${streamUrl
          ? html`<img class="camera-img" src="${streamUrl}" alt="${this.entity.name}" />`
          : html`
              <div class="camera-placeholder">
                ${renderIcon('cctv', 48)}
                <span>Camera Stream</span>
              </div>
            `}

        <div class="camera-overlay">
          <div class="camera-top">
            <div class="live-badge">
              <span class="live-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
          <div class="camera-bottom">
            <span class="camera-name">${this.entity.name}</span>
            <button
              class="fullscreen-btn"
              title="Fullscreen"
              @click="${() => (this.showFullscreen = true)}"
            >
              ${renderIcon('fullscreen', 18)}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderFullscreenModal() {
    const entityPicture = this.entity.attributes.entity_picture;

    return html`
      <div class="fs-modal">
        <button class="fs-close" @click="${() => (this.showFullscreen = false)}">
          ${renderIcon('close', 24)}
        </button>
        <img class="fs-img" src="${entityPicture}" alt="${this.entity.name}" />
      </div>
    `;
  }

  private renderMediaPlayer() {
    const attrs = this.entity.attributes;
    const isPlaying = this.entity.state === 'playing';
    const artwork = attrs.entity_picture || '';
    const trackTitle = attrs.media_title || this.entity.name;
    const artist = attrs.media_artist || t(`state_${this.entity.state}`, this.locale);
    const volume = Math.round((attrs.volume_level ?? 0.5) * 100);

    return html`
      <div class="media-container">
        ${artwork
          ? html`<div class="media-backdrop" style="background-image: url('${artwork}')"></div>`
          : ''}

        <div class="media-content">
          <div class="media-header">
            <div class="media-device-info">
              ${artwork
                ? html`<img class="media-artwork-small" src="${artwork}" alt="" />`
                : renderIcon('television-ambient-light', 28)}
              <div class="media-titles">
                <span class="track-title" title="${trackTitle}">${trackTitle}</span>
                <span class="track-artist" title="${artist}">${artist}</span>
              </div>
            </div>
            <button class="nav-btn" @click="${this.togglePower}">
              ${renderIcon('power', 18)}
            </button>
          </div>

          <div class="media-controls-row">
            <button class="nav-btn" @click="${() => this.mediaService('media_previous_track')}">
              ${renderIcon('skip-previous', 20)}
            </button>
            <button class="play-btn" @click="${() => this.mediaService('media_play_pause')}">
              ${renderIcon(isPlaying ? 'pause' : 'play', 24)}
            </button>
            <button class="nav-btn" @click="${() => this.mediaService('media_next_track')}">
              ${renderIcon('skip-next', 20)}
            </button>
          </div>

          <div class="volume-slider-row">
            ${renderIcon('volume-high', 18)}
            <input
              type="range"
              class="vol-slider"
              min="0"
              max="100"
              .value="${volume.toString()}"
              @change="${this.onVolumeChange}"
            />
          </div>
        </div>
      </div>
    `;
  }

  private mediaService(service: string): void {
    if (!this.hass) return;
    this.hass.callService('media_player', service, { entity_id: this.entity.entity_id });
  }

  private togglePower(): void {
    if (!this.hass) return;
    this.hass.callService('media_player', 'toggle', { entity_id: this.entity.entity_id });
  }

  private onVolumeChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const vol = parseFloat(input.value) / 100;
    if (this.hass) {
      this.hass.callService('media_player', 'volume_set', {
        entity_id: this.entity.entity_id,
        volume_level: vol,
      });
    }
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
