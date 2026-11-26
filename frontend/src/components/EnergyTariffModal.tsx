import { useState } from "react";
import { createPortal } from "react-dom";
import type { EnergyTariffConfig, EnergyTier } from "../types/config";
import type { TranslationKey } from "../i18n";
import { HDIcon } from "./HDIcon";
import { HDSegmented, HDSelect } from "./HDSelect";
import { calculateElectricityCost, formatCurrency, validTariff } from "./ExtraWidgets";
import { DEFAULT_ENERGY_TARIFF } from "../api/config";

export const PRESET_EVN_5: EnergyTariffConfig = {
  mode: "tiered",
  flat_rate: 2000,
  currency: "đ",
  currency_position: "suffix",
  vat_percent: 8,
  include_vat: true,
  fixed_monthly_fee: 0,
  preset: "evn_5_tier",
  tiers: [
    { max: 100, rate: 1901, name: "Bậc 1 (0–100 kWh)" },
    { max: 200, rate: 2289, name: "Bậc 2 (101–200 kWh)" },
    { max: 400, rate: 2894, name: "Bậc 3 (201–400 kWh)" },
    { max: 700, rate: 3456, name: "Bậc 4 (401–700 kWh)" },
    { max: null, rate: 3844, name: "Bậc 5 (>700 kWh)" },
  ],
};

export const PRESET_FLAT_VND: EnergyTariffConfig = {
  mode: "flat",
  flat_rate: 2000,
  currency: "đ",
  currency_position: "suffix",
  vat_percent: 8,
  include_vat: true,
  fixed_monthly_fee: 0,
  preset: "flat_vnd",
  tiers: [{ max: null, rate: 2000, name: "Giá cố định" }],
};

export const PRESET_US_FLAT: EnergyTariffConfig = {
  mode: "flat",
  flat_rate: 0.16,
  currency: "$",
  currency_position: "prefix",
  vat_percent: 0,
  include_vat: false,
  fixed_monthly_fee: 10,
  preset: "us_flat",
  tiers: [{ max: null, rate: 0.16, name: "Standard Flat" }],
};

export const PRESET_EU_FLAT: EnergyTariffConfig = {
  mode: "flat",
  flat_rate: 0.3,
  currency: "€",
  currency_position: "suffix",
  vat_percent: 20,
  include_vat: true,
  fixed_monthly_fee: 5,
  preset: "eu_flat",
  tiers: [{ max: null, rate: 0.3, name: "Standard Flat" }],
};

export function EnergyTariffModal({
  currentTariff,
  onClose,
  onSave,
  t,
}: {
  currentTariff?: EnergyTariffConfig;
  onClose: () => void;
  onSave: (tariff: EnergyTariffConfig) => void;
  t: (key: TranslationKey) => string;
}) {
  const [draft, setDraft] = useState<EnergyTariffConfig>(() => ({
    ...DEFAULT_ENERGY_TARIFF,
    ...(currentTariff ?? {}),
    tiers: (currentTariff?.tiers && currentTariff.tiers.length > 0)
      ? currentTariff.tiers.map((t, idx) => ({ ...t, id: t.id ?? `tier-${idx}` }))
      : DEFAULT_ENERGY_TARIFF.tiers.map((t, idx) => ({ ...t, id: `tier-${idx}` })),
  }));

  const [testKwh, setTestKwh] = useState(250);

  const handleApplyPreset = (key: string) => {
    if (key === "evn_5_tier") setDraft(PRESET_EVN_5);
    else if (key === "flat_vnd") setDraft(PRESET_FLAT_VND);
    else if (key === "us_flat") setDraft(PRESET_US_FLAT);
    else if (key === "eu_flat") setDraft(PRESET_EU_FLAT);
    else if (key === "custom") setDraft((cur) => ({ ...cur, preset: "custom" }));
  };

  const handleAddTier = () => {
    const curTiers = draft.tiers ?? [];
    const lastTier = curTiers[curTiers.length - 1];
    const nextMax = (curTiers.at(-2)?.max ?? 0) + 100;
    const newTier: EnergyTier = {
      id: `tier-${Date.now()}`,
      max: null,
      name: t("tariffTierFallback").replace("{n}", String(curTiers.length + 1)),
      rate: (lastTier?.rate ?? 2000) + 200,
    };
    setDraft((cur) => ({
      ...cur,
      preset: "custom",
      tiers: [...cur.tiers.slice(0, -1), { ...lastTier, max: nextMax }, newTier],
    }));
  };

  const handleDeleteTier = (index: number) => {
    if (draft.tiers.length <= 1) return;
    setDraft((cur) => ({
      ...cur,
      preset: "custom",
      tiers: cur.tiers.filter((_, idx) => idx !== index).map((tier, idx) => idx === cur.tiers.length - 2 ? { ...tier, max: null } : tier),
    }));
  };

  const handleUpdateTier = (index: number, patch: Partial<EnergyTier>) => {
    setDraft((cur) => {
      const nextTiers = [...cur.tiers];
      nextTiers[index] = { ...nextTiers[index], ...patch };
      return { ...cur, preset: "custom", tiers: nextTiers };
    });
  };

  // Live simulation result
  const valid = validTariff(draft);
  const sim = valid ? calculateElectricityCost(testKwh, draft, undefined, t) : null;

  return createPortal(
    <div
      aria-modal="true"
      className="hd-modal-backdrop"
      onClick={onClose}
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "grid",
        placeItems: "center",
        padding: "calc(var(--u) * 2)",
      }}
    >
      <div
        className="energy-tariff-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 640px)",
          maxHeight: "90vh",
          background: "var(--paper, #181d24)",
          borderRadius: "calc(var(--u) * 2.2)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.65)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "calc(var(--u) * 1.8) calc(var(--u) * 2.2)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "calc(var(--u) * 2)", fontWeight: 700 }}>
              {t("tariffSettings")}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "calc(var(--u) * 1.3)", opacity: 0.7 }}>
              {t("tariffSettingsDescription")}
            </p>
          </div>
          <button
            aria-label="Close"
            className="hd-close"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: 0,
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--ink)",
            }}
            type="button"
          >
            <HDIcon name="close" size={18} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "calc(var(--u) * 2) calc(var(--u) * 2.2)" }}>
          {/* Preset Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
              {t("tariffPreset")}
            </label>
            <HDSelect
              ariaLabel={t("tariffPreset")}
              onChange={handleApplyPreset}
              options={[
                { value: "evn_5_tier", label: t("tariffPresetEvn5") },
                { value: "flat_vnd", label: t("tariffPresetFlatVnd") },
                { value: "us_flat", label: t("tariffPresetUsFlat") },
                { value: "eu_flat", label: t("tariffPresetEuFlat") },
                { value: "custom", label: t("tariffPresetCustom") },
              ]}
              value={draft.preset ?? "custom"}
            />
          </div>

          {/* Mode Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
              {t("tariffMode")}
            </label>
            <HDSegmented
              ariaLabel={t("tariffMode")}
              onChange={(val) => setDraft((cur) => ({ ...cur, mode: val as "tiered" | "flat", preset: "custom" }))}
              options={[
                { value: "tiered", label: t("tariffTiered") },
                { value: "flat", label: t("tariffFlat") },
              ]}
              value={draft.mode}
            />
          </div>

          {/* Currency & Tax Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
                {t("tariffCurrency")}
              </label>
              <input
                className="st-input st-input--framed"
                onChange={(e) => setDraft((cur) => ({ ...cur, currency: e.target.value, preset: "custom" }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: "14px" }}
                type="text"
                value={draft.currency}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
                {t("tariffCurrencyPos")}
              </label>
              <HDSegmented
                ariaLabel={t("tariffCurrencyPos")}
                onChange={(val) => setDraft((cur) => ({ ...cur, currency_position: val as "prefix" | "suffix", preset: "custom" }))}
                options={[
                  { value: "suffix", label: t("tariffCurrencySuffix") },
                  { value: "prefix", label: t("tariffCurrencyPrefix") },
                ]}
                value={draft.currency_position}
              />
            </div>
          </div>

          {/* VAT & Fixed Fee */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
                {t("tariffVat")}
              </label>
              <input
                className="st-input st-input--framed"
                min={0}
                onChange={(e) => setDraft((cur) => ({ ...cur, vat_percent: Number.parseFloat(e.target.value) || 0, preset: "custom" }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: "14px" }}
                type="number"
                value={draft.vat_percent ?? 0}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
                {t("tariffFixedFee")}
              </label>
              <input
                className="st-input st-input--framed"
                min={0}
                onChange={(e) => setDraft((cur) => ({ ...cur, fixed_monthly_fee: Number.parseFloat(e.target.value) || 0, preset: "custom" }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: "14px" }}
                type="number"
                value={draft.fixed_monthly_fee ?? 0}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.9em" }}>
              <input
                checked={draft.include_vat !== false}
                className="st-switch"
                onChange={(e) => setDraft((cur) => ({ ...cur, include_vat: e.target.checked, preset: "custom" }))}
                type="checkbox"
              />
              <span>{t("tariffIncludeVat")}</span>
            </label>
          </div>

          {/* If Flat Mode */}
          {draft.mode === "flat" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.85em", fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
                {t("tariffTierRate")} ({draft.currency}/kWh)
              </label>
              <input
                className="st-input st-input--framed"
                min={0}
                onChange={(e) => setDraft((cur) => ({ ...cur, flat_rate: Number.parseFloat(e.target.value) || 0, preset: "custom" }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: "14px" }}
                type="number"
                value={draft.flat_rate ?? 0}
              />
            </div>
          )}

          {/* If Tiered Mode */}
          {draft.mode === "tiered" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: "0.9em" }}>{t("tariffTierListTitle")}</strong>
                <button
                  className="hd-pill hd-pill--primary"
                  onClick={handleAddTier}
                  style={{ fontSize: "0.8em", padding: "4px 10px" }}
                  type="button"
                >
                  <HDIcon name="plus" size={13} />
                  <span>{t("tariffAddTier")}</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {draft.tiers.map((tier, idx) => {
                  const isLast = idx === draft.tiers.length - 1;
                  return (
                    <div
                      key={tier.id ?? idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1.2fr 1.2fr auto",
                        gap: 8,
                        alignItems: "center",
                        background: "rgba(255, 255, 255, 0.04)",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <input
                        className="st-input"
                        onChange={(e) => handleUpdateTier(idx, { name: e.target.value })}
                        placeholder={t("tariffTierFallback").replace("{n}", String(idx + 1))}
                        style={{ padding: "6px 8px", borderRadius: 6, fontSize: "13px" }}
                        type="text"
                        value={tier.name ?? ""}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          className="st-input"
                          disabled={isLast}
                          min={0}
                          onChange={(e) => handleUpdateTier(idx, { max: Number.parseFloat(e.target.value) || null })}
                          placeholder={isLast ? "∞" : t("tariffTierMax")}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, fontSize: "13px" }}
                          type={isLast ? "text" : "number"}
                          value={isLast ? "∞" : (tier.max ?? "")}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          className="st-input"
                          min={0}
                          onChange={(e) => handleUpdateTier(idx, { rate: Number.parseFloat(e.target.value) || 0 })}
                          placeholder={t("tariffTierRate")}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, fontSize: "13px" }}
                          type="number"
                          value={tier.rate}
                        />
                      </div>
                      <button
                        aria-label={t("tariffDeleteTier")}
                        disabled={draft.tiers.length <= 1}
                        onClick={() => handleDeleteTier(idx)}
                        style={{
                          background: "transparent",
                          border: 0,
                          color: "rgba(255, 255, 255, 0.4)",
                          cursor: draft.tiers.length > 1 ? "pointer" : "default",
                          padding: 4,
                        }}
                        type="button"
                      >
                        <HDIcon name="close" size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Simulator */}
          {sim ? (
          <div
            style={{
              marginTop: 16,
              background: "rgba(255, 170, 0, 0.08)",
              border: "1px solid rgba(255, 170, 0, 0.25)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ fontSize: "0.9em", color: "#ffb43a", display: "flex", alignItems: "center", gap: 6 }}>
                <HDIcon name="bolt" size={16} />
                <span>{t("tariffSimulator")}</span>
              </strong>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.8em", opacity: 0.8 }}>{t("tariffSimulateKwh")}:</span>
                <input
                  className="st-input"
                  min={0}
                  onChange={(e) => setTestKwh(Number.parseFloat(e.target.value) || 0)}
                  style={{ width: 70, padding: "4px 8px", borderRadius: 6, fontSize: "13px" }}
                  type="number"
                  value={testKwh}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.85em", lineHeight: 1.6 }}>
              <div>
                <span>{t("tariffMode")}: </span>
                <b>{sim.tierName}</b> ({formatCurrency(sim.currentRate, draft.currency, draft.currency_position)}/kWh)
              </div>
              <div>
                <span>{t("tariffTotal")}: </span>
                <strong style={{ color: "#ffc94d", fontSize: "1.1em" }}>{sim.formattedTotal}</strong>
                {draft.include_vat !== false && (draft.vat_percent ?? 0) > 0 && (
                  <span style={{ opacity: 0.7, marginLeft: 6 }}>
                    ({t("tariffVat")}: {draft.vat_percent}% = {formatCurrency(sim.vatAmount, draft.currency, draft.currency_position)})
                  </span>
                )}
              </div>
            </div>
          </div>
          ) : <p role="alert">{t("tariffInvalid")}</p>}
        </div>

        <footer
          style={{
            padding: "calc(var(--u) * 1.4) calc(var(--u) * 2.2)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button className="hd-pill" onClick={onClose} type="button">
            {t("cancel")}
          </button>
          <button
            className="hd-pill hd-pill--primary"
            disabled={!valid}
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            type="button"
          >
            {t("save")}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export function EnergyBreakdownModal({
  periodKwh,
  language,
  onClose,
  onOpenSettings,
  t,
  tariffConfig,
}: {
  periodKwh: number;
  language?: string;
  onClose: () => void;
  onOpenSettings?: () => void;
  t: (key: TranslationKey) => string;
  tariffConfig?: EnergyTariffConfig;
}) {
  const res = calculateElectricityCost(periodKwh, tariffConfig, language, t);
  const cfg = tariffConfig ?? DEFAULT_ENERGY_TARIFF;
  const currency = cfg.currency || "đ";
  const pos = cfg.currency_position || "suffix";

  return createPortal(
    <div
      aria-modal="true"
      className="hd-modal-backdrop"
      onClick={onClose}
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "grid",
        placeItems: "center",
        padding: "calc(var(--u) * 2)",
      }}
    >
      <div
        className="energy-receipt-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 480px)",
          maxHeight: "85vh",
          background: "var(--paper, #181d24)",
          borderRadius: "calc(var(--u) * 2.2)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.65)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "calc(var(--u) * 1.8) calc(var(--u) * 2.2)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#ffc94d" }}>
              <HDIcon name="bolt" size={22} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "calc(var(--u) * 1.8)", fontWeight: 700 }}>
                {t("tariffReceipt")}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.85em", opacity: 0.7 }}>
                {t("tariffPeriodUsage").replace("{kwh}", periodKwh.toFixed(1))}
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="hd-close"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: 0,
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--ink)",
            }}
            type="button"
          >
            <HDIcon name="close" size={16} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "calc(var(--u) * 2) calc(var(--u) * 2.2)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {res.breakdown.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: 8,
                  fontSize: "0.9em",
                }}
              >
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                    {item.kwhUsed} kWh × {formatCurrency(item.rate, currency, pos, language)}
                  </div>
                </div>
                <strong>{formatCurrency(item.cost, currency, pos, language)}</strong>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px dashed rgba(255, 255, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: "0.9em",
            }}
          >
            {cfg.fixed_monthly_fee ? (
              <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.85 }}>
                <span>{t("tariffFixedFee")}</span>
                <span>{formatCurrency(cfg.fixed_monthly_fee, currency, pos, language)}</span>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.85 }}>
              <span>{t("tariffSubtotal")}</span>
              <span>{formatCurrency(res.subtotal, currency, pos, language)}</span>
            </div>

            {cfg.include_vat !== false && (cfg.vat_percent ?? 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.85 }}>
                <span>{t("tariffVatAmount")} ({cfg.vat_percent}%)</span>
                <span>{formatCurrency(res.vatAmount, currency, pos, language)}</span>
              </div>
            )}

            <div
              style={{
                marginTop: 6,
                paddingTop: 8,
                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <strong style={{ fontSize: "1.05em" }}>{t("tariffTotal")}</strong>
              <strong style={{ color: "#ffc94d", fontSize: "1.25em" }}>
                {res.formattedTotal}
              </strong>
            </div>
          </div>
        </div>

        <footer
          style={{
            padding: "calc(var(--u) * 1.4) calc(var(--u) * 2.2)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {onOpenSettings ? (
            <button
              className="hd-pill"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              style={{ fontSize: "0.85em" }}
              type="button"
            >
              <HDIcon name="settings" size={14} />
              <span>{t("tariffEditBtn")}</span>
            </button>
          ) : <div />}
          <button className="hd-pill hd-pill--primary" onClick={onClose} type="button">
            {t("done")}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
