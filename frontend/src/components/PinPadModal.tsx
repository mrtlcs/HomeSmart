import { useState } from "react";
import { createPortal } from "react-dom";
import type { TranslationKey } from "../i18n";
import { HDIcon } from "./HDIcon";

interface Props {
  expectedPin: string;
  onCancel: () => void;
  onSuccess: () => void;
  t: (key: TranslationKey) => string;
  title?: string;
}

export function PinPadModal({ expectedPin, onCancel, onSuccess, t, title }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (error) setError(false);
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);

    if (next.length === 4) {
      if (next === expectedPin) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    if (error) setError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const modal = (
    <div
      className="pin-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`pin-dialog ${error ? "pin-dialog__shake" : ""}`}>
        <span style={{ fontSize: "calc(var(--u) * 2.2)", fontWeight: 700 }}>
          {title ?? t("pinEnter")}
        </span>
        <small style={{ color: error ? "#ff6b5e" : "var(--ink-2)", fontWeight: 500 }}>
          {error ? t("pinIncorrect") : t("pinPrompt")}
        </small>

        <div className="pin-dialog__dots">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`pin-dialog__dot ${idx < pin.length ? "pin-dialog__dot--filled" : ""}`}
            />
          ))}
        </div>

        <div className="pin-dialog__grid">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              className="pin-dialog__key"
              onClick={() => handleDigit(d)}
              type="button"
            >
              {d}
            </button>
          ))}
          <button
            className="pin-dialog__key"
            onClick={onCancel}
            style={{ fontSize: "calc(var(--u) * 1.6)", opacity: 0.8 }}
            type="button"
          >
            {t("close")}
          </button>
          <button
            className="pin-dialog__key"
            onClick={() => handleDigit("0")}
            type="button"
          >
            0
          </button>
          <button
            aria-label="Backspace"
            className="pin-dialog__key"
            onClick={handleBackspace}
            type="button"
          >
            <HDIcon name="close" size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
}
