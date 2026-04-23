"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardMacrosCalculatorHeaderProps = {
  onBack: () => void;
  name?: string;
};

export function DashboardMacrosCalculatorHeader({ onBack, name }: DashboardMacrosCalculatorHeaderProps) {
  return <SettingsScreenHeader title="Calculadora de macros" name={name} onBack={onBack} />;
}
