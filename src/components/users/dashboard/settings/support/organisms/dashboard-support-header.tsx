"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardSupportHeaderProps = {
  onBack: () => void;
};

export function DashboardSupportHeader({ onBack }: DashboardSupportHeaderProps) {
  return <SettingsScreenHeader title="Ayuda y soporte" onBack={onBack} />;
}