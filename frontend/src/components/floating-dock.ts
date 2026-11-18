/**
 * HomeSmart - Floating Capsule Dock & Edit FAB
 * Centered floating pill dock with smooth active slider and bottom-right edit button
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DockTabId, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-floating-dock')
export class HomeSmartFloatingDock extends LitElement {
  @property({ type: String }) activeTab: DockTabId = 'home';
  @property({ type: Boolean }) editMode = false;
  @property({ type: String }) locale: LocaleId = 'vi';

  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 24px;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: 900;
    }

    .dock-container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      box-sizing: border-box;
    }

    /* Floating Center Capsule Bar */
    .capsule-dock {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 6px;
      border-radius: 30px;
      background: var(--hs-sidebar-bg, rgba(14, 24, 44, 0.78));
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.12));
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.2);
    }

    .dock-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 24px;
      border: none;
      background: transparent;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.6));
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      outline: none;
      user-select: none;
    }

    .dock-tab:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .dock-tab.active {
      background: #ffffff;
      color: #070e1c;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }

    /* Floating Edit Action Button (Bottom-Right) */
    .edit-fab {
      pointer-events: auto;
      position: absolute;
      right: 28px;
      bottom: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--hs-sidebar-bg, rgba(14, 24, 44, 0.8));
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.15));
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: all 0.2s ease;
      outline: none;
    }

    .edit-fab:hover,
    .edit-fab.active {
      background: var(--hs-accent, #38bdf8);
      color: #070e1c;
      transform: scale(1.08);
      border-color: transparent;
      box-shadow: 0 0 20px var(--hs-glow-color, rgba(56, 189, 248, 0.4));
    }

    @media (max-width: 600px) {
      .dock-tab {
        padding: 7px 12px;
        font-size: 11px;
        gap: 5px;
      }
      .edit-fab {
        right: 14px;
        width: 38px;
        height: 38px;
      }
    }
  `;

  render() {
    return html`
      <div class="dock-container">
        <!-- Center Floating Capsule -->
        <nav class="capsule-dock">
          <button
            class="dock-tab ${this.activeTab === 'home' ? 'active' : ''}"
            @click="${() => this.selectTab('home')}"
          >
            ${renderIcon('home-outline', 16)}
            <span>${t('tab_home', this.locale)}</span>
          </button>

          <button
            class="dock-tab ${this.activeTab === 'rooms' ? 'active' : ''}"
            @click="${() => this.selectTab('rooms')}"
          >
            ${renderIcon('devices', 16)}
            <span>${t('tab_rooms', this.locale)}</span>
          </button>

          <button
            class="dock-tab ${this.activeTab === 'media' ? 'active' : ''}"
            @click="${() => this.selectTab('media')}"
          >
            ${renderIcon('television-ambient-light', 16)}
            <span>${t('tab_media', this.locale)}</span>
          </button>

          <button
            class="dock-tab ${this.activeTab === 'security' ? 'active' : ''}"
            @click="${() => this.selectTab('security')}"
          >
            ${renderIcon('shield-check', 16)}
            <span>${t('tab_security', this.locale)}</span>
          </button>
        </nav>

        <!-- Bottom-Right Floating Edit Button -->
        <button
          class="edit-fab ${this.editMode ? 'active' : ''}"
          title="${t('visual_editor', this.locale)}"
          @click="${this.toggleEdit}"
        >
          ${renderIcon('cog', 18)}
        </button>
      </div>
    `;
  }

  private selectTab(tab: DockTabId): void {
    this.dispatchEvent(
      new CustomEvent('switch-dock-tab', {
        bubbles: true,
        composed: true,
        detail: { tab },
      })
    );
  }

  private toggleEdit(): void {
    this.dispatchEvent(
      new CustomEvent('toggle-edit-mode', {
        bubbles: true,
        composed: true,
      })
    );
  }
}
