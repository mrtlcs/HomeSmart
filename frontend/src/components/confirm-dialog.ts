/**
 * HomeSmart - Protected Card Confirmation & PIN Modal
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocaleId, ProtectedCardConfig } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-confirm-dialog')
export class HomeSmartConfirmDialog extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: Object }) protection: ProtectedCardConfig = { type: 'confirm' };
  @property({ type: String }) entityName = '';
  @property({ type: String }) entityIcon = 'mdi:shield-check';
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private enteredPin = '';
  @state() private isShaking = false;
  @state() private errorMessage = '';

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
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      padding: 16px;
      box-sizing: border-box;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-box {
      width: 100%;
      max-width: 380px;
      background: var(--hs-glass-bg, rgba(20, 16, 40, 0.85));
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.2));
      border-radius: var(--hs-radius-xl, 32px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px var(--hs-glow-color, rgba(0, 242, 254, 0.3));
      padding: 28px 24px;
      box-sizing: border-box;
      text-align: center;
      transform: scale(0.92);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      color: #fff;
    }

    .modal-overlay.open .modal-box {
      transform: scale(1);
    }

    .icon-badge {
      width: 60px;
      height: 60px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
      color: #000;
    }

    .title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px;
      font-family: var(--hs-font-display, sans-serif);
    }

    .subtitle {
      font-size: 14px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      margin: 0 0 20px;
      line-height: 1.4;
    }

    /* PIN Dots */
    .pin-display {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 20px 0 24px;
    }

    .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--hs-accent, #00f2fe);
      background: transparent;
      transition: all 0.2s ease;
    }

    .pin-dot.filled {
      background: var(--hs-accent, #00f2fe);
      box-shadow: 0 0 12px var(--hs-accent, #00f2fe);
      transform: scale(1.15);
    }

    /* Keypad */
    .keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-width: 280px;
      margin: 0 auto 20px;
    }

    .key-btn {
      aspect-ratio: 1;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 22px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      outline: none;
    }

    .key-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: var(--hs-accent, #00f2fe);
      transform: scale(1.05);
    }

    .key-btn:active {
      transform: scale(0.95);
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }

    .key-btn.action {
      font-size: 14px;
      background: transparent;
      border-color: transparent;
    }

    /* Action Buttons */
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .btn {
      flex: 1;
      padding: 12px 18px;
      border-radius: var(--hs-radius-md, 16px);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      outline: none;
      transition: all 0.2s ease;
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .btn-confirm {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    .btn-confirm:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    /* Error Shake */
    .shake {
      animation: shake 0.4s ease-in-out;
    }

    .error-text {
      color: #ff4b72;
      font-size: 13px;
      margin-top: 8px;
      min-height: 18px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }
  `;

  render() {
    if (!this.open) return html``;

    const isPinMode = this.protection.type === 'pin';

    return html`
      <div class="modal-overlay ${this.open ? 'open' : ''}" @click="${this.handleBackdropClick}">
        <div class="modal-box ${this.isShaking ? 'shake' : ''}" @click="${(e: Event) => e.stopPropagation()}">
          <div class="icon-badge">
            ${renderIcon(this.entityIcon, 32)}
          </div>

          <h3 class="title">${isPinMode ? t('pin_title', this.locale) : t('confirm_title', this.locale)}</h3>
          <p class="subtitle">
            ${isPinMode ? t('pin_msg', this.locale) : t('confirm_msg', this.locale)}
            <br />
            <strong>${this.entityName}</strong>
          </p>

          ${isPinMode
            ? html`
                <div class="pin-display">
                  ${[0, 1, 2, 3].map(
                    (idx) => html`
                      <div class="pin-dot ${idx < this.enteredPin.length ? 'filled' : ''}"></div>
                    `
                  )}
                </div>

                <div class="keypad">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                    (num) => html`
                      <button class="key-btn" @click="${() => this.handleNumberClick(num.toString())}">
                        ${num}
                      </button>
                    `
                  )}
                  <button class="key-btn action" @click="${this.handleClear}">
                    ${t('clear', this.locale)}
                  </button>
                  <button class="key-btn" @click="${() => this.handleNumberClick('0')}">0</button>
                  <button class="key-btn action" @click="${this.handleBackspace}">
                    ${renderIcon('arrow-left', 20)}
                  </button>
                </div>

                <div class="error-text">${this.errorMessage}</div>
              `
            : ''}

          <div class="actions">
            <button class="btn btn-cancel" @click="${this.handleCancel}">
              ${t('cancel', this.locale)}
            </button>
            ${!isPinMode
              ? html`
                  <button class="btn btn-confirm" @click="${this.handleConfirmSuccess}">
                    ${t('confirm', this.locale)}
                  </button>
                `
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  private handleNumberClick(num: string): void {
    if (this.enteredPin.length >= 4) return;
    this.errorMessage = '';
    this.enteredPin += num;

    if (this.enteredPin.length === 4) {
      this.validatePin();
    }
  }

  private handleBackspace(): void {
    this.errorMessage = '';
    this.enteredPin = this.enteredPin.slice(0, -1);
  }

  private handleClear(): void {
    this.errorMessage = '';
    this.enteredPin = '';
  }

  private validatePin(): void {
    const requiredPin = this.protection.pin || '1234';
    if (this.enteredPin === requiredPin) {
      this.handleConfirmSuccess();
    } else {
      this.isShaking = true;
      this.errorMessage = t('incorrect_pin', this.locale);
      setTimeout(() => {
        this.isShaking = false;
        this.enteredPin = '';
      }, 500);
    }
  }

  private handleConfirmSuccess(): void {
    this.enteredPin = '';
    this.errorMessage = '';
    this.dispatchEvent(new CustomEvent('confirm-success', { bubbles: true, composed: true }));
  }

  private handleCancel(): void {
    this.enteredPin = '';
    this.errorMessage = '';
    this.dispatchEvent(new CustomEvent('confirm-cancel', { bubbles: true, composed: true }));
  }

  private handleBackdropClick(): void {
    this.handleCancel();
  }
}
