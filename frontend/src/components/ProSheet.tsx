import { useEffect } from "react";
import type { TranslationKey } from "../i18n";
import type { LicenseStatus } from "../api/license";
import type { UpsellReason } from "../plan";
import type { HomeAssistant } from "../types/home-assistant";

interface ProSheetProps {
  hass: HomeAssistant;
  language?: string;
  license: LicenseStatus | null;
  onActivate: (key: string) => Promise<void>;
  onClose: () => void;
  onLicense: (license: LicenseStatus) => void;
  reason: UpsellReason;
  t: (key: TranslationKey) => string;
}

export const LICENSE_ERRORS: Record<string, TranslationKey> = {};

export function ProSheet({ onClose }: ProSheetProps) {
  useEffect(() => {
    onClose();
  }, [onClose]);
  return null;
}
