/**
 * HomeSmart - 2x1 Bento Card with Inline Touch/Mouse Slider
 * Supports: Dimmer Light, Cover / Curtains, Fan Speed
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DiscoveredEntity, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-card-2x1-slider')
export class HomeSmartCard2x1Slider extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) entity!: DiscoveredEntity;
  @property({ type: Boolean }) editMode = false;
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private dragging = false;
  @state() private localValue: number | null = null;
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
      min-height: 120px;
      box-sizing: border-box;
      padding: 16px 20px;
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

    .left-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .icon-container {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      cursor: pointer;
      transition: all var(--hs-transition-normal, 0.25s ease);
      flex-shrink: 0;
    }

    .active .icon-container {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .entity-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--hs-text-primary, #ffffff);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--hs-font-display, sans-serif);
    }

    .entity-desc {
      font-size: 12px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
    }

    .value-badge {
      font-size: 15px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.12);
      border: 1px solid rgba(0, 242, 254, 0.25);
      border-radius: 12px;
      padding: 4px 10px;
      font-family: var(--hs-font-display, sans-serif);
    }

    /* Slider Container */
    .slider-section {
      width: 100%;
      margin-top: 14px;
    }

    .slider-track {
      position: relative;
      width: 100%;
      height: 38px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }

    .slider-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      border-radius: 20px;
      transition: width 0.1s ease;
      opacity: 0.85;
    }

    .slider-track:hover .slider-fill {
      opacity: 1;
    }

    .slider-thumb {
      position: absolute;
      top: 50%;
      width: 28px;
      height: 28px;
      background: #ffffff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5), 0 0 12px var(--hs-glow-color, rgba(0, 242, 254, 0.5));
      pointer-events: none;
      transition: left 0.1s ease;
    }

    /* Cover Button Row */
    .cover-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }

    .cover-btn {
      flex: 1;
      height: 32px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .cover-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: var(--hs-accent, #00f2fe);
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
    const isActive = this.computeIsActive();
    const currentPercent = this.getCurrentPercent();
    const isCover = this.entity.domain === 'cover';

    return html`
      <div class="glass-card card-inner ${isActive ? 'active' : ''}" tabindex="0">
        <div class="header-row">
          <div class="left-meta">
            <div class="icon-container" @click="${this.handleIconClick}">
              ${renderIcon(this.entity.icon, 24)}
            </div>
            <div class="title-group">
              <span class="entity-name" title="${this.entity.name}">${this.entity.name}</span>
              <span class="entity-desc">${this.computeDescription()}</span>
            </div>
          </div>
          <div class="value-badge">${currentPercent}%</div>
        </div>

        <div class="slider-section">
          <div
            class="slider-track"
            @pointerdown="${this.onPointerDown}"
            @pointermove="${this.onPointerMove}"
            @pointerup="${this.onPointerUp}"
            @pointercancel="${this.onPointerUp}"
          >
            <div class="slider-fill" style="width: ${currentPercent}%"></div>
            <div class="slider-thumb" style="left: ${currentPercent}%"></div>
          </div>

          ${isCover
            ? html`
                <div class="cover-buttons">
                  <button class="cover-btn" @click="${() => this.triggerCover('open_cover')}">
                    ${renderIcon('arrow-up', 16)}
                    <span>${t('open_btn', this.locale)}</span>
                  </button>
                  <button class="cover-btn" @click="${() => this.triggerCover('stop_cover')}">
                    ${renderIcon('pause', 16)}
                    <span>${t('stop_btn', this.locale)}</span>
                  </button>
                  <button class="cover-btn" @click="${() => this.triggerCover('close_cover')}">
                    ${renderIcon('arrow-down', 16)}
                    <span>${t('close_btn', this.locale)}</span>
                  </button>
                </div>
              `
            : ''}
        </div>

        ${this.editMode ? this.renderEditControls() : ''}
      </div>
    `;
  }

  private computeIsActive(): boolean {
    const s = this.entity.state.toLowerCase();
    return s === 'on' || s === 'open';
  }

  private computeDescription(): string {
    if (this.entity.domain === 'light') {
      return t('brightness', this.locale);
    }
    if (this.entity.domain === 'cover') {
      return t('cover_position', this.locale);
    }
    if (this.entity.domain === 'fan') {
      return t('fan_speed', this.locale);
    }
    return '';
  }

  private getCurrentPercent(): number {
    if (this.localValue !== null) {
      return this.localValue;
    }

    const attrs = this.entity.attributes;
    if (this.entity.domain === 'light') {
      if (this.entity.state === 'off') return 0;
      if (attrs.brightness !== undefined) {
        return Math.round((attrs.brightness / 255) * 100);
      }
      return this.entity.state === 'on' ? 100 : 0;
    }

    if (this.entity.domain === 'cover') {
      if (attrs.current_position !== undefined) {
        return Math.round(attrs.current_position);
      }
      return this.entity.state === 'open' ? 100 : 0;
    }

    if (this.entity.domain === 'fan') {
      if (attrs.percentage !== undefined) {
        return Math.round(attrs.percentage);
      }
      return this.entity.state === 'on' ? 100 : 0;
    }

    return 0;
  }

  private handleIconClick(e: Event): void {
    e.stopPropagation();
    if (this.editMode) return;

    if (this.entity.protection.type !== 'none') {
      this.dispatchEvent(
        new CustomEvent('request-protected-action', {
          bubbles: true,
          composed: true,
          detail: {
            entity: this.entity,
            action: () => this.toggleEntity(),
          },
        })
      );
      return;
    }

    this.toggleEntity();
  }

  private toggleEntity(): void {
    if (!this.hass) return;
    const domain = this.entity.domain;
    const entityId = this.entity.entity_id;

    if (domain === 'cover') {
      const service = this.entity.state === 'open' ? 'close_cover' : 'open_cover';
      this.hass.callService('cover', service, { entity_id: entityId });
    } else {
      this.hass.callService(domain, 'toggle', { entity_id: entityId });
    }
  }

  private triggerCover(service: string): void {
    if (!this.hass) return;
    if (this.entity.protection.type !== 'none') {
      this.dispatchEvent(
        new CustomEvent('request-protected-action', {
          bubbles: true,
          composed: true,
          detail: {
            entity: this.entity,
            action: () => this.hass.callService('cover', service, { entity_id: this.entity.entity_id }),
          },
        })
      );
      return;
    }
    this.hass.callService('cover', service, { entity_id: this.entity.entity_id });
  }

  private onPointerDown(e: PointerEvent): void {
    const track = e.currentTarget as HTMLElement;
    track.setPointerCapture(e.pointerId);
    this.dragging = true;
    this.updateValueFromPointer(e, track);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const track = e.currentTarget as HTMLElement;
    this.updateValueFromPointer(e, track);
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    const track = e.currentTarget as HTMLElement;
    try {
      track.releasePointerCapture(e.pointerId);
    } catch (_) {}
    this.commitValue();
  }

  private updateValueFromPointer(e: PointerEvent, track: HTMLElement): void {
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    this.localValue = percent;
  }

  private commitValue(): void {
    if (this.localValue === null || !this.hass) return;
    const val = this.localValue;

    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      const domain = this.entity.domain;
      const entityId = this.entity.entity_id;

      if (domain === 'light') {
        if (val === 0) {
          this.hass.callService('light', 'turn_off', { entity_id: entityId });
        } else {
          this.hass.callService('light', 'turn_on', {
            entity_id: entityId,
            brightness_pct: val,
          });
        }
      } else if (domain === 'cover') {
        this.hass.callService('cover', 'set_cover_position', {
          entity_id: entityId,
          position: val,
        });
      } else if (domain === 'fan') {
        if (val === 0) {
          this.hass.callService('fan', 'turn_off', { entity_id: entityId });
        } else {
          this.hass.callService('fan', 'set_percentage', {
            entity_id: entityId,
            percentage: val,
          });
        }
      }

      this.localValue = null;
    }, 150);
  }

  private renderEditControls() {
    return html`
      <div class="edit-controls" @click="${(e: Event) => e.stopPropagation()}">
        <button class="edit-btn" @click="${() => this.changeSize('1x1')}">1x1</button>
        <button class="edit-btn" @click="${() => this.changeSize('2x2')}">2x2</button>
        <button class="edit-btn" @click="${this.cycleProtection}">🛡️</button>
        <button class="edit-btn" @click="${this.toggleHide}">👁️</button>
      </div>
    `;
  }

  private changeSize(newSize: '1x1' | '2x2'): void {
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
