/**
 * HomeSmart - Responsive Navigation (Tablet/PC Left Sidebar + Mobile Bottom Bar)
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DeviceViewport, DiscoveredArea, LocaleId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-sidebar-nav')
export class HomeSmartSidebarNav extends LitElement {
  @property({ type: Array }) areas: DiscoveredArea[] = [];
  @property({ type: String }) selectedAreaId: string = '';
  @property({ type: String }) device: DeviceViewport = 'desktop';
  @property({ type: String }) locale: LocaleId = 'vi';
  @property({ type: Number }) lightsOn = 0;
  @property({ type: Number }) totalActive = 0;
  @property({ type: Boolean }) editMode = false;

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      z-index: 100;
    }

    /* Desktop / Tablet Left Sidebar */
    .sidebar-wrapper {
      width: 260px;
      height: 100vh;
      position: sticky;
      top: 0;
      background: var(--hs-sidebar-bg, rgba(13, 10, 33, 0.75));
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-right: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.12));
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 16px;
      box-sizing: border-box;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .brand-title {
      font-size: 19px;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      letter-spacing: -0.5px;
    }

    .brand-version {
      font-size: 10px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.15);
      padding: 2px 6px;
      border-radius: 6px;
      margin-left: 4px;
    }

    /* Area List */
    .nav-list {
      flex: 1;
      overflow-y: auto;
      margin: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: var(--hs-radius-md, 16px);
      background: transparent;
      border: 1px solid transparent;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      cursor: pointer;
      transition: all var(--hs-transition-fast, 0.15s ease);
      text-decoration: none;
      outline: none;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .nav-item.active {
      background: var(--hs-glass-bg-active, rgba(45, 36, 92, 0.85));
      border-color: var(--hs-glass-border-active, rgba(0, 242, 254, 0.65));
      color: #ffffff;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.35));
    }

    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .nav-label {
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-badge {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.12);
      padding: 2px 7px;
      border-radius: 10px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.6));
    }

    .nav-item.active .nav-badge {
      background: var(--hs-accent, #00f2fe);
      color: #000;
      font-weight: 700;
    }

    /* Footer / Summary */
    .sidebar-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stats-chip-row {
      display: flex;
      gap: 8px;
    }

    .stat-chip {
      flex: 1;
      padding: 8px 10px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-val {
      font-size: 16px;
      font-weight: 800;
      color: var(--hs-accent, #00f2fe);
      font-family: var(--hs-font-display, sans-serif);
    }

    .stat-lbl {
      font-size: 10px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .edit-toggle-btn {
      width: 100%;
      padding: 10px 14px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .edit-toggle-btn:hover,
    .edit-toggle-btn.editing {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    /* Mobile Bottom Navigation Bar */
    .mobile-bar {
      position: fixed;
      bottom: 12px;
      left: 12px;
      right: 12px;
      height: 64px;
      background: var(--hs-sidebar-bg, rgba(13, 10, 33, 0.88));
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.18));
      border-radius: 24px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      box-sizing: border-box;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      overflow-x: auto;
      gap: 4px;
    }

    .mobile-tab {
      flex: 1;
      min-width: 68px;
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      border-radius: 16px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      background: transparent;
      border: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .mobile-tab.active {
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.12);
    }

    .mobile-tab-label {
      font-size: 10px;
      font-weight: 600;
    }

    .mobile-gear {
      min-width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
  `;

  render() {
    if (this.device === 'phone') {
      return this.renderMobileBar();
    }
    return this.renderDesktopSidebar();
  }

  private renderDesktopSidebar() {
    return html`
      <div class="sidebar-wrapper">
        <div>
          <div class="brand-header">
            <div class="brand-logo">
              ${renderIcon('shield-home', 22)}
            </div>
            <span class="brand-title">${t('app_title', this.locale)}</span>
            <span class="brand-version">PRO</span>
          </div>

          <div class="nav-list">
            <!-- All Areas tab -->
            <button
              class="nav-item ${this.selectedAreaId === '' ? 'active' : ''}"
              @click="${() => this.selectArea('')}"
            >
              <div class="nav-item-left">
                ${renderIcon('home-outline', 20)}
                <span class="nav-label">${t('all_areas', this.locale)}</span>
              </div>
            </button>

            <!-- Specific Areas -->
            ${this.areas.map(
              (area) => html`
                <button
                  class="nav-item ${this.selectedAreaId === area.id ? 'active' : ''}"
                  @click="${() => this.selectArea(area.id)}"
                >
                  <div class="nav-item-left">
                    ${renderIcon(area.icon, 20)}
                    <span class="nav-label">${area.name}</span>
                  </div>
                  <span class="nav-badge">${area.entities.length}</span>
                </button>
              `
            )}
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="stats-chip-row">
            <div class="stat-chip">
              <span class="stat-val">${this.lightsOn}</span>
              <span class="stat-lbl">${t('lights_active', this.locale)}</span>
            </div>
            <div class="stat-chip">
              <span class="stat-val">${this.totalActive}</span>
              <span class="stat-lbl">${t('devices_active', this.locale)}</span>
            </div>
          </div>

          <button
            class="edit-toggle-btn ${this.editMode ? 'editing' : ''}"
            @click="${this.toggleEdit}"
          >
            ${renderIcon('cog', 18)}
            <span>${this.editMode ? t('exit_edit', this.locale) : t('visual_editor', this.locale)}</span>
          </button>
        </div>
      </div>
    `;
  }

  private renderMobileBar() {
    return html`
      <div class="mobile-bar">
        <button
          class="mobile-tab ${this.selectedAreaId === '' ? 'active' : ''}"
          @click="${() => this.selectArea('')}"
        >
          ${renderIcon('home-outline', 18)}
          <span class="mobile-tab-label">${t('all_areas', this.locale)}</span>
        </button>

        ${this.areas.map(
          (area) => html`
            <button
              class="mobile-tab ${this.selectedAreaId === area.id ? 'active' : ''}"
              @click="${() => this.selectArea(area.id)}"
            >
              ${renderIcon(area.icon, 18)}
              <span class="mobile-tab-label">${area.name}</span>
            </button>
          `
        )}

        <button class="mobile-gear" @click="${this.toggleEdit}">
          ${renderIcon('cog', 18)}
        </button>
      </div>
    `;
  }

  private selectArea(id: string): void {
    this.dispatchEvent(
      new CustomEvent('area-selected', {
        bubbles: true,
        composed: true,
        detail: { areaId: id },
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
