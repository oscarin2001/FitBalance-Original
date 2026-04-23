"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardMacronutrientsEnergyHeaderProps = {
  name?: string;
  onBack: () => void;
};

export function DashboardMacronutrientsEnergyHeader({ name, onBack }: DashboardMacronutrientsEnergyHeaderProps) {
  return <SettingsScreenHeader title="Metas de macronutrientes y energía" name={name} onBack={onBack} />;
}
