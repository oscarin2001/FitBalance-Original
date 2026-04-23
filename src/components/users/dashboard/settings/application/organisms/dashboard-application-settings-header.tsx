"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardApplicationSettingsHeaderProps = {
  onBack: () => void;
  name?: string;
};

export function DashboardApplicationSettingsHeader({ onBack, name }: DashboardApplicationSettingsHeaderProps) {
  return <SettingsScreenHeader title="Ajustes de la aplicación" name={name} onBack={onBack} />;
}
