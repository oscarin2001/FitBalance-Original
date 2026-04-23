"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardTermsOfServiceHeaderProps = {
  onBack: () => void;
};

export function DashboardTermsOfServiceHeader({ onBack }: DashboardTermsOfServiceHeaderProps) {
  return <SettingsScreenHeader title="Términos de servicio" onBack={onBack} />;
}