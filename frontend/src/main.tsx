import { pauseCameras } from "./cameraPause";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App";
import { installFonts } from "./fonts";
import { styles } from "./styles";
import { scaleFonts } from "./cssScale";
import { theme } from "./theme";
import { themeEditing } from "./theme-editing";
import { themeExtras } from "./theme-extras";
import { themePlan } from "./theme-plan";
import { themeLayouts } from "./theme-layouts";
import { themeKids } from "./theme-kids";
import { themePhoto } from "./theme-photo";
import { CIRCADIAN_OVERLAY_CSS } from "./circadian";
import { ROOM_POPUP_CSS } from "./components/RoomPopup";
import { ENERGY_FLOW_CSS } from "./components/EnergyFlowCard";
import { themeV2 } from "./theme-v2";
import type { HomeAssistant, HomeSmartPanelInfo } from "./types/home-assistant";
import { hideSidebar, hideSidebarPreferred, restoreSidebar } from "./sidebar";
import { hidePageScrollbars } from "./scrollbars";
import { inDesktopApp } from "./desktop";

class PanelErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[HomeSmart] Frontend crash caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="screen center-state" style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#fff" }}>
          <span style={{ fontSize: 36, marginBottom: 12 }}>⚠️</span>
          <h2 style={{ fontSize: "1.4rem", margin: "0 0 8px 0" }}>HomeSmart</h2>
          <p style={{ maxWidth: 480, margin: "0 0 20px 0", opacity: 0.85, fontSize: "0.95rem", lineHeight: 1.5 }}>
            {this.state.error?.message || "Đã xảy ra lỗi hiển thị giao diện."}
          </p>
          <button
            className="primary-button"
            style={{ padding: "10px 24px", borderRadius: 12, cursor: "pointer", fontSize: "0.95rem" }}
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            type="button"
          >
            Tải lại trang (Reload)
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

class HomeSmartPanel extends HTMLElement {
  private _hass?: HomeAssistant;
  private _panel?: HomeSmartPanelInfo;
  private readonly root: Root;
  private showScrollbars?: () => void;

  constructor() {
    super();
    installFonts();
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = scaleFonts(`@layer legacy{${styles}}${theme}${themeEditing}${themeExtras}${themePlan}${themeLayouts}${themeKids}${themePhoto}${CIRCADIAN_OVERLAY_CSS}${ROOM_POPUP_CSS}${ENERGY_FLOW_CSS}${themeV2}`);
    const mount = document.createElement("div");
    shadow.append(style, mount);
    this.root = createRoot(mount);
  }

  set hass(value: HomeAssistant) {
    const first = !this._hass;
    this._hass = value;
    this.renderPanel();
    if (first) this.applySidebar();
  }

  set panel(value: HomeSmartPanelInfo) {
    this._panel = value;
    this.renderPanel();
  }

  connectedCallback() {
    pauseCameras("panel-closed", false);
    this.renderPanel();
    window.addEventListener("homesmart-sidebar-pref", this.applySidebar);
    this.applySidebar();
    this.showScrollbars?.();
    this.showScrollbars = hidePageScrollbars(this);
  }

  disconnectedCallback() {
    pauseCameras("panel-closed", true);
    window.removeEventListener("homesmart-sidebar-pref", this.applySidebar);
    this.showScrollbars?.();
    this.showScrollbars = undefined;
    restoreSidebar(document.querySelector("home-assistant") ?? document.body);
  }

  private readonly applySidebar = () => {
    if (!this.isConnected) return;
    if (hideSidebarPreferred() || inDesktopApp()) hideSidebar(this, this._hass?.dockedSidebar);
    else restoreSidebar(this);
  };

  private renderPanel() {
    if (!this._hass) return;
    this.root.render(
      <PanelErrorBoundary>
        <App hass={this._hass} version={this._panel?.config?.version} />
      </PanelErrorBoundary>
    );
  }
}

if (!customElements.get("homesmart-panel")) {
  customElements.define("homesmart-panel", HomeSmartPanel);
  watchForUpdates();
}

function watchForUpdates() {
  type Connection = { addEventListener: (event: string, listener: () => void) => void; sendMessagePromise: <T>(message: Record<string, unknown>) => Promise<T> };
  type Panels = Record<string, { config?: { _panel_custom?: { module_url?: string } } | null }>;
  const connection = (window as unknown as { hassConnection?: Promise<{ conn: Connection }> }).hassConnection;
  if (!connection) return;
  const moduleOf = (panels: Panels) => panels?.homesmart?.config?._panel_custom?.module_url;
  void connection.then(({ conn }) => {
    let loaded: string | undefined;
    void conn.sendMessagePromise<Panels>({ type: "get_panels" }).then((panels) => { loaded = moduleOf(panels); }).catch(() => undefined);
    let dropped = false;
    conn.addEventListener("disconnected", () => { dropped = true; });
    conn.addEventListener("ready", () => {
      if (!dropped) return;
      dropped = false;
      let tries = 0;
      const check = () => {
        tries += 1;
        void conn.sendMessagePromise<Panels>({ type: "get_panels" }).then((panels) => {
          const now = moduleOf(panels);
          if (!now) { if (tries < 10) window.setTimeout(check, 3000); else reloadOnce("missing"); return; }
          if (loaded && now !== loaded) reloadOnce(now);
          loaded = now;
        }).catch(() => { if (tries < 10) window.setTimeout(check, 3000); });
      };
      window.setTimeout(check, 1500);
    });
  }).catch(() => undefined);
}

function reloadOnce(target: string) {
  if (!window.location.pathname.startsWith("/homesmart")) return;
  const key = "homesmart-reloaded-for";
  try {
    const last = JSON.parse(window.sessionStorage.getItem(key) ?? "null") as { target: string; at: number } | null;
    if (last && last.target === target && Date.now() - last.at < 60_000) return;
    window.sessionStorage.setItem(key, JSON.stringify({ target, at: Date.now() }));
  } catch { /* reload anyway */ }
  window.location.reload();
}
