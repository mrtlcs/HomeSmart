import { useEffect, useState } from "react";
import type { TranslationKey } from "../i18n";
import type { HomeAssistant } from "../types/home-assistant";
import { HDIcon } from "./HDIcon";

interface ReleaseItem {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  zip_url: string;
}

export function VersionModal({
  currentVersion,
  hass,
  onClose,
  t,
}: {
  currentVersion?: string;
  hass: HomeAssistant;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function fetchReleases() {
      try {
        const res = await hass.connection.sendMessagePromise<{
          current_version: string;
          releases: ReleaseItem[];
        }>({
          type: "homesmart/releases/list",
        });
        if (!cancelled && res?.releases) {
          setReleases(res.releases);
        }
      } catch (err) {
        if (!cancelled) {
          setReleases([
            {
              body: `${t("versionReleaseLabel")} v2.0.0`,
              name: "v2.0.0 - Next-Gen Adaptive Dashboard (Circadian, Bento, AI Insights)",
              published_at: "2026-11-25",
              tag_name: "v2.0.0",
              zip_url: "https://github.com/mrtlcs/HomeSmart/releases/download/v2.0.0/homesmart.zip",
            },
            {
              body: `${t("versionReleaseLabel")} v1.6.3`,
              name: "v1.6.3 - System Monitor Styles & Multi-Language Sync",
              published_at: "2026-11-25",
              tag_name: "v1.6.3",
              zip_url: "https://github.com/mrtlcs/HomeSmart/releases/download/v1.6.3/homesmart.zip",
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReleases();
    return () => {
      cancelled = true;
    };
  }, [hass.connection]);

  const switchVersion = async (tag: string) => {
    setInstalling(tag);
    setError(null);
    setSuccess(null);
    try {
      const res = await hass.connection.sendMessagePromise<{
        success: boolean;
        version: string;
        message: string;
      }>({
        tag,
        type: "homesmart/version/switch",
      });
      if (res?.success) {
        setSuccess(tag);
      } else {
        setError(t("versionInstallError"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("versionFetchError"));
    } finally {
      setInstalling(null);
    }
  };

  const curr = (currentVersion ?? "").trim().replace(/^v/, "");

  return (
    <div
      aria-labelledby="hd-version-title"
      aria-modal="true"
      className="hd-sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section className="hd-sheet hd-version-sheet" style={{ maxWidth: 640 }}>
        <header className="hd-pro__header" style={{ marginBottom: "calc(var(--u) * 1.6)" }}>
          <span className="hd-pro__mark" style={{ background: "rgba(59, 130, 246, 0.18)", color: "#3b82f6" }}>
            <HDIcon name="refresh" size={22} />
          </span>
          <div>
            <span className="eyebrow">{t("versionManage")}</span>
            <h2 id="hd-version-title">{t("versionChoose")}</h2>
          </div>
          <button aria-label={t("close")} className="hd-close" onClick={onClose} type="button">
            <HDIcon name="close" size={20} />
          </button>
        </header>

        {success ? (
          <div className="hd-version-success" style={{ textAlign: "center", padding: "calc(var(--u) * 2) 0" }}>
            <div style={{ fontSize: "calc(var(--u) * 3)", marginBottom: "calc(var(--u) * 1)" }}>🎉</div>
            <h3 style={{ margin: "0 0 calc(var(--u) * 0.8)", fontSize: "calc(var(--u) * 2)" }}>
              {t("versionInstallSuccess").replace("{version}", success)}
            </h3>
            <p style={{ opacity: 0.8, fontSize: "calc(var(--u) * 1.4)", marginBottom: "calc(var(--u) * 2)" }}>
              {t("versionRestartHint")}
            </p>
            <button
              className="hd-pill hd-pill--primary"
              onClick={() => window.location.reload()}
              style={{ padding: "calc(var(--u) * 1) calc(var(--u) * 2.4)", fontSize: "calc(var(--u) * 1.5)" }}
              type="button"
            >
              {t("reloadPage")}
            </button>
          </div>
        ) : (
          <div className="hd-version-body">
            <div
              className="hd-version-current-banner"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                padding: "calc(var(--u) * 1.2) calc(var(--u) * 1.6)",
                borderRadius: "var(--hd-round, 12px)",
                marginBottom: "calc(var(--u) * 1.6)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {t("versionInstalled")}: <strong>v{curr || "1.5.0"}</strong>
              </span>
              <span className="sys-health-pill" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.16)" }}>
                ● {t("versionActive")}
              </span>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.16)",
                  color: "#ef4444",
                  padding: "calc(var(--u) * 1) calc(var(--u) * 1.4)",
                  borderRadius: "var(--hd-round, 10px)",
                  marginBottom: "calc(var(--u) * 1.4)",
                  fontSize: "calc(var(--u) * 1.3)",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "calc(var(--u) * 3) 0", opacity: 0.7 }}>
                <span className="mini-spinner" style={{ marginRight: 8 }} />
                {t("loadingShort")}
              </div>
            ) : (
              <div
                className="hd-version-list"
                style={{
                  maxHeight: 380,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "calc(var(--u) * 1.2)",
                  paddingRight: 4,
                }}
              >
                {releases.map((rel) => {
                  const tagNorm = rel.tag_name.replace(/^v/, "");
                  const isCurrent = tagNorm === curr;
                  const isBusy = installing === rel.tag_name;

                  return (
                    <div
                      key={rel.tag_name}
                      style={{
                        background: isCurrent ? "rgba(59, 130, 246, 0.08)" : "var(--paper-2, rgba(255, 255, 255, 0.05))",
                        border: isCurrent ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "var(--hd-round, 14px)",
                        padding: "calc(var(--u) * 1.4)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "calc(var(--u) * 1.2)",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <strong style={{ fontSize: "calc(var(--u) * 1.6)" }}>{rel.tag_name}</strong>
                          {rel.published_at && (
                            <small style={{ opacity: 0.6 }}>{rel.published_at.slice(0, 10)}</small>
                          )}
                        </div>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "calc(var(--u) * 1.3)",
                            opacity: 0.8,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {rel.name || rel.body.slice(0, 80)}
                        </p>
                      </div>

                      <div>
                        {isCurrent ? (
                          <span
                            className="hd-pill"
                            style={{ opacity: 0.7, cursor: "default", border: "1px solid rgba(255,255,255,0.15)" }}
                          >
                            ✓ {t("versionCurrent")}
                          </span>
                        ) : (
                          <button
                            className="hd-pill hd-pill--primary"
                            disabled={Boolean(installing)}
                            onClick={() => switchVersion(rel.tag_name)}
                            type="button"
                          >
                            {isBusy ? (
                              <>
                                <span className="mini-spinner" style={{ marginRight: 6 }} />
                                {t("versionInstalling")}
                              </>
                            ) : (
                              t("versionInstall")
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: "calc(var(--u) * 1.8)",
                paddingTop: "calc(var(--u) * 1.2)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "calc(var(--u) * 1.2)",
                opacity: 0.7,
                lineHeight: 1.4,
              }}
            >
              💡 {t("versionHacsHint")}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
