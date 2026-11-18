/**
 * HomeSmart - In-App Visual Editor Toolbar
 * Synced across devices via Home Assistant WebSocket API
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeSmartConfig, LayoutMode, LocaleId, ThemeId } from '../types';
import { t } from '../locales/i18n';
import { renderIcon } from './icons';

@customElement('homesmart-visual-editor-bar')
export class HomeSmartVisualEditorBar extends LitElement {
  @property({ type: Object }) config!: HomeSmartConfig;
  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) showHidden = false;
  @property({ type: String }) locale: LocaleId = 'vi';

  @state() private saving = false;
  @state() private saveStatus = '';

  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 900;
    }

    .editor-drawer {
      background: rgba(10, 8, 22, 0.92);
      backdrop-filter: blur(28px) saturate(200%);
      -webkit-backdrop-filter: blur(28px) saturate(200%);
      border-bottom: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.15));
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
      padding: 16px 24px;
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .section-group {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .control-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .control-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pills-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.06);
      padding: 3px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .pill-btn {
      padding: 6px 12px;
      border-radius: 10px;
      background: transparent;
      border: none;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .pill-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .pill-btn.active {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 12px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    .theme-color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot-midnight { background: #38bdf8; }
    .dot-aurora { background: #00f2fe; }
    .dot-ocean { background: #0072ff; }
    .dot-wine { background: #ff4b72; }
    .dot-graphite { background: #94a3b8; }
    .dot-emerald { background: #00f5a0; }
    .dot-sunset { background: #ff7e5f; }

    /* Actions Group */
    .actions-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      padding: 10px 18px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .btn-save {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .btn-save:hover {
      transform: translateY(-1px);
      filter: brightness(1.1);
    }

    .status-msg {
      font-size: 12px;
      font-weight: 600;
      color: #00f5a0;
      animation: fadeIn 0.3s ease;
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  render() {
    if (!this.open) return html``;

    const themes: { id: ThemeId; dotClass: string; name: string }[] = [
      { id: 'midnight', dotClass: 'dot-midnight', name: 'Midnight' },
      { id: 'aurora', dotClass: 'dot-aurora', name: 'Aurora' },
      { id: 'ocean', dotClass: 'dot-ocean', name: 'Ocean' },
      { id: 'wine', dotClass: 'dot-wine', name: 'Wine' },
      { id: 'graphite', dotClass: 'dot-graphite', name: 'Graphite' },
      { id: 'emerald', dotClass: 'dot-emerald', name: 'Emerald' },
      { id: 'sunset', dotClass: 'dot-sunset', name: 'Sunset' },
    ];

    const layouts: { id: LayoutMode; label: string }[] = [
      { id: 'auto', label: 'Auto' },
      { id: 'deck', label: 'Deck' },
      { id: 'sidebar', label: 'Sidebar' },
      { id: 'focus', label: 'Focus' },
      { id: 'grid', label: 'Grid' },
      { id: 'tv', label: 'TV' },
    ];

    const timeouts = [60, 180, 300, 600];

    return html`
      <div class="editor-drawer">
        <div class="section-group">
          <!-- Theme Picker -->
          <div class="control-item">
            <span class="control-label">${t('theme_select', this.locale)}</span>
            <div class="pills-group">
              ${themes.map(
                (thm) => html`
                  <button
                    class="pill-btn ${this.config.theme === thm.id ? 'active' : ''}"
                    @click="${() => this.changeTheme(thm.id)}"
                  >
                    <span class="theme-color-dot ${thm.dotClass}"></span>
                    <span>${thm.name}</span>
                  </button>
                `
              )}
            </div>
          </div>

          <!-- Layout Picker -->
          <div class="control-item">
            <span class="control-label">${t('layout_select', this.locale)}</span>
            <div class="pills-group">
              ${layouts.map(
                (lay) => html`
                  <button
                    class="pill-btn ${this.config.layout === lay.id ? 'active' : ''}"
                    @click="${() => this.changeLayout(lay.id)}"
                  >
                    ${lay.label}
                  </button>
                `
              )}
            </div>
          </div>

          <!-- Screensaver Timeout -->
          <div class="control-item">
            <span class="control-label">${t('screensaver_timeout', this.locale)}</span>
            <div class="pills-group">
              ${timeouts.map(
                (sec) => html`
                  <button
                    class="pill-btn ${this.config.screensaver.timeout_seconds === sec ? 'active' : ''}"
                    @click="${() => this.changeScreensaverTimeout(sec)}"
                  >
                    ${sec / 60}m
                  </button>
                `
              )}
            </div>
          </div>

          <!-- Language Picker -->
          <div class="control-item">
            <span class="control-label">${t('language_select', this.locale)}</span>
            <div class="pills-group">
              <button
                class="pill-btn ${this.config.locale === 'vi' ? 'active' : ''}"
                @click="${() => this.changeLanguage('vi')}"
              >
                Tiếng Việt
              </button>
              <button
                class="pill-btn ${this.config.locale === 'en' ? 'active' : ''}"
                @click="${() => this.changeLanguage('en')}"
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div class="actions-group">
          <button class="action-btn btn-secondary" @click="${this.toggleShowHidden}">
            ${renderIcon(this.showHidden ? 'eye-off' : 'eye', 18)}
            <span>${this.showHidden ? 'Ẩn thẻ đã ẩn' : t('show_all_hidden', this.locale)}</span>
          </button>

          <button class="action-btn btn-save" ?disabled="${this.saving}" @click="${this.saveConfig}">
            ${renderIcon('check', 18)}
            <span>${this.saving ? t('saving', this.locale) : t('save_sync', this.locale)}</span>
          </button>

          ${this.saveStatus ? html`<span class="status-msg">${this.saveStatus}</span>` : ''}
        </div>
      </div>
    `;
  }

  private changeTheme(theme: ThemeId): void {
    this.dispatchEvent(
      new CustomEvent('update-dashboard-config', {
        bubbles: true,
        composed: true,
        detail: { theme },
      })
    );
  }

  private changeLayout(layout: LayoutMode): void {
    this.dispatchEvent(
      new CustomEvent('update-dashboard-config', {
        bubbles: true,
        composed: true,
        detail: { layout },
      })
    );
  }

  private changeScreensaverTimeout(seconds: number): void {
    this.dispatchEvent(
      new CustomEvent('update-dashboard-config', {
        bubbles: true,
        composed: true,
        detail: {
          screensaver: {
            ...this.config.screensaver,
            timeout_seconds: seconds,
          },
        },
      })
    );
  }

  private changeLanguage(locale: LocaleId): void {
    this.dispatchEvent(
      new CustomEvent('update-dashboard-config', {
        bubbles: true,
        composed: true,
        detail: { locale },
      })
    );
  }

  private toggleShowHidden(): void {
    this.dispatchEvent(
      new CustomEvent('toggle-show-hidden', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private async saveConfig(): Promise<void> {
    this.saving = true;
    this.saveStatus = '';

    this.dispatchEvent(
      new CustomEvent('request-save-config', {
        bubbles: true,
        composed: true,
        detail: {
          onSuccess: () => {
            this.saving = false;
            this.saveStatus = t('saved_success', this.locale);
            setTimeout(() => {
              this.saveStatus = '';
            }, 3000);
          },
          onError: () => {
            this.saving = false;
            this.saveStatus = t('save_error', this.locale);
          },
        },
      })
    );
  }
}
