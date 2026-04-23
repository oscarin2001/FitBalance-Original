"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardPrivacyPolicyHeaderProps = {
  onBack: () => void;
};

export function DashboardPrivacyPolicyHeader({ onBack }: DashboardPrivacyPolicyHeaderProps) {
  return <SettingsScreenHeader title="Aviso de privacidad" onBack={onBack} />;
}