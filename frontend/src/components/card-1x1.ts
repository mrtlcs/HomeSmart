/**
 * HomeSmart - Standard 1x1 Bento Card
 * Supports: Light, Switch, Fan, Lock, Sensor, Binary Sensor
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DiscoveredEntity, HomeAssistant, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-card-1x1')
export class HomeSmartCard1x1 extends LitElement {
  @property({ type: Object }) hass!: HomeAssistant;
  @property({ type: Object }) entity!: DiscoveredEntity;
  @property({ type: Boolean }) editMode = false;
  @property({ type: String }) locale: LocaleId = 'vi';

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
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
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
      transition: all var(--hs-transition-normal, 0.25s ease);
    }

    .active .icon-container {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .protection-badge {
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.15);
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .bottom-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 12px;
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

    .entity-state {
      font-size: 13px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      font-weight: 400;
    }

    /* Edit Overlay */
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
    const stateLabel = this.computeStateLabel();

    return html`
      <div
        class="glass-card card-inner ${isActive ? 'active' : ''}"
        tabindex="0"
        @click="${this.handleClick}"
      >
        <div class="top-row">
          <div class="icon-container">
            ${renderIcon(this.entity.icon, 24)}
          </div>
          ${this.entity.protection.type !== 'none'
            ? html`
                <div class="protection-badge">
                  ${renderIcon('shield-check', 14)}
                  <span>${this.entity.protection.type === 'pin' ? 'PIN' : '2x'}</span>
                </div>
              `
            : ''}
        </div>

        <div class="bottom-info">
          <span class="entity-name" title="${this.entity.name}">${this.entity.name}</span>
          <span class="entity-state">${stateLabel}</span>
        </div>

        ${this.editMode ? this.renderEditControls() : ''}
      </div>
    `;
  }

  private computeIsActive(): boolean {
    const s = this.entity.state.toLowerCase();
    if (this.entity.domain === 'lock') {
      return s === 'locked';
    }
    return s === 'on' || s === 'open' || s === 'active' || s === 'playing';
  }

  private computeStateLabel(): string {
    const s = this.entity.state;
    const key = `state_${s.toLowerCase()}`;
    const translated = t(key, this.locale);

    // If translated isn't raw key, return it
    if (translated !== key) {
      return translated;
    }

    // For sensors with unit
    if (this.entity.domain === 'sensor' && this.entity.attributes.unit_of_measurement) {
      return `${s} ${this.entity.attributes.unit_of_measurement}`;
    }

    return s;
  }

  private handleClick(e: Event): void {
    if (this.editMode) return;

    if (this.entity.protection.type !== 'none') {
      this.dispatchEvent(
        new CustomEvent('request-protected-action', {
          bubbles: true,
          composed: true,
          detail: {
            entity: this.entity,
            action: () => this.executeToggle(),
          },
        })
      );
      return;
    }

    this.executeToggle();
  }

  private executeToggle(): void {
    if (!this.hass) return;

    const domain = this.entity.domain;
    const entityId = this.entity.entity_id;

    if (domain === 'light' || domain === 'switch' || domain === 'fan') {
      this.hass.callService(domain, 'toggle', { entity_id: entityId });
    } else if (domain === 'lock') {
      const service = this.entity.state === 'locked' ? 'unlock' : 'lock';
      this.hass.callService('lock', service, { entity_id: entityId });
    }
  }

  private renderEditControls() {
    return html`
      <div class="edit-controls" @click="${(e: Event) => e.stopPropagation()}">
        <button
          class="edit-btn"
          title="${t('card_size', this.locale)}"
          @click="${() => this.changeSize('2x1')}"
        >
          2x1
        </button>
        <button
          class="edit-btn"
          title="${t('card_size', this.locale)}"
          @click="${() => this.changeSize('2x2')}"
        >
          2x2
        </button>
        <button
          class="edit-btn"
          title="${t('card_protection', this.locale)}"
          @click="${this.cycleProtection}"
        >
          🛡️
        </button>
        <button
          class="edit-btn"
          title="${t('hide_card', this.locale)}"
          @click="${this.toggleHide}"
        >
          👁️
        </button>
      </div>
    `;
  }

  private changeSize(newSize: '2x1' | '2x2'): void {
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
